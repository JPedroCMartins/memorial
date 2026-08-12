# 🚀 Memorial

![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.1-black?logo=flask)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)
![uv](https://img.shields.io/badge/uv-Fastest_Manager-purple)

Plataforma web para criação de **memoriais** digitais (homenagens póstumas). Usuários criam
perfis de homenageados com nome, datas, biografia, fotos, vídeos, áudios e recebem mensagens
de visitantes, que podem ser aprovadas/moderação pelo dono do memorial.

O projeto é um único app Flask com renderização server-side (Jinja2):

- **`app/`** — backend em Flask (Python) com renderização server-side (Jinja2).
- **Banco**: SQLite por padrão (arquivo em `instance/memorial.db`).
- **Uploads**: armazenados em `instance/uploads/<id_do_memorial>/`.

> **Dica para manutenção com IA (opencode):** o arquivo [`AGENTS.md`](./AGENTS.md) concentra
> as convenções, comandos e armadilhas do projeto. Leia-o antes de alterar código.

## 🛠️ Tecnologias

- Python 3.13
- Flask 3.1 + Flask-Login + Flask-SQLAlchemy
- SQLite (banco de dados padrão)
- Alembic (migrações de schema)
- Gunicorn (servidor WSGI)
- Pytest (testes)
- [uv](https://github.com/astral-sh/uv) (gerenciador de dependências)
- Docker + Docker Compose

## 📁 Estrutura

```
.
├── app/
│   ├── __init__.py        # Factory create_app + config do banco + extensões
│   ├── models.py          # Modelos SQLAlchemy: User, Memorial, Comentario
│   ├── routes.py          # Todas as rotas (auth, memoriais, comentários, uploads, admin)
│   ├── utils.py           # Helpers (formatação de datas)
│   ├── templates/         # Templates Jinja2 (landing, home, auth, editar, memorial)
│   ├── static/
│   │   ├── css/           # Estilos (user.css, memorial_publicado.css)
│   │   ├── js/            # Scripts (user.js, memorial_publicado.js)
│   │   └── images/        # Imagens estáticas (logo_martins.png)
├── migrations/            # Migrações Alembic (versions/ + env.py)
├── tests/                 # Testes pytest do backend
├── instance/              # Banco SQLite e uploads (gerado em runtime, fora do git)
├── main.py                # Ponto de entrada do Flask
├── alembic.ini            # Configuração do Alembic
├── pyproject.toml         # Deps gerenciadas por uv
├── Dockerfile
├── docker-compose.yml
└── entrypoint.sh          # Entrypoint do container (migra + gunicorn)
```

## 🚀 Como Rodar

### Opção 1 — Local com uv (desenvolvimento)

Pré-requisitos: Python 3.13+ e [uv](https://github.com/astral-sh/uv) instalados.

```bash
# 1. Instala as dependências
uv sync

# 2. Roda o servidor de desenvolvimento
uv run python main.py
```

Acesse em <http://localhost:5001>.

A porta é controlada pela variável de ambiente `PORT` (padrão: `5001`):

```bash
PORT=5100 uv run python main.py
```

> O banco SQLite (`instance/memorial.db`) e a pasta de uploads são criados
> automaticamente na primeira execução. O `create_app()` roda `db.create_all()`
> apenas em bancos novos (ele é pulado quando `ALEMBIC=1` está definido).

### Opção 2 — Docker Compose

```bash
docker compose up --build -d
```

O app roda no container na porta **8001** (mapeada para a 5001 interna), ou na porta
definida por `PORT` no `.env`. Acesse em <http://localhost:8001>.

```bash
docker compose logs -f
docker compose down
```

O container executa `entrypoint.sh`, que roda `alembic upgrade head` antes de iniciar
o Gunicorn (3 workers).

## 🗄️ Migrações de Banco (Alembic)

O projeto usa [Alembic](https://alembic.sqlalchemy.org/) para versionar o schema do
banco e preservar os dados em alterações futuras.

### Fluxo diário

Ao alterar os modelos em `app/models.py`:

```bash
# 1. Gera a nova migração automaticamente (compare com o schema atual)
uv run alembic revision --autogenerate -m "descricao da alteracao"

# 2. Confira o arquivo gerado em migrations/versions/ e ajuste se necessário

# 3. Aplica a migração no banco
uv run alembic upgrade head
```

Verificações úteis:

```bash
# Mostra se o banco está em sincronia com os modelos
uv run alembic check

# Lista as migrações aplicadas
uv run alembic current

# Lista as migrações pendentes
uv run alembic history --verbose

# Reverte a última migração
uv run alembic downgrade -1
```

> **Nota:** o `create_app()` do Flask cria as tabelas automaticamente apenas em
> bancos novos. Para bancos existentes, o schema passa a ser controlado pelo Alembic
> (o `create_all` é pulado quando `ALEMBIC=1` é definido, como faz o `migrations/env.py`).

### Migrando um banco criado antes do Alembic

Se o banco `instance/memorial.db` já existia antes da adoção do Alembic (tabelas
criadas pelo `create_all`), as tabelas já existem. Para não perdê-las, **marque a
revisão inicial como aplicada** sem executar DDL:

```bash
uv run alembic stamp head
```

Depois disso, o fluxo normal de `upgrade head` funciona a partir do estado atual.

## 🧩 Arquitetura do código

### `app/__init__.py` — Factory e configuração

- Define `create_app()` (app factory).
- Carrega variáveis do `.env` via `python-dotenv`.
- Instancia as extensões globais `db` (Flask-SQLAlchemy) e `login_manager`
  (Flask-Login) **fora** da factory e as inicializa dentro dela (`db.init_app(app)`).
- Configurações: `SECRET_KEY`, `SQLALCHEMY_DATABASE_URI` (do `DATABASE_URL` ou
  `sqlite:///<instance_path>/memorial.db`), `UPLOAD_FOLDER`, `ADMIN_EMAILS`.
- Registra o filtro Jinja `formatadata` (do `utils.py`).
- Registra o blueprint `memorial` (de `routes.py`).
- No final, roda `db.create_all()` **exceto** quando a env `ALEMBIC=1` está definida.

### `app/models.py` — Modelos SQLAlchemy

| Modelo | Tabela | Campos principais |
|--------|--------|-------------------|
| `User` | `user` | `id`, `username`, `email` (único), `password_hash`; métodos `set_password()`/`check_password()` (Werkzeug, hash scrypt) |
| `Memorial` | `memorial` | `id`, `nome`, `nascimento`, `falecimento`, `frase_efeito`, `biografia`, `url_personalizada`, `user_id` (FK), `logo_filename`, `banner_filename`, `gallery_images`, `gallery_videos`, `gallery_audios` (listas separadas por vírgula) |
| `Comentario` | `comentario` | `id`, `nome_autor`, `texto`, `data_criacao` (default `datetime.utcnow`), `is_visible` (default `False`), `memorial_id` (FK) |

> A relação `Comentario.memorial` existe via `backref`. `User` **não** possui
> relationship declarada para memoriais — o `routes.py` usa o fallback
> `hasattr(u, 'memoriais')`.

### `app/routes.py` — Blueprint `memorial`

Contém **todas** as rotas. Helpers internos:

- `allowed_file(filename)` — valida extensão contra `ALLOWED_EXTENSIONS`
  (`png, jpg, jpeg, gif, webp, mp4, mov, mp3, wav`).
- `is_admin_user(user=None)` — verifica se o e-mail do usuário está em `ADMIN_EMAILS`.
- `admin_required` — decorator que retorna `403` para não-admins.

### `app/utils.py` — Helpers

- `formatar_data(valor_string)` — converte `YYYY-MM-DD` → `DD/MM/YYYY`
  (registrado como filtro Jinja `formatadata`).

### `app/templates/` — Jinja2

| Template | Função |
|----------|--------|
| `landing.html` | Landing page pública de apresentação |
| `auth/login.html` / `auth/register.html` | Formulários de autenticação |
| `home.html` | Painel do usuário logado com seus memoriais |
| `editar_memorial.html` | Formulário de criar/editar memorial com uploads |
| `memorial_publico.html` | Página pública do memorial (com galeria) |
| `admin.html` | Painel administrativo |

### `app/static/` — Frontend

- `css/user.css` — estilo das páginas autenticadas (painel, edição, admin).
- `css/memorial_publicado.css` — estilo da página pública do memorial.
- `js/user.js` — toasts, modais e diálogo de confirmação (`showToast`,
  `openModal`/`closeModal`, `confirmDialog`).
- `js/memorial_publicado.js` — loading screen e botões "Mostrar mais" da biografia.

### `main.py` — Entry point

```python
import os
from app import create_app, db

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5001)))
```

### Uploads

Os arquivos são salvos em `<UPLOAD_FOLDER>/<memorial_id>/` (padrão:
`instance/uploads/<id>/`). Nomes são gerados com `uuid4().hex` + extensão original
(evita colisões e paths maliciosos). `logo_filename`/`banner_filename` guardam um
único nome; `gallery_*` guardam listas separadas por vírgula. A rota
`/uploads/<memorial_id>/<path:filename>` serve os arquivos com `send_from_directory`
(seguro contra Directory Traversal).

## 🛡️ Painel de Administração

O sistema possui um painel administrativo em `/admin` (disponível após login) que
permite listar todos os usuários, ver seus memoriais, visualizar o **hash** das senhas,
redefinir senhas e excluir contas.

Para se tornar administrador, defina a lista de e-mails autorizados na variável de
ambiente `ADMIN_EMAILS` (separados por vírgula):

```bash
# localmente
ADMIN_EMAILS=admin@example.com uv run python main.py

# no docker-compose, adicione em environment:
#   ADMIN_EMAILS: admin@example.com
```

> **Segurança:** as senhas são armazenadas com **hash** (scrypt) via Werkzeug — nunca em
> texto plano. O painel exibe o hash e permite *redefinir* a senha de um usuário, mas
> não é possível recuperar a senha original. Admins não podem excluir outros admins.

## 🧪 Testes

```bash
uv run pytest
```

Os testes usam um banco SQLite temporário isolado (fixtures em `tests/conftest.py`),
portanto nunca tocam no `instance/memorial.db` real.

| Arquivo | Cobertura |
|---------|-----------|
| `tests/conftest.py` | Fixtures `app`, `client` e `auth` (registra/loga/desloga) |
| `tests/test_routes.py` | Landing, auth, memoriais, comentários, autorização (403) e admin |
| `tests/test_migrations.py` | Valida `upgrade`/`downgrade` das migrações Alembic |

## 🛣️ Rotas principais

| Método | Rota                          | Descrição                                   |
|--------|-------------------------------|---------------------------------------------|
| GET    | `/`                           | Landing page de apresentação                |
| GET    | `/registrar`                  | Formulário de registro                      |
| GET/POST | `/login`                    | Login                                       |
| GET    | `/logout`                     | Logout (requer login)                       |
| GET    | `/m`                          | Painel com os memoriais do usuário (login)  |
| GET    | `/m/<url_personalizada>`      | Página pública do memorial                  |
| POST   | `/m/create`                   | Criar memorial (login)                      |
| GET/POST | `/m/edit/<id>`              | Editar memorial (dono)                      |
| POST   | `/m/delete/<id>`              | Excluir memorial (dono)                     |
| POST   | `/m/<id>/comentar`            | Comentar um memorial (público)              |
| POST   | `/m/<id>/delete_file/<arquivo>/<tipo>` | Exclui um arquivo (dono, JSON)     |
| POST   | `/comentario/<id>/toggle`     | Aprovar/ocultar comentário (dono)           |
| POST   | `/comentario/<id>/apagar`     | Apagar comentário (dono)                    |
| GET    | `/uploads/<id>/<arquivo>`     | Servir arquivos de upload                   |
| GET    | `/admin`                      | Painel administrativo (admin)               |
| POST   | `/admin/usuario/<id>/resetar-senha` | Redefine senha de um usuário (admin)  |
| POST   | `/admin/usuario/<id>/excluir` | Exclui usuário e memoriais (admin)          |

## ⚙️ Variáveis de ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `SECRET_KEY` | `dev` | Chave secreta do Flask (use valor seguro em produção) |
| `DATABASE_URL` | `sqlite:///<instance>/memorial.db` | URL do banco (vazia = SQLite padrão) |
| `UPLOAD_FOLDER` | `<instance>/uploads` | Pasta de uploads |
| `ADMIN_EMAILS` | vazio | E-mails autorizados no painel `/admin` |
| `PORT` | `5001` | Porta do servidor dev |
| `ALEMBIC` | — | Se `1`, pula `create_all()` (usado pelo Alembic) |
