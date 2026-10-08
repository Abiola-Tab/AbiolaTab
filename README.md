# STANDOUT B&C

A responsive website for the Nairobi construction company, with a Cohere-powered AI assistant, a private management inbox, and an administrator sign-in.

## Run locally

```bash
pip install -r requirements.txt
python app.py
```

Open the preview at the root URL. The administrator sign-in is at `/admin/login`.

For a local first run, the requested starter credentials are:

- Username: `admin`
- Password: `admin123`

Change these before exposing the site to the public. The app reads `ADMIN_USERNAME` and `ADMIN_PASSWORD` from the environment; Render refuses to start with the default password.

## Cohere AI

The Cohere key is only read by the Flask server. Do not put it in HTML, JavaScript, source control, or a browser request.

- In Replit, save it as the `COHERE_API_KEY` secret to enable Cohere in the preview.
- In Render, add `COHERE_API_KEY` under the web service's Environment settings. The included `render.yaml` prompts for it as a private value.
- The default model is `command-a-03-2025`. To change it, set `COHERE_MODEL`.

Without a Cohere key the chat uses a small company-information fallback so the preview stays usable. Once a key is configured, messages are answered by Cohere's Chat API.

## Deploy on Render

1. Push this project to a GitHub repository.
2. In Render, create a Web Service from that repository and choose the included Blueprint configuration (`render.yaml`).
3. Set a strong private `ADMIN_PASSWORD`. The username defaults to `admin`; you can change it with `ADMIN_USERNAME`.
4. Add your Cohere API key as `COHERE_API_KEY` in Render's Environment settings.
5. The service builds with `pip install -r requirements.txt` and starts with `gunicorn app:app`. The health-check endpoint is `/health`.

The included service uses Render's free web-service plan. Its filesystem is temporary, so the default SQLite database is suitable for the preview but **not for durable production conversations**. To keep the management inbox across deploys and restarts, create a PostgreSQL database in Render and set `DATABASE_URL` to its internal connection URL. SQLAlchemy and the PostgreSQL driver are already included. You can also set `DATABASE_PATH` when using SQLite on a persistent disk.

## Company details

STANDOUT B&C provides new and custom home construction, commercial and light industrial work, renovations, additions, kitchen and bathroom remodels, foundations, roofing, framing, project management, and design-build services.

Office: Park Plaza Building, along Eastern Bypass, Utawala, Nairobi  
Phone: 0731157929  
Director: CPM. Okolla Felix  
Site Engineer: B.Tech Frank Okotsi

Project photos have not been supplied yet; the site leaves the gallery ready for the company's real work rather than showing invented projects.
