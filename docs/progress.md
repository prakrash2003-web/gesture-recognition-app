# Build progress

A running checklist of the roadmap so work can resume cleanly across sessions.
Roadmap phases 0-10 are described in `docs/decisions.md` and the chat plan.

| Phase | Scope | Status |
|---|---|---|
| 0 | Repo, venv, tooling, decisions log | done (`fbf82b5`) |
| 1 | FastAPI skeleton: `/`, `/health`, `/gestures`, tests, CI | done (`2e0c003`) |
| 2 | Offline CV pipeline: decode → landmarks → normalize → fingers → rule classifier → smoothing | done (`c31f505`) |
| 3 | WebSocket `/ws` streaming the pipeline; wire-format Pydantic models | done (`09b82bf`) |
| 4 | Frontend skeleton: Vite + React + TS + Tailwind, pages, nav, theme | done |
| 5 | Connect end-to-end: webcam capture → frame throttle → WS → overlay + gesture card | next |
| 6 | Robustness/UX: permission + error + reconnect states, stats dashboard, gesture history, guide | todo |
| 7 | ML upgrade: data collection, training, evaluation, confusion matrix, model comparison page | todo |
| 8 | Deployment: backend Docker → Hugging Face Spaces, frontend → Vercel (**needs user accounts/secrets**) | todo |
| 9 | Polish + docs: full README, screenshots, architecture diagram, a11y/perf pass | todo |
| 10 | Optional gesture-driven demo interaction | todo |
| — | CV/interview prep material | todo |

## Notes for whoever resumes

- Backend commands run from `backend/` with the repo `.venv` active:
  `ruff check . && ruff format --check . && pytest -q`.
- Frontend commands run from `frontend/`:
  `npm run lint && npm run typecheck && npm run test:run && npm run build`.
- Frontend stack (from `create-vite`): React 19, Vite 8, TypeScript 6, oxlint,
  Vitest 5, Tailwind v4 (via `@tailwindcss/vite`, config lives in `src/index.css`),
  React Router v7.
- CORS added to the backend early (Phase 4, not 5) because the Guide page fetches
  `/gestures`. Origins via `GESTUREFLOW_ALLOWED_ORIGINS` (default localhost:5173).
- MediaPipe: classic `solutions.hands` API, model bundled (no download). Works on
  Python 3.12 / Windows with `mediapipe==0.10.21`, `numpy==1.26.4`.
- Vision unit tests use synthetic hands (`tests/fixtures/synthetic_hands.py`) — no camera.
- Rule-based thresholds in `fingers.py` / `classifier_rules.py` are tuned to the
  synthetic fixtures; expect to retune against real webcam data in Phase 5.
- Phase 8 is the hard stop: needs the user's Vercel + Hugging Face accounts.
