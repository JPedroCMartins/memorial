#!/bin/sh
set -e

echo ">>> Aplicando migrações de banco (Alembic)..."
uv run --no-sync alembic upgrade head

echo ">>> Iniciando servidor..."
exec uv run --no-sync gunicorn --workers 3 --bind 0.0.0.0:5001 main:app