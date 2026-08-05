# 🚀 Memorial

![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.1-black?logo=flask)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)
![uv](https://img.shields.io/badge/uv-Fastest_Manager-purple)

Plataforma web para criação de **memoriais** digitais (homenagens póstumas). Usuários criam
perfis de homenageados com nome, datas, biografia, fotos, vídeos, áudios e recebem mensagens
de visitantes, que podem ser aprovadas/moderação pelo dono do memorial.

O projeto é dividido em duas partes:

- **`app/`** — backend em Flask (Python) com renderização server-side (Jinja2) + API JSON.
- **`frontend/`** — aplicação web em Angular (atualmente um app separado apontando para a API do Flask).

## 🛠️ Tecnologias

**Backend**
- Python 3.13
- Flask 3.1 + Flask-Login + Flask-SQLAlchemy
- SQLite (banco de dados padrão)
- Gunicorn (servidor WSGI)
- Pytest (testes)

**Frontend**
- Angular 22
- Tailwind CSS 4
- TypeScript 6

**Infra**
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
│   ├── templates/         # Templates Jinja2 (home, memorial, auth, editar)
│   └── static/            # CSS, JS e imagens
├── frontend/              # Aplicação Angular
├── tests/                 # Testes pytest do backend
├── instance/              # Banco SQLite e uploads (gerado em runtime)
├── main.py                # Ponto de entrada do Flask
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

# 2. Ativa o ambiente virtual
source .venv/bin/activate

# 3. Roda o servidor de desenvolvimento (porta 5001)
uv run python main.py
```

Acesse em <http://localhost:5001>.

> O banco SQLite (`instance/memorial.db`) e a pasta de uploads são criados
> automaticamente na primeira execução.

### Frontend (Angular)

O frontend é uma aplicação Angular separada. Para executá-la:

```bash
cd frontend

# 1. Instala as dependências
npm install

# 2. Sobe o servidor de desenvolvimento
npm start
```

Acesse em <http://localhost:4200> (padrão do `ng serve`).

> O serviço `AuthService` aponta para `http://localhost:5001/api` — o backend Flask
> precisa estar rodando na porta 5001 para que o login funcione.

## 🧪 Testes

```bash
uv run pytest
```

Os testes cobrem registro, login, logout e as principais rotas, usando um banco
SQLite temporário isolado.

## 🛣️ Rotas principais

| Método | Rota                          | Descrição                                   |
|--------|-------------------------------|---------------------------------------------|
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

## ⚠️ Observações

- A `SECRET_KEY` está definida como `'dev'` em `app/__init__.py` — substitua por um
  valor seguro em produção.
- O `frontend/` parece ser uma reescrita/Angular em progresso; o "app de produção"
  funcional hoje é o backend Flask com seus templates Jinja2.