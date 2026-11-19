# AGENTS.md — Guia de manutenção do projeto Memorial

Este arquivo orienta agentes de IA e desenvolvedores a manter este código de forma
consistente. **Leia antes de alterar qualquer arquivo.**

## Visão geral

- **Backend** (`app/`): Flask como **API JSON** sob `/api`, mais `/uploads/...` e o
  fallback que serve o build do React (`frontend/dist`). Todas as rotas ficam em
  `app/routes.py` (blueprint único `memorial`). Modelos em `app/models/`.
- **Frontend** (`frontend/`): React 19 + TypeScript + Tailwind v4 (Vite), react-router,
  TanStack Query, ícones `lucide-react`.
- Mesma origem em dev (proxy do Vite) e em produção (Flask serve o `dist`). Por isso a
  autenticação é por **cookie de sessão** + **CSRF** — não há CORS nem JWT.

## Comandos essenciais

Sempre a partir da raiz do projeto:

```bash
uv sync                                   # deps Python
FLASK_DEBUG=1 PORT=5001 uv run python main.py   # API em dev
cd frontend && npm install && npm run dev       # React em dev (http://localhost:5173)

uv run pytest                             # testes do backend (banco temporário)
cd frontend && npm test && npm run build  # Vitest + tsc + build

uv run alembic check                      # modelos x migrações
```

## Convenções (IMPORTANTE)

1. **Idioma:** PT-BR em nomes de campos, mensagens, componentes e textos de UI
   (`nome_autor`, `frase_efeito`, `MemorialPublico`, `useToast`...).
2. **Contrato da API:** respostas de sucesso em JSON com chave nomeada
   (`{"memorial": ...}`, `{"memoriais": [...]}`); erros sempre `{"erro": "...", "campos"?: [...]}`
   via helper `erro()` em `routes.py`. Serialização centralizada em `memorial_to_dict`,
   `comentario_to_dict`, `usuario_to_dict`. Ao mudar um desses, atualize `frontend/src/types.ts`.
3. **Requisições do frontend** só via `frontend/src/lib/api.ts` (`request()`/`api.*`) — ele
   cuida do token CSRF e converte erros em `ApiError`. Não use `fetch` direto nas páginas.
4. **Identidade visual:** tokens em `frontend/src/index.css` (`@theme`): área logada dark
   (`bg`, `card`, `line`, `ink`, `muted`, `gold`...) e páginas públicas em papel claro
   (`paper*`). Fontes Playfair Display (`font-serif`, títulos) e Inter (`font-sans`).
   Reutilize as classes `.btn`, `.btn-gold`, `.input`, `.field-label`, `.btn-paper` etc.
   Não introduza outras bibliotecas de UI.
5. **Schema:** nunca altere `app/models/` sem migração Alembic
   (`alembic revision --autogenerate`, revise e `upgrade head`).
6. **Banco real:** `instance/memorial.db` contém dados reais. Jamais apagar/resetar.
7. **Uploads:** `instance/uploads/<memorial_id>/`, nome `uuid4().hex.<ext>`. Galerias
   (`gallery_images/videos/audios`) são strings separadas por vírgula; `logo_filename`/
   `banner_filename` são nomes únicos. Campos do multipart: `logo`, `banner`, `imagens`,
   `videos`, `audios`; tipos na API: `logo|banner|imagem|video|audio` (`TIPOS_ARQUIVO`).
8. **Autorização:** dono = `memorial.user_id == current_user.id` (use `memorial_do_dono()`,
   que responde 404/403). Admin = e-mail em `ADMIN_EMAILS` (`admin_required`).
9. **Comentários didáticos** em PT-BR no `routes.py` devem ser mantidos.
10. Extensões (`db`, `login_manager`, `csrf`) são instanciadas fora da factory em
    `app/__init__.py` e inicializadas dentro de `create_app()`.

## Armadilhas conhecidas

- **`create_all()` vs Alembic:** só roda quando `ALEMBIC` ≠ `1`; `migrations/env.py` seta
  `ALEMBIC=1` e dá prioridade a `SQLALCHEMY_DATABASE_URI` do ambiente (antes do `.env`).
- **Banco pré-Alembic:** `uv run alembic stamp 5eda9a7f3788` e depois `upgrade head`
  (a revisão `a1c3e5f7b9d2` desduplica slugs e cria a restrição única). NÃO use `stamp head`.
- **`load_dotenv()`** procura `.env` subindo diretórios: num worktree ele pode ler o `.env`
  do repositório principal (ex.: Postgres). Testes sobrescrevem `DATABASE_URL`.
- **Postgres:** a URL `postgresql://` usa o driver `psycopg2` (`psycopg2-binary` já é dependência).
- **CSRF em testes:** `tests/conftest.py` define `WTF_CSRF_ENABLED=False`; há testes em
  `TestInfra` que religam para validar o fluxo com token.
- **Novas rotas do React** funcionam automaticamente no Flask (fallback `spa()`), desde que
  não comecem com `/api/` ou `/uploads/`.
- `User` não tem relationship `memoriais`; filtre com `Memorial.query.filter_by(user_id=...)`.
- Porta 5001 pode estar ocupada: use `PORT=xxxx` e `FLASK_URL=http://127.0.0.1:xxxx npm run dev`.

## Regras de teste

- **Nunca** rodar testes contra `instance/memorial.db`; as fixtures usam SQLite temporário.
- Backend: adicione testes em `tests/test_routes.py` nas classes existentes (`TestInfra`,
  `TestAuth`, `TestMemorial`, `TestComentarios`, `TestAutorizacao`, `TestAdmin`).
- Frontend: testes em `frontend/src/test/` (Vitest + Testing Library).
- Antes de concluir: `uv run pytest` **e** `cd frontend && npm test && npm run build` sem falhas.

## Checklist de mudanças

1. Leia modelos/migrações antes de mexer no banco.
2. Backend: valide entrada, responda erros com `erro()`, mantenha o contrato da API.
3. Frontend: tipos em `types.ts`, chamadas em `api.ts`, estilos com os tokens do tema.
4. Alterou `app/models/`? Crie e revise a migração.
5. Rode todos os testes e o build.
6. Smoke test: Flask + `npm run dev`, percorra a tela alterada.
7. Não commite `instance/`, `.env`, `frontend/node_modules/` nem `frontend/dist/`.
