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

## 🛠️ Tecnologias

- Python 3.13
- Flask 3.1 + Flask-Login + Flask-SQLAlchemy
- SQLite (banco de dados padrão)
- Gunicorn (servidor WSGI)
- Pytest (testes)
- [uv](https://github.com/astral-sh/uv) (gerenciador de dependências)
- Docker + Docker Compose

## 📁 Estrutura

```
.
├── app/
│   ├── __init__.py        # Factory create_app + config do banco
│   ├── routes.py          # Todas as rotas (auth, memoriais, comentários, uploads)
│   ├── models.py          # Modelos: User, Memorial, Comentario
│   ├── utils.py           # Helpers (formatação de datas)
│   ├── templates/         # Templates Jinja2 (landing, home, auth, editar, memorial)
│   └── static/            # CSS, JS e imagens
├── migrations/            # Migrações Alembic (versions/ + env.py)
├── tests/                 # Testes pytest do backend
├── instance/              # Banco SQLite e uploads (gerado em runtime)
├── main.py                # Ponto de entrada do Flask
├── alembic.ini            # Configuração do Alembic
├── pyproject.toml         # Deps gerenciadas por uv
├── Dockerfile
└── docker-compose.yml
```

## 🚀 Como Rodar

### Backend (Flask)

#### Opção 1 — Docker Compose (recomendado)

```bash
docker compose up --build -d
```

O app roda no container na porta **8001** (mapeada para a 5001 interna).
Acesse em <http://localhost:8001>.

Para ver os logs e parar:

```bash
docker compose logs -f
docker compose down
```

#### Opção 2 — Local com uv (desenvolvimento)

Pré-requisitos: Python 3.13+ e [uv](https://github.com/astral-sh/uv) instalados.

```bash
# 1. Instala as dependências
uv sync

# 2. Roda o servidor de desenvolvimento (porta 5001)
uv run python main.py
```

Acesse em <http://localhost:5001>.

> O banco SQLite (`instance/memorial.db`) e a pasta de uploads são criados
> automaticamente na primeira execução.

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
> não é possível recuperar a senha original.

## 🧪 Testes

```bash
uv run pytest
```

Os testes cobrem registro, login, logout e as principais rotas, usando um banco
SQLite temporário isolado.

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
| POST   | `/m/edit/<id>`                | Editar memorial (dono)                      |
| POST   | `/m/delete/<id>`              | Excluir memorial (dono)                     |
| POST   | `/m/<id>/comentar`            | Comentar um memorial (público)              |
| POST   | `/comentario/<id>/toggle`     | Aprovar/ocultar comentário (dono)           |
| POST   | `/comentario/<id>/apagar`     | Apagar comentário (dono)                    |
| GET    | `/uploads/<id>/<arquivo>`     | Servir arquivos de upload                   |
| GET    | `/admin`                      | Painel administrativo (admin)               |
| POST   | `/admin/usuario/<id>/resetar-senha` | Redefine senha de um usuário (admin)  |
| POST   | `/admin/usuario/<id>/excluir` | Exclui usuário e memoriais (admin)          |

## ⚠️ Observações

- A `SECRET_KEY` está definida como `'dev'` em `app/__init__.py` — substitua por um
  valor seguro em produção.