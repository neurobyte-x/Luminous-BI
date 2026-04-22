# Luminous BI

Luminous BI is a full-stack conversational analytics platform. Users upload CSV files, ask natural-language business questions, and get structured analysis with summaries, charts, SQL-like query output, history, reusable dashboards, ranked decision recommendations, and plain-language what-if simulations.

## Project Goals

- Turn raw CSV data into interactive analytics quickly
- Provide a modern BI user experience with auth and saved work
- Keep backend API modular and deployment-ready
- Support AI-enhanced analysis with safe fallbacks
- Move from descriptive analytics into recommended actions and scenario planning

## Monorepo Structure

```text
Luminous_BI/
  backend/                 FastAPI API service
    app.py                 Backend application entrypoint
    pyproject.toml         Python package/deploy metadata
    uvicorn.toml           Uvicorn runtime config
    config.py              Environment-based settings
    database.py            SQLAlchemy async engine/session setup
    routes/                API route handlers
    services/              Business logic and integrations
    models/                SQLAlchemy and Pydantic models
    data/uploads/          Uploaded CSV files (runtime)

  frontend/                React + Vite web app
    src/app/pages/         Feature pages
    src/app/components/    Reusable UI and chart components
    src/app/lib/api.ts     API client layer

  README.md                Single source of project documentation
```

## Tech Stack

Backend:
- FastAPI
- SQLAlchemy async + asyncpg
- Pydantic
- pandas
- Google Gemini SDK integration

Frontend:
- React 18 + TypeScript
- Vite
- React Router
- Recharts
- Tailwind CSS + Radix UI

## How It Works

1. User signs up/signs in and receives a bearer token.
2. User uploads a CSV file using the upload endpoint.
3. Backend stores file under backend/data/uploads and returns dataset_id + schema summary.
4. User submits a natural-language query with dataset_id.
5. Backend builds analysis using LLM-assisted logic (Gemini when configured), validates output, and returns:
   - summary
   - insights
   - chart specs
   - data rows
   - sql_query text
6. Query Explorer can generate Decision Copilot output: top 3 ranked actions with expected impact and confidence.
7. Query Explorer can run plain-language What-if simulation and return projected KPI ranges.
8. Query and summary are recorded in history.
9. User can save results as dashboards and fetch/delete later.

Important runtime behavior:
- Uploaded DataFrames are cached in process memory for analysis.
- Uploaded CSV files are persisted on disk under a user-scoped directory and can be loaded again after backend restart.
- Query Explorer loads the authenticated user's uploaded datasets and allows selecting which CSV to analyze.

## API Surface

Base URL:
- http://127.0.0.1:8000

Public endpoints:
- GET /health
- POST /auth/signup
- POST /auth/signin
- POST /auth/login

Authenticated endpoints (Authorization: Bearer <token>):
- POST /auth/logout
- POST /auth/signout
- GET /auth/me
- POST /upload
- GET /upload
- POST /analyze
- POST /decision-copilot
- POST /what-if
- GET /history
- POST /dashboard
- GET /dashboard
- GET /dashboard/{dashboard_id}
- DELETE /dashboard/{dashboard_id}

New endpoint behavior:
- GET /upload returns uploaded datasets for the current user only.
- POST /decision-copilot returns ranked action recommendations for a selected dataset and context query.
- POST /what-if parses a plain-language scenario and returns projected KPI ranges with assumptions.

## Environment Variables

Create backend/.env:

```env
DATABASE_URL=postgresql://username:password@host:5432/dbname?sslmode=require
GEMINI_API_KEY=your_google_api_key
GEMINI_MODEL=gemini-2.5-flash
```

Notes:
- DATABASE_URL is required for auth/history/dashboard persistence.
- Backend normalizes postgres connection details for asyncpg compatibility.
- If GEMINI_API_KEY is missing or model call fails, backend returns validated fallback analysis.

Optional frontend/.env:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Local Development Setup

Prerequisites:
- Python 3.11 (required)
- uv
- Node.js 18+
- npm

### Backend

```powershell
cd backend
uv venv --python 3.11
uv sync
```

Run API:

```powershell
uv run uvicorn app:app --config uvicorn.toml
```

Health check:
- GET http://127.0.0.1:8000/health

Optional AI extra (PandasAI connector):

```powershell
uv sync --extra ai
```

Note: The ai extra uses pandasai 2.3.2 and may have version constraints depending on Python/pandas compatibility.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open:
- http://127.0.0.1:5173

## Authentication Model

- Password hashing: PBKDF2-HMAC-SHA256 with random salt and 200k iterations
- Session token: random URL-safe token
- Stored token format: SHA256 digest in database (not plain token)
- Default token TTL: 7 days
- Logout/signout revokes session

## Persistence and Data Model

Core database entities:
- UserAccount
- AuthSession
- QueryHistory
- Dashboard

Startup behavior:
- On startup, backend attempts database schema creation using SQLAlchemy metadata.
- On shutdown, async DB engine is disposed cleanly.

## Frontend Pages and Flow

Main routes include:
- /signin, /signup
- /app/dashboard
- /app/query
- /app/upload
- /app/saved
- /app/comparison
- /app/history
- /app/settings

UI behavior:
- Protected app routes require auth
- Token and user state are persisted client-side
- Query explorer supports dataset selection from previously uploaded CSVs
- Query explorer renders charts, tabular data, insights, SQL output, Decision Copilot actions, and What-if projections

## Build and Deployment

### Backend Deployment

Suggested process:

```bash
cd backend
uv sync
uv run uvicorn app:app --host 0.0.0.0 --port 8000
```

Production recommendations:
- Set reload=false (default when not using --reload)
- Provide DATABASE_URL and GEMINI_* via secure environment variables
- Put API behind reverse proxy/load balancer
- Use managed PostgreSQL

### Frontend Deployment

```bash
cd frontend
npm ci
npm run build
```

Deploy frontend/dist to any static host (Netlify, Vercel static output, Nginx, S3+CloudFront, etc.) and set VITE_API_BASE_URL to your backend URL during build.

## Troubleshooting

Backend exits immediately:
- Ensure backend/.env exists and DATABASE_URL is valid.
- Run from backend directory so uvicorn.toml and local imports resolve correctly.

401 Unauthorized:
- Re-authenticate and confirm Authorization header uses Bearer token.

Analyze fails or returns fallback:
- Verify GEMINI_API_KEY and GEMINI_MODEL.
- Confirm dataset_id belongs to the currently authenticated user.

Decision Copilot or What-if returns 400:
- Check that the selected dataset has numeric columns.
- For What-if, include a percentage in the prompt (for example: increase price by 4%).
- If using segment conditions, ensure the referenced segment value exists in dataset rows.

Frontend npm run dev fails:
- Ensure dependencies installed with npm install inside frontend.
- Verify Node version is compatible (Node 18+).

## Security and Runtime Notes

- Do not commit .env files or secrets.
- Uploaded files and exports are runtime artifacts and are git-ignored.
- CORS defaults allow localhost development origins (3000 and 5173 variants).

## Current Repository Convention

This repository uses one README only:
- Root documentation in README.md
- No separate backend/frontend README files
