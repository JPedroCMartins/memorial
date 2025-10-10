from . import db
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from sqlalchemy import DateTime
from datetime import datetime

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=False, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)  # Aumentei para 256 caracteres

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'
    
class Memorial(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome = db.Column(db.String(256), nullable=False)
    nascimento = db.Column(db.String(256), nullable=False)
    falecimento = db.Column(db.String(256), nullable=False)
    frase_efeito = db.Column(db.String(512), nullable=False)
    biografia = db.Column(db.Text, nullable=False)
    url_personalizada = db.Column(db.String(256), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    # --- NOVAS COLUNAS PARA OS ARQUIVOS ---
    logo_filename = db.Column(db.String(256), nullable=True)
    banner_filename = db.Column(db.String(256), nullable=True)
    
    # Usaremos Text para armazenar múltiplos nomes de arquivos separados por vírgula
    gallery_images = db.Column(db.Text, nullable=True) 
    gallery_videos = db.Column(db.Text, nullable=True)
    gallery_audios = db.Column(db.Text, nullable=True)
    
    comentarios = db.relationship('Comentario', backref='memorial', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Memorial {self.nome}>'
    
class Comentario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome_autor = db.Column(db.String(100), nullable=False)
    texto = db.Column(db.Text, nullable=False)
    data_criacao = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    is_visible = db.Column(db.Boolean, default=False, nullable=False)
    memorial_id = db.Column(db.Integer, db.ForeignKey('memorial.id'), nullable=False)

    def __repr__(self):
        return f'<Comentario {self.id} de {self.nome_autor}>'

