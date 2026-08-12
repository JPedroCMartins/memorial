# AGENTS.md — Guia de manutenção do projeto Memorial

Este arquivo orienta agentes de IA (opencode) e desenvolvedores a manter este código
de forma consistente. **Leia antes de alterar qualquer arquivo.**

## Visão geral

Aplicação web Flask (renderização server-side com Jinja2) para criar memoriais digitais.
Monorepo de um único app Flask em `app/`. **Todo o backend está em `app/routes.py`**
(single blueprint `memorial`).

## Comandos essenciais

Rodar **sempre** a partir da raiz do projeto, com o venv `uv`:

```bash
# Instalar dependências
uv sync

# Rodar servidor dev (default porta 5001; use PORT para mudar)
PORT=5100 uv run python main.py

# Rodar testes (usam banco temporário isolado, nunca tocam instance/memorial.db)
uv run pytest

# Verificar migrações (compare models.py com o schema)
uv run alembic check
uv run alembic current
```

## Convenções de código (IMPORTANTE)

1. **Idioma das strings/frontend:** PT-BR (`nome_autor`, `frase_efeito`, templates).
2. **Nada de ESLint/typecheck/linter configurado.** Sem pré-commit hooks. O único
   check automatizado são os testes pytest.
3. **Nunca edite regressivamente o schema sem migração Alembic.** Ao alterar
   `app/models.py`, gere `alembic revision --autogenerate` e rode `upgrade head`.
4. **Banco de dados:** padrão é SQLite em `instance/memorial.db`. Jamais dar
   `rm`/reset nesse arquivo — contém dados reais (usuários, memoriais, comentários).
5. **Uploads:** salvos em `instance/uploads/<memorial_id>/`. Nomes de arquivo são
   `uuid4().hex` + extensão. Galerias (`gallery_images/videos/audios`) são strings
   separadas por vírgula; `logo_filename`/`banner_filename` são nomes únicos.
6. **Autorização:** dono do memorial = `memorial.user_id == current_user.id`
   (responde 403 via `abort(403)`). Admin = e-mail em `ADMIN_EMAILS`
   (decorator `admin_required` em `routes.py`).
7. **Não remover comentários existentes** das rotas — o `routes.py` está
   propositalmente comentado em PT-BR para didática do autor.
8. **Extensões Flask** (`db`, `login_manager`) são instanciadas fora da factory em
   `app/__init__.py` e inicializadas dentro de `create_app()`.

## Armadilhas conhecidas (gotchas)

- **`create_all()` vs Alembic:** `app/__init__.py` roda `db.create_all()` apenas
  quando a env `ALEMBIC` **não** é `1`. O `migrations/env.py` seta `ALEMBIC=1`.
  Se precisar testar migrations, defina essa env.
- **Banco pré-Alembic:** se o DB nao tem registro em `alembic_version` mas as tabelas
  existem, rodar `uv run alembic stamp head` (NÃO `upgrade`) para não dropar dados.
- **Porta 5001 pode estar ocupada** (ex: outro projeto). Use `PORT=xxxx`.
- **`User` não tem relationship `memoriais`;** `routes.py` usa fallback via
  `hasattr(u, 'memoriais')` mas na prática filtra com
  `Memorial.query.filter_by(user_id=...)`.
- **Uploads servidos por `/uploads/<memorial_id>/<path:filename>`** com
  `send_from_directory` — o caminho no template usa o id do memorial + nome salvo.
- **Login exige e-mail no form como `email`** e senha como `password` (templates
  auth). O campo de registro é `name` + `email` + `password`.
- **Hash de senha:** `password_hash` tem 256 chars. `set_password`/`check_password`
  usam Werkzeug. Não quebre compatibilidade (testes validam).

## Regras de teste

- **Nunca** rodar os testes contra o `instance/memorial.db`. As fixtures em
  `tests/conftest.py` usam `monkeypatch` de `DATABASE_URL`/`UPLOAD_FOLDER` para um
  SQLite temporário.
- Sempre rodar `uv run pytest` após alterações e garantir que **todos** passam antes
  de concluir.
- Adicionar testes em `tests/test_routes.py` no estilo das classes existentes
  (`TestAuth`, `TestMemorial`, `TestComentarios`, `TestAdmin`, `TestAutorizacao`).

## Fluxo de mudanças (checklist)

1. Leia o modelo/migrations antes de mexer no DB.
2. Edite código seguindo as convenções PT-BR.
3. Se alterou `models.py`: crie + revise migração Alembic e aplique.
4. Rode `uv run pytest` e confira 0 falhas.
5. Hack de smoke test: `uv run python main.py` em porta livre e `curl` na rota
   alterada.
6. Não commite `instance/` (está no `.gitignore`) nem `.env`.