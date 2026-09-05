# Bharat Traffic Twin — Preview Run Doc

## How to reproduce artifacts
- `frontend/node_modules/` already present in the worktree. If missing: `cd frontend && npm install`
- No `.env.local` needed — the app uses only client-side mock data.

## How to run the server
```bash
cd frontend && npx vite --port 5174 --host
```
- Logs to `.freebuff/preview-<uuid>.log`
- Default port 5173 may be occupied; use 5174.
- Backend proxy targets localhost:8000 (backend not needed for this demo — all data is mock).
