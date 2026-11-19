#!/usr/bin/env bash
# ============================================================
# Memorial — roda backend (Flask) e frontend (React) sem Docker
#
# Uso:
#   ./run.sh            # = ./run.sh dev
#   ./run.sh dev        # Flask (debug) + Vite com hot reload, num terminal só
#   ./run.sh prod       # build do React + migrações + Gunicorn servindo tudo
#
# Variáveis opcionais:
#   API_PORT=5001    porta do Flask no modo dev
#   WEB_PORT=5173    porta do Vite no modo dev
#   PORT=5001        porta do Gunicorn no modo prod
#   HOST=0.0.0.0     interface do Gunicorn no modo prod
#   WORKERS=3        workers do Gunicorn no modo prod
#   SKIP_INSTALL=1   pula `uv sync` / `npm install`
#
# Pré-requisitos: uv (https://github.com/astral-sh/uv) e Node 22+ (npm).
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

MODO="${1:-dev}"

info() { printf '\033[1;33m>>>\033[0m %s\n' "$*"; }
falha() { printf '\033[1;31mERRO:\033[0m %s\n' "$*" >&2; exit 1; }

precisa() {
    command -v "$1" >/dev/null 2>&1 || falha "'$1' não encontrado. $2"
}

checar_requisitos() {
    precisa uv "Instale com: curl -LsSf https://astral.sh/uv/install.sh | sh"
    precisa node "Instale o Node 22+ (ex.: via nvm ou pacote da distro)."
    precisa npm "Instale o npm junto com o Node."

    local node_major
    node_major="$(node -p 'process.versions.node.split(".")[0]')"
    if [ "$node_major" -lt 20 ]; then
        falha "Node $node_major detectado; use Node 20+ (recomendado 22)."
    fi

    if [ ! -f .env ]; then
        info ".env não encontrado — copiando de .env.example (ajuste SECRET_KEY e ADMIN_EMAILS!)"
        cp .env.example .env
    fi
}

instalar_deps() {
    [ "${SKIP_INSTALL:-0}" = "1" ] && return
    info "Instalando dependências Python (uv sync)..."
    uv sync "$@"
    info "Instalando dependências do frontend..."
    if [ -f frontend/package-lock.json ]; then
        (cd frontend && npm ci --no-audit --no-fund)
    else
        (cd frontend && npm install --no-audit --no-fund)
    fi
}

migrar() {
    info "Aplicando migrações de banco (Alembic)..."
    uv run --no-sync alembic upgrade head
}

modo_dev() {
    local api_port="${API_PORT:-5001}"
    local web_port="${WEB_PORT:-5173}"

    checar_requisitos
    instalar_deps
    migrar

    # Cada processo em background ganha seu próprio grupo de processos, para que
    # o encerramento pegue também os filhos (ex.: o reloader do Flask).
    set -m
    local pids=()
    encerrar() {
        trap - INT TERM EXIT
        info "Encerrando..."
        for pid in "${pids[@]}"; do
            kill -TERM -- "-$pid" 2>/dev/null || true
        done
        wait 2>/dev/null || true
    }
    # Ctrl+C, kill ou um dos dois processos cair: derruba ambos.
    trap encerrar INT TERM EXIT

    info "Iniciando API Flask em http://127.0.0.1:${api_port}"
    FLASK_DEBUG=1 PORT="$api_port" uv run --no-sync python main.py &
    pids+=($!)

    info "Iniciando React (Vite) em http://localhost:${web_port}"
    (cd frontend && FLASK_URL="http://127.0.0.1:${api_port}" \
        exec npm run dev -- --port "$web_port" --strictPort) &
    pids+=($!)

    info "Acesse http://localhost:${web_port}  (Ctrl+C para parar)"
    # Sai assim que qualquer um dos dois terminar.
    wait -n "${pids[@]}"
}

modo_prod() {
    local port="${PORT:-5001}"
    local host="${HOST:-0.0.0.0}"
    local workers="${WORKERS:-3}"

    checar_requisitos
    if [ -z "${SECRET_KEY:-}" ] && grep -qE '^SECRET_KEY=(mude-esta-chave-em-producao)?\s*$' .env; then
        falha "Defina uma SECRET_KEY de verdade no .env (python -c 'import secrets; print(secrets.token_hex(32))')."
    fi
    instalar_deps --no-dev

    info "Gerando build do React (frontend/dist)..."
    (cd frontend && npm run build)

    migrar

    info "Iniciando Gunicorn em http://${host}:${port} (${workers} workers)"
    exec uv run --no-sync gunicorn --workers "$workers" --bind "${host}:${port}" main:app
}

case "$MODO" in
    dev) modo_dev ;;
    prod) modo_prod ;;
    -h|--help|help) sed -n '2,19p' "$0" | sed 's/^# \{0,1\}//' ;;
    *) falha "Modo desconhecido: '$MODO'. Use: ./run.sh [dev|prod]" ;;
esac
