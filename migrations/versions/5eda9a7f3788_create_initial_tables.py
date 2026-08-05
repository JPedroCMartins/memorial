"""create initial tables

Revision ID: 5eda9a7f3788
Revises:
Create Date: 2026-08-05 14:47:24.812183

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5eda9a7f3788'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'user',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('username', sa.String(length=80), nullable=False),
        sa.Column('email', sa.String(length=120), nullable=False),
        sa.Column('password_hash', sa.String(length=256), nullable=False),
        sa.UniqueConstraint('email'),
    )

    op.create_table(
        'memorial',
        sa.Column('id', sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column('nome', sa.String(length=256), nullable=False),
        sa.Column('nascimento', sa.String(length=256), nullable=False),
        sa.Column('falecimento', sa.String(length=256), nullable=False),
        sa.Column('frase_efeito', sa.String(length=512), nullable=False),
        sa.Column('biografia', sa.Text(), nullable=False),
        sa.Column('url_personalizada', sa.String(length=256), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('user.id')),
        sa.Column('logo_filename', sa.String(length=256), nullable=True),
        sa.Column('banner_filename', sa.String(length=256), nullable=True),
        sa.Column('gallery_images', sa.Text(), nullable=True),
        sa.Column('gallery_videos', sa.Text(), nullable=True),
        sa.Column('gallery_audios', sa.Text(), nullable=True),
    )

    op.create_table(
        'comentario',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('nome_autor', sa.String(length=100), nullable=False),
        sa.Column('texto', sa.Text(), nullable=False),
        sa.Column('data_criacao', sa.DateTime(), nullable=False),
        sa.Column('is_visible', sa.Boolean(), nullable=False),
        sa.Column('memorial_id', sa.Integer(), sa.ForeignKey('memorial.id'), nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('comentario')
    op.drop_table('memorial')
    op.drop_table('user')