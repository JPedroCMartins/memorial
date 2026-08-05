import os
import sys
import tempfile

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import User


@pytest.fixture()
def app(tmp_path):
    """App Flask com banco de dados SQLite temporário isolado."""
    test_app = create_app()
    test_app.config['TESTING'] = True
    test_app.config['WTF_CSRF_ENABLED'] = False
    test_app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + str(
        tmp_path / 'test.db'
    )

    with test_app.app_context():
        db.drop_all()
        db.create_all()
        yield test_app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def auth(client):
    """Helper para registrar/logar um usuário."""

    class AuthActions:
        def __init__(self, client, user_password='senha-segura-123'):
            self._client = client
            self.passw = user_password

        def register(self, name='Ana Teste', email='ana@teste.com'):
            return self._client.post(
                '/registrar',
                data={
                    'name': name,
                    'email': email,
                    'password': self.passw,
                },
                follow_redirects=True,
            )

        def login(self, email='ana@teste.com'):
            return self._client.post(
                '/login',
                data={'email': email, 'password': self.passw},
                follow_redirects=True,
            )

        def logout(self):
            return self._client.get('/logout', follow_redirects=True)

        def post(self, url, **kwargs):
            return self._client.post(url, **kwargs)

    return AuthActions(client)