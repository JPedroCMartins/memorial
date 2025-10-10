import shutil
import uuid
from flask import Blueprint, abort, jsonify, render_template, request, redirect, send_from_directory, url_for, flash, current_app
from flask_login import current_user, login_required, login_user, logout_user
from .models import Memorial, User, Comentario
from . import db
from urllib.parse import urlparse, urljoin # Importado para a validação do redirect
from werkzeug.utils import secure_filename

import os
bp = Blueprint('memorial', __name__)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'mov', 'mp3', 'wav'}
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

#--- index route ---
@bp.route('/m')
@login_required
def index():
    memoriais = Memorial.query.filter_by(user_id=current_user.id).all()

    return render_template('home.html', user=current_user, memoriais=memoriais)

#--- view memorial route ---
@bp.route('/m/<url_personalizada>')
def view_memorial(url_personalizada):
    # Busca o memorial pela URL personalizada. Se não encontrar, retorna 404.
    memorial = Memorial.query.filter_by(url_personalizada=url_personalizada).first_or_404()
    
    # É uma boa prática preparar URLs completas aqui, em vez de na template,
    # embora url_for funcione bem em ambos os lugares.
    
    return render_template('memorial_publico.html', memorial=memorial)

#--- add comment route ---
@bp.route('/m/<int:memorial_id>/comentar', methods=['POST'])
def add_comment(memorial_id):
    memorial = Memorial.query.get_or_404(memorial_id)
    
    if request.method == 'POST':
        nome = request.form.get('nome_autor')
        texto_comentario = request.form.get('texto')
        
        novo_comentario = Comentario(
            nome_autor=nome,
            texto=texto_comentario,
            memorial_id=memorial.id
            # is_visible já é False por padrão
        )
        
        db.session.add(novo_comentario)
        db.session.commit()
        
        flash('Sua mensagem foi enviada com sucesso e aguarda aprovação!', 'success')
        
        # Redireciona de volta para a mesma página do memorial
        return redirect(url_for('memorial.view_memorial', url_personalizada=memorial.url_personalizada))

#--- toggle comment visibility route ---
@bp.route('/comentario/<int:comment_id>/toggle', methods=['POST'])
@login_required
def toggle_comment(comment_id):
    comentario = Comentario.query.get_or_404(comment_id)
    # Verificação de segurança crucial
    if comentario.memorial.user_id != current_user.id:
        abort(403)
        
    # A lógica de toggle: inverte o valor booleano
    comentario.is_visible = not comentario.is_visible
    db.session.commit()
    
    if comentario.is_visible:
        flash(f'Comentário de {comentario.nome_autor} agora está visível.', 'success')
    else:
        flash(f'Comentário de {comentario.nome_autor} foi ocultado.', 'info')
        
    # Redireciona de volta para o painel principal
    return redirect(url_for('memorial.index'))

#--- delete comment route ---
@bp.route('/comentario/<int:comment_id>/apagar', methods=['POST'])
@login_required
def delete_comment(comment_id):
    comentario = Comentario.query.get_or_404(comment_id)
    # Verificação de segurança
    if comentario.memorial.user_id != current_user.id:
        abort(403)
        
    db.session.delete(comentario)
    db.session.commit()
    flash('Comentário apagado permanentemente.', 'info')
    
    # --- APENAS ESTA LINHA MUDA ---
    return redirect(url_for('memorial.index'))

#-- create memorial route ---
@bp.route('/m/create', methods=['POST'])
@login_required
def create():
    # --- Parte 1: Obter dados do formulário ---
    nome = request.form.get('nome')
    nascimento = request.form.get('nascimento')
    falecimento = request.form.get('falecimento')
    frase_efeito = request.form.get('frase_efeito')
    biografia = request.form.get('biografia')
    url_personalizada = request.form.get('url_personalizada')

    # --- Parte 2: Criar o objeto Memorial (sem os nomes dos arquivos ainda) ---
    new_memorial = Memorial(
        nome=nome, nascimento=nascimento, falecimento=falecimento, frase_efeito=frase_efeito,
        biografia=biografia, url_personalizada=url_personalizada, user_id=current_user.id
    )
    db.session.add(new_memorial)

    try:
        # --- Parte 3: Usar flush() para obter o ID ---
        db.session.flush()
        
        # --- Parte 4: Criar diretório e processar arquivos ---
        memorial_path = os.path.join(current_app.config['UPLOAD_FOLDER'], str(new_memorial.id))
        os.makedirs(memorial_path, exist_ok=True)

        # --- FUNÇÕES AUXILIARES MODIFICADAS ---
        
        # Esta função agora gera um nome único e o retorna
        def save_and_get_unique_filename(file, target_path):
            if file and file.filename != '' and allowed_file(file.filename):
                # Pega a extensão original do arquivo (ex: '.jpg')
                extension = os.path.splitext(file.filename)[1]
                # Gera um nome de arquivo aleatório e único com a extensão original
                unique_filename = f"{uuid.uuid4().hex}{extension}"
                
                file.save(os.path.join(target_path, unique_filename))
                return unique_filename
            return None

        # --- LÓGICA DE SALVAMENTO ATUALIZADA ---
        
        # Salva os arquivos únicos e atualiza o objeto
        logo_file = request.files.get('logo_upload')
        banner_file = request.files.get('banner_upload')
        
        logo_saved_name = save_and_get_unique_filename(logo_file, memorial_path)
        if logo_saved_name:
            new_memorial.logo_filename = logo_saved_name
            
        banner_saved_name = save_and_get_unique_filename(banner_file, memorial_path)
        if banner_saved_name:
            new_memorial.banner_filename = banner_saved_name

        # Salva os arquivos das galerias
        image_filenames = []
        video_filenames = []
        audio_filenames = []

        for file in request.files.getlist('images_upload'):
            saved_name = save_and_get_unique_filename(file, memorial_path)
            if saved_name:
                image_filenames.append(saved_name)

        for file in request.files.getlist('videos_upload'):
            saved_name = save_and_get_unique_filename(file, memorial_path)
            if saved_name:
                video_filenames.append(saved_name)

        for file in request.files.getlist('audios_upload'):
            saved_name = save_and_get_unique_filename(file, memorial_path)
            if saved_name:
                audio_filenames.append(saved_name)

        # Junta os NOMES ÚNICOS gerados em uma string
        if image_filenames:
            new_memorial.gallery_images = ",".join(image_filenames)
        if video_filenames:
            new_memorial.gallery_videos = ",".join(video_filenames)
        if audio_filenames:
            new_memorial.gallery_audios = ",".join(audio_filenames)

        db.session.commit()
        flash(f'Memorial para {nome} criado com sucesso!', 'success')

    except Exception as e:
        db.session.rollback()
        flash(f'Ocorreu um erro ao criar o memorial: {e}', 'danger')

    return redirect(url_for('memorial.index'))

#-- delete memorial route ---
@bp.route('/m/delete/<int:id>', methods=['POST'])
@login_required
def delete(id):
    # 1. Busca o memorial no banco de dados. Se não encontrar, retorna erro 404 (Not Found).
    memorial = Memorial.query.get_or_404(id)

    # 2. VERIFICAÇÃO DE PERMISSÃO (AUTORIZAÇÃO)
    # Garante que o usuário logado é o dono do memorial. Se não for, retorna erro 403 (Forbidden).
    if memorial.user_id != current_user.id:
        abort(403)

    # 3. LÓGICA PARA APAGAR A PASTA E OS ARQUIVOS
    # É importante fazer isso ANTES de apagar o registro do banco.
    try:
        memorial_path = os.path.join(current_app.config['UPLOAD_FOLDER'], str(memorial.id))
        
        # Verifica se o diretório existe antes de tentar apagá-lo
        if os.path.exists(memorial_path):
            # shutil.rmtree apaga a pasta e TUDO que estiver dentro dela
            shutil.rmtree(memorial_path)
            
    except Exception as e:
        # Se houver um erro ao apagar os arquivos (ex: permissão), exibe uma mensagem de erro.
        flash(f"Ocorreu um erro ao apagar os arquivos do memorial: {e}", "danger")
        return redirect(url_for('memorial.index'))

    # 4. APAGA O REGISTRO DO BANCO DE DADOS
    db.session.delete(memorial)
    db.session.commit()

    flash("Memorial apagado com sucesso.", "success")
    return redirect(url_for('memorial.index'))

#-- edit memorial route ---
@bp.route('/m/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def edit_memorial(id):
    memorial = Memorial.query.get_or_404(id)

    # Verificação de autorização
    if memorial.user_id != current_user.id:
        abort(403)

    if request.method == 'POST':
        # Atualiza os campos do memorial com os dados do formulário
        memorial.nome = request.form.get('nome')
        memorial.nascimento = request.form.get('nascimento')
        memorial.falecimento = request.form.get('falecimento')
        memorial.frase_efeito = request.form.get('frase_efeito')
        memorial.biografia = request.form.get('biografia')
        memorial.url_personalizada = request.form.get('url_personalizada')

        #ATUALIZAR os arquivos (logo, banner, galerias) se novos arquivos forem enviados
        memorial_path = os.path.join(current_app.config['UPLOAD_FOLDER'], str(memorial.id))
        os.makedirs(memorial_path, exist_ok=True)
        def save_and_get_unique_filename(file, target_path):
            if file and file.filename != '' and allowed_file(file.filename):
                extension = os.path.splitext(file.filename)[1]
                unique_filename = f"{uuid.uuid4().hex}{extension}"
                file.save(os.path.join(target_path, unique_filename))
                return unique_filename
            return None
        logo_file = request.files.get('logo_upload')
        banner_file = request.files.get('banner_upload')
        logo_saved_name = save_and_get_unique_filename(logo_file, memorial_path)
        if logo_saved_name:
            memorial.logo_filename = logo_saved_name
        banner_saved_name = save_and_get_unique_filename(banner_file, memorial_path)
        if banner_saved_name:
            memorial.banner_filename = banner_saved_name
        image_filenames = memorial.gallery_images.split(',') if memorial.gallery_images else []
        video_filenames = memorial.gallery_videos.split(',') if memorial.gallery_videos else []
        audio_filenames = memorial.gallery_audios.split(',') if memorial.gallery_audios else []
        for file in request.files.getlist('images_upload'):
            saved_name = save_and_get_unique_filename(file, memorial_path)
            if saved_name:
                image_filenames.append(saved_name)
        for file in request.files.getlist('videos_upload'):
            saved_name = save_and_get_unique_filename(file, memorial_path)
            if saved_name:
                video_filenames.append(saved_name)
        for file in request.files.getlist('audios_upload'):
            saved_name = save_and_get_unique_filename(file, memorial_path)
            if saved_name:
                audio_filenames.append(saved_name)
        if image_filenames:
            memorial.gallery_images = ",".join(image_filenames)
        if video_filenames:
            memorial.gallery_videos = ",".join(video_filenames)
        if audio_filenames:
            memorial.gallery_audios = ",".join(audio_filenames)
        
        
        db.session.commit()
        flash('Memorial atualizado com sucesso!', 'success')
        return redirect(url_for('memorial.index'))
    return render_template('editar_memorial.html', memorial=memorial)

#-- delete file route ---
@bp.route('/m/<int:memorial_id>/delete_file/<string:filename>/<string:file_type>', methods=['POST'])
@login_required
def delete_file(memorial_id, filename, file_type):
    memorial = Memorial.query.get_or_404(memorial_id)

    # Verificação de autorização (está perfeita!)
    if memorial.user_id != current_user.id:
        abort(403)

    # 1. REMOVIDA a linha que pegava file_type do form. Usamos o da URL.

    if not filename or not file_type:
        # 2. Responde com JSON de erro
        return jsonify({'success': False, 'message': 'Parâmetros inválidos'}), 400

    memorial_path = os.path.join(current_app.config['UPLOAD_FOLDER'], str(memorial.id))
    file_path = os.path.join(memorial_path, filename)

    try:
        if not os.path.exists(file_path):
             # Se o arquivo não existe, apenas limpe o DB e reporte sucesso.
             # Não há necessidade de parar o processo aqui.
             pass
        else:
            os.remove(file_path)

        # Lógica de atualização do banco de dados (está perfeita!)
        if file_type == 'logo' and memorial.logo_filename == filename:
            memorial.logo_filename = None
        elif file_type == 'banner' and memorial.banner_filename == filename:
            memorial.banner_filename = None
        elif file_type == 'image':
            images = memorial.gallery_images.split(',') if memorial.gallery_images else []
            if filename in images:
                images.remove(filename)
                memorial.gallery_images = ','.join(images) if images else None
        elif file_type == 'video':
            videos = memorial.gallery_videos.split(',') if memorial.gallery_videos else []
            if filename in videos:
                videos.remove(filename)
                memorial.gallery_videos = ','.join(videos) if videos else None
        elif file_type == 'audio':
            audios = memorial.gallery_audios.split(',') if memorial.gallery_audios else []
            if filename in audios:
                audios.remove(filename)
                memorial.gallery_audios = ','.join(audios) if audios else None
        else:
            return jsonify({'success': False, 'message': 'Tipo de arquivo inválido'}), 400

        db.session.commit()
        
        # 3. Responde com JSON de sucesso!
        return jsonify({'success': True, 'message': 'Arquivo apagado com sucesso.'})

    except Exception as e:
        # 4. Responde com JSON em caso de erro inesperado
        db.session.rollback() # Importante reverter a transação em caso de erro
        return jsonify({'success': False, 'message': str(e)}), 500
#--- route to serve uploaded files ---
@bp.route('/uploads/<int:memorial_id>/<path:filename>')
def uploaded_file(memorial_id, filename):
    """
    Serve um arquivo de upload para um memorial específico.
    Usa send_from_directory para segurança contra ataques de 'Directory Traversal'.
    """
    # Cria o caminho para a pasta específica do memorial
    directory = os.path.join(current_app.config['UPLOAD_FOLDER'], str(memorial_id))
    
    # Envia o arquivo solicitado a partir desse diretório
    return send_from_directory(directory, filename)

# --- REGISTRATION AND LOGIN ROUTES ---
@bp.route('/registrar', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']

        # VALIDAÇÃO: Verifica se o e-mail já existe
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash('Este e-mail já está cadastrado. Por favor, tente fazer login.', 'danger')
            return redirect(url_for('memorial.register'))

        # Se o e-mail for novo, prossiga
        new_user = User(username=name, email=email)
        new_user.set_password(password)

        db.session.add(new_user)
        db.session.commit()

        flash(f'Usuário {name} registrado com sucesso! Faça o login.', 'success')
        return redirect(url_for('memorial.login')) 
    
    # Para o método GET
    return render_template("auth/register.html")

@bp.route("/login", methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        # CORREÇÃO: Usando o nome do blueprint 'memorial'
        return redirect(url_for('memorial.index'))  

    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        user = User.query.filter_by(email=email).first()

        if user and user.check_password(password):
            login_user(user)
            
            # VALIDAÇÃO DE SEGURANÇA: Prevenção de Open Redirect
            next_page = request.form.get('next')
            if next_page and urlparse(next_page).netloc == '':
                # Se 'next_page' for um caminho local, redirecione para ele
                return redirect(next_page)
            else:
                # Caso contrário, redirecione para a página inicial
                return redirect(url_for('memorial.index'))
        else:
            # MELHORIA UX: Mostra erro na própria página de login
            flash('E-mail ou senha inválidos. Por favor, tente novamente.', 'danger')
            return redirect(url_for('memorial.login'))
    
    # Para o método GET
    return render_template("auth/login.html")

@bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Você saiu do sistema.', 'info')
    return redirect(url_for('memorial.index'))
#--- END REGISTRATION AND LOGIN ROUTES ---