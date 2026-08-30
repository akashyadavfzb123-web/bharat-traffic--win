# Run Doc — Bharat Traffic Twin Frontend Preview

## Prerequisites
- Backend running on port 8000 (`cd backend && source venv/bin/activate && uvicorn app.main:app --port 8000`)
- PostgreSQL connected (DATABASE_URL in `backend/.env`)

## How to reproduce artifacts
1. Copy `.env` from main checkout root: `cp frontend/.env frontend/.env.local` (or just use `frontend/.env`)
2. Dependencies already installed in `frontend/node_modules/`

## How to run the server
```bash
cd frontend
npm run dev -- --port 5174
```
Vite proxies `/api` requests to `http://localhost:8000` via the proxy config in `vite.config.ts`.

## Environment
- Frontend: http://localhost:5174
- Backend: http://localhost:8000
- API base: http://localhost:8000/api

## Preview
- Port: 5174
- URL: http://localhost:5174
