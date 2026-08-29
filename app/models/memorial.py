from app import db


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