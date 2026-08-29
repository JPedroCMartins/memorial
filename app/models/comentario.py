from app import db
from sqlalchemy import DateTime
from datetime import datetime


class Comentario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome_autor = db.Column(db.String(100), nullable=False)
    texto = db.Column(db.Text, nullable=False)
    data_criacao = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    is_visible = db.Column(db.Boolean, default=False, nullable=False)
    memorial_id = db.Column(db.Integer, db.ForeignKey('memorial.id'), nullable=False)

    def __repr__(self):
        return f'<Comentario {self.id} de {self.nome_autor}>'