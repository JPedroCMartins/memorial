# /app/__init__.py

from flask import Flask
# from flask import Flask, app  <-- REMOVA a importação de 'app' daqui
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
import os
from .utils import formatar_data

# Crie as instâncias fora da função
db = SQLAlchemy()
login_manager = LoginManager()

# login_manager.init_app(app) <-- REMOVA esta linha daqui de fora

# É uma boa prática configurar o login_view dentro da factory também
# login_manager.login_view = 'login' 

def create_app():
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY='dev',
        SQLALCHEMY_DATABASE_URI='sqlite:///' + os.path.join(app.instance_path, 'memorial.db'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False
    )
    app.jinja_env.filters['formatadata'] = formatar_data
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
    
    # CORRETO: Inicialize as extensões AQUI DENTRO, com a 'app' que acabamos de criar
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'memorial.login' # MOVA para cá e especifique o blueprint se necessário
    app.config['UPLOAD_FOLDER'] = os.path.join(app.instance_path, 'uploads')    # Lembre-se de adicionar o user_loader aqui também
    from .models import User  # Supondo que seu modelo esteja em app/models.py
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))


    from . import routes
    app.register_blueprint(routes.bp)

    with app.app_context():
        db.create_all() 
    return app