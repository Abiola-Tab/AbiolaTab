# STANDOUT B&C Website

Flask construction-company website for STANDOUT B&C with a Cohere assistant and a private management-message inbox.

## Run & Operate

- `python app.py` — run the Flask website on port 5000
- `pip install -r requirements.txt` — install Python dependencies
- Admin login: `/admin/login`; local starter login is `admin` / `admin123`
- Set `COHERE_API_KEY` as a Replit secret to enable Cohere responses
- `DATABASE_URL` enables durable PostgreSQL conversation storage; local development uses SQLite
- Render build/start: `pip install -r requirements.txt` / `gunicorn app:app`
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `app.py` — Flask routes, management conversation API, admin login, Cohere requests, and SQLAlchemy models
- `templates/` — public, admin, and error pages
- `static/` — styles, browser scripts, and the supplied company logo
- `render.yaml`, `Procfile`, `requirements.txt` — Render and Python deployment setup

## Architecture decisions

- Management messages use SQLAlchemy, with SQLite for local preview and PostgreSQL support through `DATABASE_URL`.
- The Cohere key stays on the server; no secret is sent to the browser.
- Render's free filesystem is temporary, so production conversation retention needs a persistent database.

## Product

- Company information and services using STANDOUT B&C's supplied logo and company details
- Visitor AI assistant and direct message threads with management
- Administrator sign-in and private inbox for replying to and resolving conversations

## User preferences

- Use Flask with a root-level `app.py`, plus Python, HTML, JavaScript, and CSS; prepare deployment for Render.
- Use Cohere for the AI chat. Do not use OpenAI.
- Keep the site preview available during development.

## Gotchas

- Change the requested local starter password before exposing the site; production startup rejects `admin123`.
- Add a Render PostgreSQL `DATABASE_URL` before handling real production conversations, or the free instance's SQLite data may be lost.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
