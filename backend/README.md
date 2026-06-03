# JWT Backend API

A minimal **FastAPI** application that demonstrates JWT (JSON Web Token) authentication.  
Dependencies are managed with **Poetry** and the app can be deployed with **Docker**.

---

## Features

| Endpoint | Method | Description |
|---|---|---|
| `/auth/token` | `POST` | Authenticate and receive an access token (TTL 300 s) + refresh token |
| `/auth/refresh` | `POST` | Exchange a refresh token for a new token pair |

---

## Prerequisites

- Python 3.11+
- [Poetry](https://python-poetry.org/docs/#installation)
- Docker & Docker Compose *(for containerised deployment)*

---

## Local development

### 1. Install dependencies

```bash
cd backend
poetry install
```

### 2. Run the server

```bash
poetry run uvicorn app.main:app --reload
```

The API will be available at <http://localhost:8000>.  
Interactive docs (Swagger UI): <http://localhost:8000/docs>

---

## Running tests

```bash
cd backend
poetry run pytest tests/ -v
```

---

## Docker deployment

### Build and start

```bash
cd backend
docker compose up --build -d
```

### Stop

```bash
docker compose down
```

---

## API usage

### Login

```bash
curl -X POST http://localhost:8000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

**Response**

```json
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "token_type": "bearer"
}
```

> The `access_token` expires after **300 seconds**.

### Refresh token

```bash
curl -X POST http://localhost:8000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "<refresh_jwt>"}'
```

Returns a fresh token pair with the same structure as the login response.

---

## Project structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── auth.py       # JWT creation / validation helpers
│   ├── main.py       # FastAPI application & route definitions
│   └── models.py     # Pydantic request / response models
├── tests/
│   ├── __init__.py
│   └── test_auth.py  # Endpoint tests
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml
└── README.md
```

---

## Security notes

- **`SECRET_KEY`** – defaults to a placeholder value.  
  **Always** set this to a strong random value (e.g. `openssl rand -hex 32`) via the `SECRET_KEY` environment variable before deploying to production.
- **`APP_USERNAME` / `APP_PASSWORD`** – default to `admin` / `admin123`.  
  Override both via environment variables in production. Passwords should be stored hashed in a database; the single hard-coded user is for demonstration purposes only.
