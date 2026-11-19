# /app/__init__.py

import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFError, CSRFProtect
from werkzeug.exceptions import HTTPException

# Carrega as variáveis do arquivo .env (se existir)
load_dotenv()

# Crie as instâncias fora da função (padrão "application factory")
db = SQLAlchemy()
login_manager = LoginManager()
csrf = CSRFProtect()

RAIZ_PROJETO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def create_app():
    app = Flask(__name__, instance_relative_config=True, static_folder=None)
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY') or 'dev',
        SQLALCHEMY_DATABASE_URI=os.environ.get('DATABASE_URL') or
        ('sqlite:///' + os.path.join(app.instance_path, 'memorial.db')),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        # Cookie de sessão: inacessível ao JS e não enviado em POSTs de outros sites.
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE='Lax',
        REMEMBER_COOKIE_SAMESITE='Lax',
        # Token CSRF vale enquanto durar a sessão (o SPA fica aberto por muito tempo).
        WTF_CSRF_TIME_LIMIT=None,
        # Limite total por requisição (uploads). Padrão 50 MB, ajustável via MAX_UPLOAD_MB.
        MAX_CONTENT_LENGTH=int(os.environ.get('MAX_UPLOAD_MB', '50')) * 1024 * 1024,
        UPLOAD_FOLDER=os.environ.get('UPLOAD_FOLDER') or os.path.join(app.instance_path, 'uploads'),
        FRONTEND_DIST=os.environ.get('FRONTEND_DIST') or os.path.join(RAIZ_PROJETO, 'frontend', 'dist'),
        ADMIN_EMAILS=[
            e.strip() for e in os.environ.get('ADMIN_EMAILS', '').split(',') if e.strip()
        ],
    )
    if app.config['SECRET_KEY'] == 'dev':
        app.logger.warning('SECRET_KEY não definida: usando "dev". NÃO use assim em produção!')

    os.makedirs(app.instance_path, exist_ok=True)

    # Inicialize as extensões AQUI DENTRO, com a 'app' que acabamos de criar
    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)

    from .models import User

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    @login_manager.unauthorized_handler
    def nao_autenticado():
        # API: em vez de redirecionar para uma página de login, responde 401 em JSON.
        return jsonify({'erro': 'Faça login para continuar.'}), 401

    @app.errorhandler(CSRFError)
    def erro_csrf(e):
        return jsonify({'erro': 'Sessão expirada ou token CSRF inválido. Recarregue a página.'}), 400

    @app.errorhandler(413)
    def arquivo_grande(e):
        limite = app.config['MAX_CONTENT_LENGTH'] // (1024 * 1024)
        return jsonify({'erro': f'Envio muito grande. O limite é {limite} MB por envio.'}), 413

    @app.errorhandler(HTTPException)
    def erro_http(e):
        # Erros nas rotas /api viram JSON; o resto (uploads, SPA) segue o padrão do Flask.
        if request.path.startswith('/api/'):
            mensagens = {403: 'Você não tem permissão para isso.', 404: 'Não encontrado.'}
            return jsonify({'erro': mensagens.get(e.code, e.description)}), e.code
        return e

    from . import routes
    app.register_blueprint(routes.bp)

    with app.app_context():
        # Quando rodando via Alembic, o create_all é pulado para evitar
        # conflito com o controle de migrações. (ALEMBIC=1 é setado no env.py)
        if os.environ.get('ALEMBIC') != '1':
            db.create_all()
    return app
