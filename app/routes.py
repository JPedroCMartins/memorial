# /app/routes.py
#
# Backend do Memorial: API JSON consumida pelo frontend React (pasta frontend/).
# Todas as rotas de dados ficam sob /api. Além delas, este blueprint:
#   - serve os arquivos enviados (/uploads/<memorial_id>/<arquivo>);
#   - serve o build do React (frontend/dist) para qualquer outra URL (SPA).
#
# Autenticação: cookie de sessão do Flask-Login (mesma origem do React).
# Proteção CSRF: Flask-WTF. O React busca o token em /api/csrf e o envia no
# header X-CSRFToken em toda requisição que altera dados (POST/PUT/PATCH/DELETE).

import os
import re
import shutil
import unicodedata
import uuid
from datetime import timezone
from functools import wraps

from flask import (
    Blueprint, abort, current_app, jsonify, request, send_from_directory,
)
from flask_login import current_user, login_required, login_user, logout_user
from flask_wtf.csrf import generate_csrf

from . import db
from .models import Comentario, Memorial, User

bp = Blueprint('memorial', __name__)

# Extensões aceitas por tipo de mídia. Validar por tipo evita, por exemplo,
# que um .mp3 seja enviado no campo de imagens da galeria.
EXT_IMAGEM = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
EXT_VIDEO = {'mp4', 'mov', 'webm'}
EXT_AUDIO = {'mp3', 'wav', 'ogg', 'm4a'}

# Mapeia o "tipo" usado pela API -> (campo do multipart, extensões, coluna no modelo).
# logo/banner são arquivos únicos; as galerias guardam nomes separados por vírgula.
TIPOS_ARQUIVO = {
    'logo': ('logo', EXT_IMAGEM, 'logo_filename'),
    'banner': ('banner', EXT_IMAGEM, 'banner_filename'),
    'imagem': ('imagens', EXT_IMAGEM, 'gallery_images'),
    'video': ('videos', EXT_VIDEO, 'gallery_videos'),
    'audio': ('audios', EXT_AUDIO, 'gallery_audios'),
}
TIPOS_UNICOS = ('logo', 'banner')
TIPOS_GALERIA = ('imagem', 'video', 'audio')

CAMPOS_MEMORIAL = ('nome', 'nascimento', 'falecimento', 'frase_efeito', 'biografia', 'url_personalizada')
TAMANHO_MINIMO_SENHA = 8


# ============================================================
# HELPERS
# ============================================================
def erro(mensagem, status=400, **extra):
    """Resposta de erro padrão da API: {"erro": "..."} + status HTTP."""
    return jsonify({'erro': mensagem, **extra}), status


def dados_requisicao():
    """Lê o corpo como JSON; se não for JSON, cai para o form (multipart)."""
    return request.get_json(silent=True) or request.form


def texto(dados, campo):
    """Pega um campo de texto já sem espaços nas pontas ('' se ausente)."""
    valor = dados.get(campo)
    return valor.strip() if isinstance(valor, str) else ''


def is_admin_user(user=None):
    user = user or current_user
    if not user.is_authenticated:
        return False
    return user.email in current_app.config.get('ADMIN_EMAILS', [])


def admin_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not is_admin_user():
            abort(403)
        return func(*args, **kwargs)
    return wrapper


def normalizar_slug(valor):
    """
    Converte um texto livre em slug seguro para URL.
    Ex.: 'Maria José da Silva!' -> 'maria-jose-da-silva'
    """
    valor = unicodedata.normalize('NFKD', valor or '').encode('ascii', 'ignore').decode('ascii')
    valor = re.sub(r'[^a-z0-9]+', '-', valor.lower())
    return valor.strip('-')[:200]


def pasta_memorial(memorial_id):
    return os.path.join(current_app.config['UPLOAD_FOLDER'], str(memorial_id))


def extensao(filename):
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''


def lista_galeria(valor):
    """Converte a string 'a.jpg,b.jpg' do banco em lista (ignorando vazios)."""
    return [f for f in (valor or '').split(',') if f]


def url_arquivo(memorial_id, filename):
    return f'/uploads/{memorial_id}/{filename}'


def arquivos_enviados():
    """
    Coleta os arquivos do request agrupados por tipo e valida as extensões
    ANTES de salvar qualquer coisa (assim um arquivo inválido não deixa lixo no disco).
    Retorna (dict tipo -> [FileStorage], mensagem_de_erro | None).
    """
    por_tipo = {}
    for tipo, (campo, extensoes, _coluna) in TIPOS_ARQUIVO.items():
        arquivos = [f for f in request.files.getlist(campo) if f and f.filename]
        if tipo in TIPOS_UNICOS:
            arquivos = arquivos[:1]
        for f in arquivos:
            if extensao(f.filename) not in extensoes:
                aceitas = ', '.join(sorted(extensoes))
                return None, f'Arquivo "{f.filename}" não é aceito em {campo}. Use: {aceitas}.'
        por_tipo[tipo] = arquivos
    return por_tipo, None


def salvar_upload(file, pasta):
    """Salva o arquivo com nome único (uuid4 + extensão original) e retorna o nome gerado."""
    nome_unico = f'{uuid.uuid4().hex}.{extensao(file.filename)}'
    file.save(os.path.join(pasta, nome_unico))
    return nome_unico


def remover_arquivo(memorial_id, filename):
    """Apaga um arquivo da pasta do memorial, se existir. basename() impede '../'."""
    if not filename:
        return
    caminho = os.path.join(pasta_memorial(memorial_id), os.path.basename(filename))
    if os.path.isfile(caminho):
        os.remove(caminho)


def aplicar_arquivos(memorial, por_tipo):
    """
    Salva os arquivos enviados e atualiza o memorial.
    - logo/banner: substitui e apaga o arquivo antigo do disco (evita órfãos);
    - galerias: acrescenta aos arquivos já existentes.
    """
    pasta = pasta_memorial(memorial.id)
    os.makedirs(pasta, exist_ok=True)
    antigos = []
    for tipo, arquivos in por_tipo.items():
        if not arquivos:
            continue
        coluna = TIPOS_ARQUIVO[tipo][2]
        if tipo in TIPOS_UNICOS:
            antigos.append(getattr(memorial, coluna))
            setattr(memorial, coluna, salvar_upload(arquivos[0], pasta))
        else:
            nomes = lista_galeria(getattr(memorial, coluna))
            nomes += [salvar_upload(f, pasta) for f in arquivos]
            setattr(memorial, coluna, ','.join(nomes))
    return antigos  # o chamador apaga os antigos só depois do commit


def validar_campos_memorial(dados, memorial_id=None):
    """Valida os campos de texto do memorial. Retorna (valores, erro | None)."""
    valores = {campo: texto(dados, campo) for campo in CAMPOS_MEMORIAL}
    faltando = [campo for campo, v in valores.items() if not v]
    if faltando:
        return None, ('Preencha todos os campos obrigatórios.', {'campos': faltando})

    slug = normalizar_slug(valores['url_personalizada'])
    if not slug:
        return None, ('URL personalizada inválida. Use letras, números e hífens.', {'campos': ['url_personalizada']})
    existente = Memorial.query.filter_by(url_personalizada=slug).first()
    if existente and existente.id != memorial_id:
        return None, ('Esta URL personalizada já está em uso. Escolha outra.', {'campos': ['url_personalizada'], 'status': 409})
    valores['url_personalizada'] = slug
    return valores, None


def comentario_to_dict(c):
    return {
        'id': c.id,
        'nome_autor': c.nome_autor,
        'texto': c.texto,
        # O banco guarda UTC "ingênuo" (sem fuso); marcamos como UTC para o navegador converter.
        'data_criacao': c.data_criacao.replace(tzinfo=timezone.utc).isoformat() if c.data_criacao else None,
        'is_visible': c.is_visible,
    }


def memorial_to_dict(m, publico=False):
    """
    Serializa o memorial para a API.
    publico=True: só comentários visíveis (página pública).
    publico=False: todos os comentários (painel do dono).
    """
    def arquivo(nome):
        return {'filename': nome, 'url': url_arquivo(m.id, nome)} if nome else None

    comentarios = sorted(m.comentarios, key=lambda c: c.data_criacao or 0, reverse=True)
    if publico:
        comentarios = [c for c in comentarios if c.is_visible]

    return {
        'id': m.id,
        'nome': m.nome,
        'nascimento': m.nascimento,
        'falecimento': m.falecimento,
        'frase_efeito': m.frase_efeito,
        'biografia': m.biografia,
        'url_personalizada': m.url_personalizada,
        'logo': arquivo(m.logo_filename),
        'banner': arquivo(m.banner_filename),
        'imagens': [arquivo(n) for n in lista_galeria(m.gallery_images)],
        'videos': [arquivo(n) for n in lista_galeria(m.gallery_videos)],
        'audios': [arquivo(n) for n in lista_galeria(m.gallery_audios)],
        'comentarios': [comentario_to_dict(c) for c in comentarios],
    }


def usuario_to_dict(u):
    return {'id': u.id, 'nome': u.username, 'email': u.email, 'is_admin': is_admin_user(u)}


def memorial_do_dono(memorial_id):
    """Busca o memorial (404) e garante que pertence ao usuário logado (403)."""
    memorial = db.get_or_404(Memorial, memorial_id)
    if memorial.user_id != current_user.id:
        abort(403)
    return memorial


# ============================================================
# SESSÃO / CSRF / AUTENTICAÇÃO
# ============================================================
@bp.route('/api/csrf')
def csrf():
    # O React chama esta rota uma vez ao carregar e guarda o token em memória.
    return jsonify({'csrf_token': generate_csrf()})


@bp.route('/api/me')
def me():
    # Retorna 200 com usuario=null quando não logado (evita erro no console do navegador).
    if not current_user.is_authenticated:
        return jsonify({'usuario': None})
    return jsonify({'usuario': usuario_to_dict(current_user)})


@bp.route('/api/auth/registrar', methods=['POST'])
def register():
    dados = dados_requisicao()
    name, email, password = texto(dados, 'name'), texto(dados, 'email').lower(), dados.get('password') or ''

    if not name or not email or not password:
        return erro('Preencha nome, e-mail e senha.')
    if '@' not in email or len(email) > 120:
        return erro('Informe um e-mail válido.')
    if len(password) < TAMANHO_MINIMO_SENHA:
        return erro(f'A senha deve ter pelo menos {TAMANHO_MINIMO_SENHA} caracteres.')

    # VALIDAÇÃO: Verifica se o e-mail já existe
    if User.query.filter(db.func.lower(User.email) == email).first():
        return erro('Este e-mail já está cadastrado. Por favor, tente fazer login.', 409)

    new_user = User(username=name[:80], email=email)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    # Já entra logado após o cadastro (melhor experiência no SPA).
    login_user(new_user)
    return jsonify({'usuario': usuario_to_dict(new_user)}), 201


@bp.route('/api/auth/login', methods=['POST'])
def login():
    dados = dados_requisicao()
    email, password = texto(dados, 'email').lower(), dados.get('password') or ''

    user = User.query.filter(db.func.lower(User.email) == email).first()
    if not user or not user.check_password(password):
        return erro('E-mail ou senha inválidos. Por favor, tente novamente.', 401)

    login_user(user)
    return jsonify({'usuario': usuario_to_dict(user)})


@bp.route('/api/auth/logout', methods=['POST'])
def logout():
    logout_user()
    return jsonify({'ok': True})


# ============================================================
# MEMORIAIS (área do dono)
# ============================================================
@bp.route('/api/memoriais')
@login_required
def listar_memoriais():
    memoriais = Memorial.query.filter_by(user_id=current_user.id).order_by(Memorial.id.desc()).all()
    return jsonify({'memoriais': [memorial_to_dict(m) for m in memoriais]})


@bp.route('/api/memoriais', methods=['POST'])
@login_required
def create():
    # --- Parte 1: Validar dados e arquivos ANTES de gravar qualquer coisa ---
    valores, problema = validar_campos_memorial(request.form)
    if problema:
        msg, extra = problema
        return erro(msg, extra.pop('status', 400), **extra)
    por_tipo, msg = arquivos_enviados()
    if msg:
        return erro(msg)

    # --- Parte 2: Criar o objeto e usar flush() para obter o ID (nome da pasta) ---
    memorial = Memorial(**valores, user_id=current_user.id)
    db.session.add(memorial)
    try:
        db.session.flush()
        # --- Parte 3: Salvar arquivos e confirmar ---
        aplicar_arquivos(memorial, por_tipo)
        db.session.commit()
    except Exception:
        db.session.rollback()
        if memorial.id:
            shutil.rmtree(pasta_memorial(memorial.id), ignore_errors=True)
        current_app.logger.exception('Erro ao criar memorial')
        return erro('Ocorreu um erro ao criar o memorial. Tente novamente.', 500)

    return jsonify({'memorial': memorial_to_dict(memorial)}), 201


@bp.route('/api/memoriais/<int:memorial_id>')
@login_required
def detalhar_memorial(memorial_id):
    return jsonify({'memorial': memorial_to_dict(memorial_do_dono(memorial_id))})


@bp.route('/api/memoriais/<int:memorial_id>', methods=['PUT'])
@login_required
def edit_memorial(memorial_id):
    memorial = memorial_do_dono(memorial_id)

    valores, problema = validar_campos_memorial(request.form, memorial_id=memorial.id)
    if problema:
        msg, extra = problema
        return erro(msg, extra.pop('status', 400), **extra)
    por_tipo, msg = arquivos_enviados()
    if msg:
        return erro(msg)

    # Atualiza os campos do memorial com os dados do formulário
    for campo, valor in valores.items():
        setattr(memorial, campo, valor)
    # Atualiza os arquivos (logo, banner, galerias) se novos arquivos forem enviados
    antigos = aplicar_arquivos(memorial, por_tipo)
    db.session.commit()

    # Só depois do commit apagamos o logo/banner substituídos.
    for nome in antigos:
        remover_arquivo(memorial.id, nome)
    return jsonify({'memorial': memorial_to_dict(memorial)})


@bp.route('/api/memoriais/<int:memorial_id>', methods=['DELETE'])
@login_required
def delete(memorial_id):
    # Busca + verificação de permissão (dono), via helper.
    memorial = memorial_do_dono(memorial_id)

    # Apaga o registro (comentários vão junto pelo cascade) e depois a pasta com
    # TODOS os arquivos. Se apagar a pasta falhar, o registro já não existe e a
    # pasta vira lixo inofensivo — melhor que um memorial apontando para arquivos inexistentes.
    db.session.delete(memorial)
    db.session.commit()
    shutil.rmtree(pasta_memorial(memorial_id), ignore_errors=True)
    return jsonify({'ok': True})


@bp.route('/api/memoriais/<int:memorial_id>/arquivos', methods=['DELETE'])
@login_required
def delete_file(memorial_id):
    memorial = memorial_do_dono(memorial_id)
    dados = dados_requisicao()
    filename, tipo = texto(dados, 'filename'), texto(dados, 'tipo')

    if tipo not in TIPOS_ARQUIVO or not filename:
        return erro('Parâmetros inválidos.')

    coluna = TIPOS_ARQUIVO[tipo][2]
    # Segurança: só apaga do disco se o arquivo realmente pertence a este memorial.
    if tipo in TIPOS_UNICOS:
        if getattr(memorial, coluna) != filename:
            return erro('Arquivo não encontrado neste memorial.', 404)
        setattr(memorial, coluna, None)
    else:
        nomes = lista_galeria(getattr(memorial, coluna))
        if filename not in nomes:
            return erro('Arquivo não encontrado neste memorial.', 404)
        nomes.remove(filename)
        setattr(memorial, coluna, ','.join(nomes) or None)

    db.session.commit()
    remover_arquivo(memorial.id, filename)
    return jsonify({'memorial': memorial_to_dict(memorial)})


# ============================================================
# COMENTÁRIOS
# ============================================================
@bp.route('/api/comentarios/<int:comment_id>', methods=['PATCH'])
@login_required
def toggle_comment(comment_id):
    comentario = db.get_or_404(Comentario, comment_id)
    # Verificação de segurança crucial: só o dono do memorial modera.
    if comentario.memorial.user_id != current_user.id:
        abort(403)

    dados = request.get_json(silent=True) or {}
    if isinstance(dados.get('is_visible'), bool):
        comentario.is_visible = dados['is_visible']
    else:
        # A lógica de toggle: inverte o valor booleano
        comentario.is_visible = not comentario.is_visible
    db.session.commit()
    return jsonify({'comentario': comentario_to_dict(comentario)})


@bp.route('/api/comentarios/<int:comment_id>', methods=['DELETE'])
@login_required
def delete_comment(comment_id):
    comentario = db.get_or_404(Comentario, comment_id)
    if comentario.memorial.user_id != current_user.id:
        abort(403)
    db.session.delete(comentario)
    db.session.commit()
    return jsonify({'ok': True})


# ============================================================
# PÁGINA PÚBLICA
# ============================================================
@bp.route('/api/publico/<slug>')
def view_memorial(slug):
    # Busca o memorial pela URL personalizada. Se não encontrar, retorna 404.
    memorial = Memorial.query.filter_by(url_personalizada=slug).first_or_404()
    return jsonify({'memorial': memorial_to_dict(memorial, publico=True)})


@bp.route('/api/publico/<slug>/comentarios', methods=['POST'])
def add_comment(slug):
    memorial = Memorial.query.filter_by(url_personalizada=slug).first_or_404()
    dados = dados_requisicao()
    nome, texto_comentario = texto(dados, 'nome_autor'), texto(dados, 'texto')

    if not nome or not texto_comentario:
        return erro('Informe seu nome e sua mensagem.')
    if len(nome) > 100 or len(texto_comentario) > 5000:
        return erro('Nome (até 100) ou mensagem (até 5000 caracteres) muito longos.')

    # is_visible já é False por padrão: o dono precisa aprovar.
    novo_comentario = Comentario(nome_autor=nome, texto=texto_comentario, memorial_id=memorial.id)
    db.session.add(novo_comentario)
    db.session.commit()
    return jsonify({'mensagem': 'Sua mensagem foi enviada com sucesso e aguarda aprovação!'}), 201


# ============================================================
# ADMIN
# ============================================================
@bp.route('/api/admin/usuarios')
@login_required
@admin_required
def admin():
    usuarios = User.query.order_by(User.id).all()
    dados = []
    for u in usuarios:
        # User não tem relationship 'memoriais'; filtramos pelo user_id.
        memoriais = Memorial.query.filter_by(user_id=u.id).all()
        dados.append({
            **usuario_to_dict(u),
            'memoriais': [
                {'id': m.id, 'nome': m.nome, 'url_personalizada': m.url_personalizada,
                 'total_comentarios': len(m.comentarios)}
                for m in memoriais
            ],
            'total_memoriais': len(memoriais),
            'total_comentarios': sum(len(m.comentarios) for m in memoriais),
        })
    return jsonify({'usuarios': dados})


@bp.route('/api/admin/usuarios/<int:user_id>/senha', methods=['POST'])
@login_required
@admin_required
def admin_reset_password(user_id):
    usuario = db.get_or_404(User, user_id)
    nova_senha = (dados_requisicao().get('nova_senha') or '').strip()

    if len(nova_senha) < TAMANHO_MINIMO_SENHA:
        return erro(f'A nova senha deve ter pelo menos {TAMANHO_MINIMO_SENHA} caracteres.')

    usuario.set_password(nova_senha)
    db.session.commit()
    return jsonify({'mensagem': f'Senha do usuário "{usuario.username}" redefinida com sucesso.'})


@bp.route('/api/admin/usuarios/<int:user_id>', methods=['DELETE'])
@login_required
@admin_required
def admin_delete_user(user_id):
    usuario = db.get_or_404(User, user_id)

    if is_admin_user(usuario):
        return erro('Não é possível excluir um administrador.', 403)

    # Exclui os memoriais do usuário (com arquivos no disco)
    memorials = Memorial.query.filter_by(user_id=user_id).all()
    ids = [m.id for m in memorials]
    for m in memorials:
        db.session.delete(m)
    db.session.delete(usuario)
    db.session.commit()
    for mid in ids:
        shutil.rmtree(pasta_memorial(mid), ignore_errors=True)
    return jsonify({'mensagem': f'Usuário "{usuario.username}" e todos os seus memoriais foram excluídos.'})


# ============================================================
# ARQUIVOS ENVIADOS E FRONTEND (SPA)
# ============================================================
@bp.route('/uploads/<int:memorial_id>/<path:filename>')
def uploaded_file(memorial_id, filename):
    """
    Serve um arquivo de upload para um memorial específico.
    Usa send_from_directory para segurança contra ataques de 'Directory Traversal'.
    """
    return send_from_directory(pasta_memorial(memorial_id), filename)


@bp.route('/', defaults={'path': ''})
@bp.route('/<path:path>')
def spa(path):
    """
    Serve o build do React. Arquivos existentes (assets, logo) são enviados
    diretamente; qualquer outra rota cai no index.html e o React Router decide.
    """
    if path.startswith('api/'):
        abort(404)
    dist = current_app.config['FRONTEND_DIST']
    if path and os.path.isfile(os.path.join(dist, path)):
        return send_from_directory(dist, path)
    if not os.path.isfile(os.path.join(dist, 'index.html')):
        return ('Frontend não compilado. Rode: cd frontend && npm install && npm run build', 503)
    return send_from_directory(dist, 'index.html')
