# 🚀 Memorial

![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.1-black?logo=flask)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)

Plataforma para criação de **memoriais** digitais (homenagens póstumas). Usuários criam
memoriais com nome, datas, biografia, fotos, vídeos e áudios, e recebem mensagens de
visitantes, que só aparecem após aprovação do dono do memorial.

- **`app/`** — backend Flask que expõe uma **API JSON** em `/api` e serve os uploads e o build do React.
- **`frontend/`** — SPA em **React + TypeScript + Tailwind CSS** (Vite).
- **Banco**: SQLite por padrão (`instance/memorial.db`) ou Postgres via `DATABASE_URL`.
- **Uploads**: `instance/uploads/<id_do_memorial>/`.

> **Manutenção com IA:** leia [`AGENTS.md`](./AGENTS.md) antes de alterar código.

## 📁 Estrutura

```
.
├── app/
│   ├── __init__.py        # create_app: config, extensões (db, login, CSRF), handlers de erro JSON
│   ├── models/            # User, Memorial, Comentario
│   └── routes.py          # API /api/*, /uploads/* e fallback do SPA
├── frontend/
│   ├── src/
│   │   ├── index.css      # Tailwind + tokens da identidade visual (@theme)
│   │   ├── lib/api.ts     # Cliente HTTP (cookie de sessão + header X-CSRFToken)
│   │   ├── lib/auth.tsx   # Contexto de autenticação (/api/me)
│   │   ├── components/    # Modal, Toast, campos, formulário de memorial
│   │   ├── pages/         # Landing, Auth, Painel, EditarMemorial, MemorialPublico, Admin
│   │   └── test/          # Vitest
│   └── vite.config.ts     # Proxy /api e /uploads → Flask em dev
├── migrations/            # Alembic
├── tests/                 # pytest (API)
├── main.py                # Servidor dev do Flask
├── Dockerfile             # Multi-stage: build do React + imagem Python
└── docker-compose.yml
```

## 🚀 Como rodar

### Sem Docker, com um comando (`run.sh`)

```bash
./run.sh          # dev: Flask (debug, porta 5001) + Vite (porta 5173) juntos; Ctrl+C para os dois
./run.sh prod     # build do React + migrações + Gunicorn servindo tudo (porta 5001)
```

O script verifica `uv`/Node, cria o `.env` a partir do `.env.example` se faltar, instala as
dependências e roda `alembic upgrade head`. Ajustes por variável: `API_PORT`, `WEB_PORT`
(dev), `PORT`, `HOST`, `WORKERS` (prod) e `SKIP_INSTALL=1`. O modo `prod` exige uma
`SECRET_KEY` real.

### Desenvolvimento (dois terminais)

Pré-requisitos: Python 3.13+, [uv](https://github.com/astral-sh/uv) e Node 22+.

```bash
# Terminal 1 — API Flask (porta 5001)
uv sync
cp .env.example .env   # ajuste SECRET_KEY, ADMIN_EMAILS...
FLASK_DEBUG=1 uv run python main.py
```

```bash
# Terminal 2 — React com hot reload (porta 5173)
cd frontend
npm install
npm run dev
```

Acesse <http://localhost:5173>. O Vite repassa `/api` e `/uploads` para o Flask, então o
navegador enxerga tudo na mesma origem (necessário para o cookie de sessão e o CSRF).
Se o Flask estiver em outra porta: `FLASK_URL=http://127.0.0.1:5100 npm run dev`.

### Produção local sem Docker

```bash
cd frontend && npm ci && npm run build && cd ..
uv run gunicorn -w 3 -b 0.0.0.0:5001 main:app
```

O Flask serve `frontend/dist` em qualquer rota que não seja `/api` ou `/uploads`.

### Docker Compose

```bash
docker compose up --build -d
```

O `Dockerfile` compila o React e copia o `dist` para a imagem Python. O `entrypoint.sh`
roda `alembic upgrade head` e inicia o Gunicorn. **`SECRET_KEY` é obrigatória** no `.env`.
Acesse em <http://localhost:8001> (ou a porta definida em `PORT`).

## 🔐 Autenticação e segurança

- Sessão via cookie do Flask-Login (`HttpOnly`, `SameSite=Lax`) — o React roda na mesma origem.
- **CSRF** (Flask-WTF): o React busca o token em `GET /api/csrf` e envia `X-CSRFToken` em
  todo `POST/PUT/PATCH/DELETE`.
- Senhas com hash scrypt (Werkzeug), mínimo de 8 caracteres.
- Uploads validados por tipo (imagem/vídeo/áudio), nome `uuid4`, limite `MAX_UPLOAD_MB` por envio.
- `url_personalizada` é normalizada (`a-z0-9-`) e única (restrição no banco).
- Admin = e-mail listado em `ADMIN_EMAILS`. Admins não podem ser excluídos pelo painel.

## 🛣️ API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/csrf` | Token CSRF |
| GET | `/api/me` | Usuário logado (`usuario: null` se anônimo) |
| POST | `/api/auth/registrar` | `{name, email, password}` — cria e já loga |
| POST | `/api/auth/login` | `{email, password}` |
| POST | `/api/auth/logout` | Sai |
| GET | `/api/memoriais` | Memoriais do usuário (com todos os comentários) |
| POST | `/api/memoriais` | Cria (multipart: campos + `logo`, `banner`, `imagens[]`, `videos[]`, `audios[]`) |
| GET / PUT / DELETE | `/api/memoriais/<id>` | Detalha / edita (multipart) / apaga — só o dono |
| DELETE | `/api/memoriais/<id>/arquivos` | `{filename, tipo}` remove um arquivo |
| GET | `/api/publico/<slug>` | Memorial público (só comentários aprovados) |
| POST | `/api/publico/<slug>/comentarios` | `{nome_autor, texto}` — fica oculto até aprovação |
| PATCH / DELETE | `/api/comentarios/<id>` | `{is_visible}` (sem corpo = alterna) / apaga — só o dono |
| GET | `/api/admin/usuarios` | Usuários, memoriais e totais (admin) |
| POST | `/api/admin/usuarios/<id>/senha` | `{nova_senha}` (admin) |
| DELETE | `/api/admin/usuarios/<id>` | Exclui usuário e memoriais (admin) |
| GET | `/uploads/<id>/<arquivo>` | Arquivos enviados |

Erros sempre em JSON: `{"erro": "mensagem", "campos": [...]}` com o status HTTP adequado
(400 validação, 401 sem login, 403 sem permissão, 404, 409 conflito, 413 envio grande).

### Rotas do frontend

`/` landing · `/login` · `/registrar` · `/painel` · `/painel/memoriais/:id` (editar) ·
`/m/:slug` (página pública) · `/admin`.

## 🗄️ Migrações (Alembic)

```bash
uv run alembic revision --autogenerate -m "descricao"   # após alterar app/models/
uv run alembic upgrade head
uv run alembic check      # modelos x banco em sincronia
uv run alembic downgrade -1
```

O `create_app()` roda `db.create_all()` apenas quando `ALEMBIC` ≠ `1` (o `migrations/env.py`
define `ALEMBIC=1`). Banco criado antes do Alembic: use `uv run alembic stamp 5eda9a7f3788`
e depois `uv run alembic upgrade head`.

## 🧪 Testes

```bash
uv run pytest                          # API + migrações (SQLite temporário)
cd frontend && npm test && npm run build   # Vitest + typecheck/build
```

## ⚙️ Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `SECRET_KEY` | `dev` (com aviso) | Chave do Flask — obrigatória em produção |
| `DATABASE_URL` | `sqlite:///<instance>/memorial.db` | URL do banco (Postgres: `postgresql://...`) |
| `UPLOAD_FOLDER` | `<instance>/uploads` | Pasta de uploads |
| `MAX_UPLOAD_MB` | `50` | Limite por envio |
| `ADMIN_EMAILS` | vazio | E-mails com acesso ao `/admin` |
| `FRONTEND_DIST` | `frontend/dist` | Build do React servido pelo Flask |
| `PORT` / `HOST` | `5001` / `127.0.0.1` | Servidor dev (`main.py`) |
| `FLASK_DEBUG` | `0` | `1` liga o debugger (nunca em produção) |
| `ALEMBIC` | — | `1` pula `create_all()` |
