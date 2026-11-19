import io
import os

from app import db
from app.models import Comentario, Memorial, User


DADOS_MEMORIAL = {
    'nome': 'Maria',
    'nascimento': '1940-04-12',
    'falecimento': '2021-09-05',
    'frase_efeito': 'Uma vida dedicada ao amor.',
    'biografia': 'Biografia de teste.',
    'url_personalizada': 'maria-teste',
}


def criar_memorial(client, **extra):
    """Cria um memorial via API (multipart). Arquivos: logo=(bytes, nome), imagens=[...]."""
    data = {**DADOS_MEMORIAL, **extra}
    return client.post('/api/memoriais', data=data, content_type='multipart/form-data')


def arquivo(nome, conteudo=b'conteudo'):
    return (io.BytesIO(conteudo), nome)


def pasta_uploads(client, memorial_id):
    return os.path.join(client.application.config['UPLOAD_FOLDER'], str(memorial_id))


# --------------------------------------------------------------------------
# SPA / infraestrutura
# --------------------------------------------------------------------------

class TestInfra:
    def test_csrf_retorna_token(self, client):
        resp = client.get('/api/csrf')
        assert resp.status_code == 200
        assert resp.get_json()['csrf_token']

    def test_api_inexistente_404_json(self, client):
        resp = client.get('/api/nao-existe')
        assert resp.status_code == 404
        assert 'erro' in resp.get_json()

    def test_spa_serve_index(self, app, client, tmp_path):
        dist = tmp_path / 'dist'
        dist.mkdir()
        (dist / 'index.html').write_text('<div id="root">SPA</div>')
        app.config['FRONTEND_DIST'] = str(dist)
        for rota in ('/', '/painel', '/m/qualquer-slug'):
            resp = client.get(rota)
            assert resp.status_code == 200
            assert b'SPA' in resp.data

    def test_csrf_ativo_bloqueia_post_sem_token(self, app, client):
        app.config['WTF_CSRF_ENABLED'] = True
        resp = client.post('/api/auth/login', json={'email': 'x@x.com', 'password': 'y'})
        assert resp.status_code == 400
        assert 'CSRF' in resp.get_json()['erro']

    def test_csrf_ativo_aceita_post_com_token(self, app, client):
        app.config['WTF_CSRF_ENABLED'] = True
        token = client.get('/api/csrf').get_json()['csrf_token']
        resp = client.post('/api/auth/login', json={'email': 'x@x.com', 'password': 'y'},
                           headers={'X-CSRFToken': token})
        assert resp.status_code == 401  # passou do CSRF; credenciais inválidas


# --------------------------------------------------------------------------
# Autenticação
# --------------------------------------------------------------------------

class TestAuth:
    def test_registro_cria_usuario_e_loga(self, client, auth):
        resp = auth.register()
        assert resp.status_code == 201
        assert resp.get_json()['usuario']['nome'] == 'Ana Teste'
        assert client.get('/api/me').get_json()['usuario']['email'] == 'ana@teste.com'
        with client.application.app_context():
            user = User.query.filter_by(email='ana@teste.com').first()
            assert user.check_password('senha-segura-123')

    def test_registro_duplicado_rejeita(self, client, auth):
        auth.register()
        resp = auth.register(email='ANA@teste.com')
        assert resp.status_code == 409
        assert 'cadastrado' in resp.get_json()['erro']

    def test_registro_senha_curta(self, client, auth):
        resp = auth.register(password='123')
        assert resp.status_code == 400

    def test_registro_campos_vazios(self, client, auth):
        resp = auth.register(name='  ')
        assert resp.status_code == 400

    def test_login_sucesso(self, client, auth):
        auth.register()
        auth.logout()
        resp = auth.login()
        assert resp.status_code == 200
        assert resp.get_json()['usuario']['nome'] == 'Ana Teste'

    def test_login_senha_invalida(self, client, auth):
        auth.register()
        auth.logout()
        resp = auth.login(password='errada-errada')
        assert resp.status_code == 401
        assert 'inválidos' in resp.get_json()['erro']

    def test_logout(self, client, auth):
        auth.register()
        auth.logout()
        assert client.get('/api/me').get_json()['usuario'] is None

    def test_rotas_protegidas_exigem_login(self, client):
        assert client.get('/api/memoriais').status_code == 401
        assert criar_memorial(client).status_code == 401


# --------------------------------------------------------------------------
# Memoriais
# --------------------------------------------------------------------------

class TestMemorial:
    def test_criar_memorial(self, client, auth):
        auth.register()
        resp = criar_memorial(client)
        assert resp.status_code == 201
        m = resp.get_json()['memorial']
        assert m['nome'] == 'Maria' and m['url_personalizada'] == 'maria-teste'
        lista = client.get('/api/memoriais').get_json()['memoriais']
        assert [x['id'] for x in lista] == [m['id']]

    def test_campos_faltando_400(self, client, auth):
        auth.register()
        resp = client.post('/api/memoriais', data={'nome': 'Só nome'})
        assert resp.status_code == 400
        assert 'biografia' in resp.get_json()['campos']

    def test_slug_normalizado(self, client, auth):
        auth.register()
        resp = criar_memorial(client, url_personalizada='  José da Silva!! ')
        assert resp.get_json()['memorial']['url_personalizada'] == 'jose-da-silva'

    def test_slug_invalido(self, client, auth):
        auth.register()
        assert criar_memorial(client, url_personalizada='!!!').status_code == 400

    def test_slug_duplicado_409(self, client, auth):
        auth.register()
        criar_memorial(client)
        resp = criar_memorial(client)
        assert resp.status_code == 409

    def test_uploads_salvos_e_servidos(self, client, auth):
        auth.register()
        resp = criar_memorial(
            client,
            logo=arquivo('logo.png', b'LOGO'),
            imagens=[arquivo('a.jpg'), arquivo('b.webp')],
            audios=[arquivo('musica.mp3')],
        )
        m = resp.get_json()['memorial']
        assert m['logo']['filename'].endswith('.png')
        assert len(m['imagens']) == 2 and len(m['audios']) == 1
        servido = client.get(m['logo']['url'])
        assert servido.status_code == 200 and servido.data == b'LOGO'

    def test_extensao_invalida_rejeitada_sem_gravar(self, client, auth):
        auth.register()
        resp = criar_memorial(client, imagens=[arquivo('virus.exe')])
        assert resp.status_code == 400
        with client.application.app_context():
            assert Memorial.query.count() == 0

    def test_extensao_no_campo_errado(self, client, auth):
        auth.register()
        resp = criar_memorial(client, imagens=[arquivo('musica.mp3')])
        assert resp.status_code == 400

    def test_upload_acima_do_limite_413(self, app, client, auth):
        auth.register()
        app.config['MAX_CONTENT_LENGTH'] = 1024
        resp = criar_memorial(client, logo=arquivo('grande.png', b'x' * 4096))
        assert resp.status_code == 413
        assert 'limite' in resp.get_json()['erro']

    def test_editar_memorial(self, client, auth):
        auth.register()
        mid = criar_memorial(client).get_json()['memorial']['id']
        resp = client.put(f'/api/memoriais/{mid}', data={**DADOS_MEMORIAL, 'nome': 'Maria Editada'})
        assert resp.status_code == 200
        assert resp.get_json()['memorial']['nome'] == 'Maria Editada'

    def test_editar_campos_faltando_400(self, client, auth):
        auth.register()
        mid = criar_memorial(client).get_json()['memorial']['id']
        resp = client.put(f'/api/memoriais/{mid}', data={'nome': 'X'})
        assert resp.status_code == 400

    def test_editar_mantem_proprio_slug(self, client, auth):
        auth.register()
        mid = criar_memorial(client).get_json()['memorial']['id']
        resp = client.put(f'/api/memoriais/{mid}', data=DADOS_MEMORIAL)
        assert resp.status_code == 200

    def test_trocar_logo_apaga_antigo(self, client, auth):
        auth.register()
        m = criar_memorial(client, logo=arquivo('a.png')).get_json()['memorial']
        antigo = os.path.join(pasta_uploads(client, m['id']), m['logo']['filename'])
        assert os.path.exists(antigo)
        resp = client.put(f"/api/memoriais/{m['id']}", data={**DADOS_MEMORIAL, 'logo': arquivo('b.png')})
        novo = resp.get_json()['memorial']['logo']['filename']
        assert novo != m['logo']['filename']
        assert not os.path.exists(antigo)

    def test_editar_acrescenta_galeria(self, client, auth):
        auth.register()
        m = criar_memorial(client, imagens=[arquivo('a.jpg')]).get_json()['memorial']
        resp = client.put(f"/api/memoriais/{m['id']}", data={**DADOS_MEMORIAL, 'imagens': [arquivo('b.jpg')]})
        assert len(resp.get_json()['memorial']['imagens']) == 2

    def test_apagar_arquivo_da_galeria(self, client, auth):
        auth.register()
        m = criar_memorial(client, imagens=[arquivo('a.jpg'), arquivo('b.jpg')]).get_json()['memorial']
        nome = m['imagens'][0]['filename']
        resp = client.delete(f"/api/memoriais/{m['id']}/arquivos", json={'filename': nome, 'tipo': 'imagem'})
        assert resp.status_code == 200
        assert [i['filename'] for i in resp.get_json()['memorial']['imagens']] == [m['imagens'][1]['filename']]
        assert not os.path.exists(os.path.join(pasta_uploads(client, m['id']), nome))

    def test_apagar_arquivo_que_nao_pertence_404(self, client, auth):
        auth.register()
        m = criar_memorial(client, logo=arquivo('a.png')).get_json()['memorial']
        intruso = os.path.join(pasta_uploads(client, m['id']), 'outro.txt')
        open(intruso, 'w').close()
        resp = client.delete(f"/api/memoriais/{m['id']}/arquivos", json={'filename': 'outro.txt', 'tipo': 'imagem'})
        assert resp.status_code == 404
        assert os.path.exists(intruso)
        resp = client.delete(f"/api/memoriais/{m['id']}/arquivos", json={'filename': 'x', 'tipo': 'pdf'})
        assert resp.status_code == 400

    def test_deletar_memorial_apaga_pasta(self, client, auth):
        auth.register()
        m = criar_memorial(client, logo=arquivo('a.png')).get_json()['memorial']
        resp = client.delete(f"/api/memoriais/{m['id']}")
        assert resp.status_code == 200
        assert not os.path.exists(pasta_uploads(client, m['id']))
        with client.application.app_context():
            assert db.session.get(Memorial, m['id']) is None


# --------------------------------------------------------------------------
# Página pública e comentários
# --------------------------------------------------------------------------

class TestComentarios:
    def _setup(self, client, auth):
        auth.register()
        return criar_memorial(client).get_json()['memorial']

    def test_publico_404(self, client):
        assert client.get('/api/publico/nao-existe').status_code == 404

    def test_comentario_invisivel_por_padrao(self, client, auth):
        m = self._setup(client, auth)
        resp = client.post('/api/publico/maria-teste/comentarios', json={'nome_autor': 'João', 'texto': 'Saudades'})
        assert resp.status_code == 201
        assert client.get('/api/publico/maria-teste').get_json()['memorial']['comentarios'] == []
        dono = client.get(f"/api/memoriais/{m['id']}").get_json()['memorial']['comentarios']
        assert dono[0]['texto'] == 'Saudades' and dono[0]['is_visible'] is False

    def test_comentario_vazio_400(self, client, auth):
        self._setup(client, auth)
        resp = client.post('/api/publico/maria-teste/comentarios', json={'nome_autor': ' ', 'texto': ''})
        assert resp.status_code == 400
        with client.application.app_context():
            assert Comentario.query.count() == 0

    def test_aprovar_comentario_aparece_no_publico(self, client, auth):
        m = self._setup(client, auth)
        client.post('/api/publico/maria-teste/comentarios', json={'nome_autor': 'João', 'texto': 'Saudades'})
        cid = client.get(f"/api/memoriais/{m['id']}").get_json()['memorial']['comentarios'][0]['id']
        resp = client.patch(f'/api/comentarios/{cid}', json={'is_visible': True})
        assert resp.get_json()['comentario']['is_visible'] is True
        publicos = client.get('/api/publico/maria-teste').get_json()['memorial']['comentarios']
        assert [c['id'] for c in publicos] == [cid]
        # sem corpo = alterna
        assert client.patch(f'/api/comentarios/{cid}').get_json()['comentario']['is_visible'] is False

    def test_apagar_comentario_por_dono(self, client, auth):
        m = self._setup(client, auth)
        client.post('/api/publico/maria-teste/comentarios', json={'nome_autor': 'João', 'texto': 'Oi'})
        cid = client.get(f"/api/memoriais/{m['id']}").get_json()['memorial']['comentarios'][0]['id']
        assert client.delete(f'/api/comentarios/{cid}').status_code == 200
        with client.application.app_context():
            assert db.session.get(Comentario, cid) is None


# --------------------------------------------------------------------------
# Autorização (dono)
# --------------------------------------------------------------------------

class TestAutorizacao:
    def _memorial_de_outro(self, client, auth):
        auth.register(email='dona@x.com')
        m = criar_memorial(client).get_json()['memorial']
        client.post('/api/publico/maria-teste/comentarios', json={'nome_autor': 'J', 'texto': 'T'})
        cid = client.get(f"/api/memoriais/{m['id']}").get_json()['memorial']['comentarios'][0]['id']
        auth.logout()
        auth.register(name='Intruso', email='intruso@x.com')
        return m['id'], cid

    def test_outro_usuario_recebe_403(self, client, auth):
        mid, cid = self._memorial_de_outro(client, auth)
        assert client.get(f'/api/memoriais/{mid}').status_code == 403
        assert client.put(f'/api/memoriais/{mid}', data=DADOS_MEMORIAL).status_code == 403
        assert client.delete(f'/api/memoriais/{mid}').status_code == 403
        assert client.delete(f'/api/memoriais/{mid}/arquivos', json={'filename': 'x', 'tipo': 'logo'}).status_code == 403
        assert client.patch(f'/api/comentarios/{cid}').status_code == 403
        assert client.delete(f'/api/comentarios/{cid}').status_code == 403
        assert client.get('/api/memoriais').get_json()['memoriais'] == []


# --------------------------------------------------------------------------
# Admin
# --------------------------------------------------------------------------

class TestAdmin:
    def test_admin_negado_para_comum(self, client, auth):
        auth.register()
        assert client.get('/api/admin/usuarios').status_code == 403

    def test_admin_lista_usuarios(self, client, auth):
        auth.register()
        criar_memorial(client)
        auth.logout()
        auth.register(name='Admin', email='admin@teste.com')
        assert client.get('/api/me').get_json()['usuario']['is_admin'] is True
        usuarios = client.get('/api/admin/usuarios').get_json()['usuarios']
        ana = next(u for u in usuarios if u['email'] == 'ana@teste.com')
        assert ana['total_memoriais'] == 1

    def test_admin_resetar_senha(self, client, auth):
        auth.register()
        auth.logout()
        auth.register(name='Admin', email='admin@teste.com')
        with client.application.app_context():
            uid = User.query.filter_by(email='ana@teste.com').first().id
        assert client.post(f'/api/admin/usuarios/{uid}/senha', json={'nova_senha': '123'}).status_code == 400
        assert client.post(f'/api/admin/usuarios/{uid}/senha', json={'nova_senha': 'nova-senha-1'}).status_code == 200
        with client.application.app_context():
            assert db.session.get(User, uid).check_password('nova-senha-1')

    def test_admin_excluir_usuario(self, client, auth):
        auth.register()
        mid = criar_memorial(client, logo=arquivo('a.png')).get_json()['memorial']['id']
        auth.logout()
        auth.register(name='Admin', email='admin@teste.com')
        with client.application.app_context():
            uid = User.query.filter_by(email='ana@teste.com').first().id
            admin_id = User.query.filter_by(email='admin@teste.com').first().id
        assert client.delete(f'/api/admin/usuarios/{admin_id}').status_code == 403
        assert client.delete(f'/api/admin/usuarios/{uid}').status_code == 200
        with client.application.app_context():
            assert db.session.get(User, uid) is None
            assert db.session.get(Memorial, mid) is None
        assert not os.path.exists(pasta_uploads(client, mid))
