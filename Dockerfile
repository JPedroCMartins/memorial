# --- Etapa 1: build do frontend React ---
FROM node:22-slim AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Etapa 2: backend Flask (serve a API e o build do React) ---
FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-cache --no-dev

COPY app/ ./app/
COPY migrations/ ./migrations/
COPY alembic.ini main.py ./
COPY --from=frontend /frontend/dist ./frontend/dist

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 5001

ENTRYPOINT ["/entrypoint.sh"]
