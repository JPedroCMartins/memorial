from app import db
from app.models import User, Memorial, Comentario


# --------------------------------------------------------------------------
# Autenticação
# --------------------------------------------------------------------------

class TestAuth:
    def test_registro_cria_usuario(self, client, auth):
        resp = auth.register()
        assert resp.status_code == 200
        with client.application.app_context():
            user = User.query.filter_by(email='ana@teste.com').first()
            assert user is not None
            assert user.check_password('senha-segura-123')

    def test_registro_duplicado_rejeita(self, client, auth):
        auth.register()
        resp = auth.register()
        assert b'j\xc3\xa1 est\xc3\xa1 cadastrado' in resp.data

    def test_login_sucesso(self, client, auth):
        auth.register()
        resp = auth.login()
        assert resp.status_code == 200
        assert b'Ana Teste' in resp.data

    def test_login_senha_invalida(self, client, auth):
        auth.register()
        resp = client.post(
            '/login',
            data={'email': 'ana@teste.com', 'password': 'errada'},
            follow_redirects=True,
        )
        assert b'v\xc3\xa1lidos' in resp.data  # 'E-mail ou senha inválidos'

    def test_index_exige_login(self, client):
        resp = client.get('/m')
        assert resp.status_code in (301, 302)
        assert '/login' in resp.headers.get('Location', '')


# --------------------------------------------------------------------------
# Memoriais
# --------------------------------------------------------------------------

def criar_usuario(usuario='dona', email='dona@x.com'):
    u = User(username=usuario, email=email)
    u.set_password('senha-do-dono')
    return u


def criar_memorial(client, nome='Maria', url='maria-teste'):
    return client.post(
        '/m/create',
        data={
            'nome': nome,
            'nascimento': '1940-04-12',
            'falecimento': '2021-09-05',
            'frase_efeito': 'Uma vida dedicada ao amor.',
            'biografia': 'Biografia de teste.',
            'url_personalizada': url,
        },
        follow_redirects=True,
    )


class TestMemorial:
    def test_criar_memorial(self, app, auth):
        auth.register()
        auth.login()
        criar_memorial(auth)
        with app.app_context():
            m = Memorial.query.filter_by(url_personalizada='maria-teste').first()
            assert m is not None
            assert m.nome == 'Maria'

    def test_criar_sem_login_redireciona(self, client):
        resp = client.post(
            '/m/create',
            data={'nome': 'N', 'url_personalizada': 'x-y'},
        )
        assert resp.status_code in (301, 302)

    def test_view_publica(self, app, client):
        with app.app_context():
            user = criar_usuario()
            db.session.add(user); db.session.flush()
            m = Memorial(
                nome='João', nascimento='1950', falecimento='1980',
                frase_efeito='P', biografia='B',
                url_personalizada='joao-publico', user_id=user.id,
            )
            db.session.add(m); db.session.commit()

        resp = client.get('/m/joao-publico')
        assert resp.status_code == 200
        assert b'Jo\xc3\xa3o' in resp.data

    def test_view_inexistente_404(self, client):
        assert client.get('/m/nao-existe').status_code == 404

    def test_apagar_proprio_memorial(self, app, auth):
        auth.register(); auth.login()
        criar_memorial(auth)
        with app.app_context():
            m = Memorial.query.filter_by(url_personalizada='maria-teste').first()
            mid = m.id
        resp = auth.post('/m/delete/' + str(mid))
        with app.app_context():
            assert Memorial.query.get(mid) is None


# --------------------------------------------------------------------------
# Comentários
# --------------------------------------------------------------------------

class TestComentarios:
    def _criar_memorial_publico(self, app):
        with app.app_context():
            user = criar_usuario()
            db.session.add(user); db.session.flush()
            m = Memorial(
                nome='Dona', nascimento='1970', falecimento='2010',
                frase_efeito='f', biografia='b',
                url_personalizada='comentarios-teste', user_id=user.id,
            )
            db.session.add(m); db.session.commit()
            return m.id

    def test_comentario_invisivel_por_padrao(self, app, client):
        mid = self._criar_memorial_publico(app)
        resp = client.post(
            f'/m/{mid}/comentar',
            data={'nome_autor': 'Amigo', 'texto': 'Minha homenagem.'},
            follow_redirects=True,
        )
        assert resp.status_code == 200
        with app.app_context():
            c = Comentario.query.filter_by(memorial_id=mid).first()
            assert c is not None
            assert c.is_visible is False

    def test_apagar_comentario_por_dono(self, app, auth):
        with app.app_context():
            user = criar_usuario('dona', 'dona@comentaram.com')
            db.session.add(user); db.session.flush()
            m = Memorial(
                nome='D', nascimento='1', falecimento='2', frase_efeito='f',
                biografia='b', url_personalizada='dona-mem', user_id=user.id,
            )
            db.session.add(m); db.session.flush()
            c = Comentario(nome_autor='A', texto='T', memorial_id=m.id)
            db.session.add(c); db.session.commit()
            cid = c.id

        client = auth._client
        client.post('/login', data={'email': 'dona@comentaram.com', 'password': 'senha-do-dono'})
        resp = auth.post(f'/comentario/{cid}/apagar')
        with app.app_context():
            assert Comentario.query.get(cid) is None

    def test_alterar_visibilidade_de_outro_403(self, app, auth):
        with app.app_context():
            dono = criar_usuario('dono2', 'dono2@x.com')
            db.session.add(dono); db.session.flush()
            m = Memorial(
                nome='D', nascimento='1', falecimento='2', frase_efeito='f',
                biografia='b', url_personalizada='mem-dono2', user_id=dono.id,
            )
            db.session.add(m); db.session.flush()
            c = Comentario(nome_autor='A', texto='T', memorial_id=m.id)
            db.session.add(c); db.session.commit()
            cid = c.id

        auth.register('outro', 'outro@x.com')
        auth.login('outro@x.com')
        resp = auth.post(f'/comentario/{cid}/toggle')
        assert resp.status_code == 403


class TestAutorizacao:
    def test_apagar_memorial_de_outro_usuario_403(self, app, client):
        with app.app_context():
            dono = criar_usuario('dono', 'dono@auth.com')
            db.session.add(dono); db.session.flush()
            m = Memorial(
                nome='N', nascimento='1', falecimento='2', frase_efeito='f',
                biografia='b', url_personalizada='auth-mem', user_id=dono.id,
            )
            db.session.add(m); db.session.commit()
            mid = m.id

        # outro usuário logado não pode apagar
        with app.app_context():
            outro = User(username='outro', email='outro@auth.com')
            outro.set_password('x')
            db.session.add(outro); db.session.commit()

        client.post('/login', data={'email': 'outro@auth.com', 'password': 'x'})
        resp = client.post(f'/m/delete/{mid}')
        assert resp.status_code == 403