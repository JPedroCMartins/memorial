#!/bin/sh
set -e

echo ">>> Aplicando migrações de banco (Alembic)..."
uv run alembic upgrade head

echo ">>> Iniciando servidor..."
exec uv run gunicorn --workers 3 --bind 0.0.0.0:5001 main:app