"""url_personalizada única

Revision ID: a1c3e5f7b9d2
Revises: 5eda9a7f3788
Create Date: 2026-11-19 22:30:00

Antes de criar a restrição, desduplica slugs repetidos acrescentando "-<id>"
aos memoriais mais novos (o mais antigo mantém a URL original, preservando links já compartilhados).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1c3e5f7b9d2'
down_revision: Union[str, Sequence[str], None] = '5eda9a7f3788'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    linhas = conn.execute(sa.text('SELECT id, url_personalizada FROM memorial ORDER BY id')).fetchall()
    vistos = set()
    for memorial_id, slug in linhas:
        if slug in vistos:
            novo = f'{slug}-{memorial_id}'
            conn.execute(
                sa.text('UPDATE memorial SET url_personalizada = :novo WHERE id = :id'),
                {'novo': novo, 'id': memorial_id},
            )
            vistos.add(novo)
        else:
            vistos.add(slug)

    with op.batch_alter_table('memorial') as batch_op:
        batch_op.create_unique_constraint('uq_memorial_url_personalizada', ['url_personalizada'])


def downgrade() -> None:
    with op.batch_alter_table('memorial') as batch_op:
        batch_op.drop_constraint('uq_memorial_url_personalizada', type_='unique')
