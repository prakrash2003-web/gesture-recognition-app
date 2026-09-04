# Build progress

A running checklist of the roadmap so work can resume cleanly across sessions.
Roadmap phases 0-10 are described in `docs/decisions.md` and the chat plan.

| Phase | Scope | Status |
|---|---|---|
| 0 | Repo, venv, tooling, decisions log | done (`fbf82b5`) |
| 1 | FastAPI skeleton: `/`, `/health`, `/gestures`, tests, CI | done (`2e0c003`) |
| 2 | Offline CV pipeline: decode → landmarks → normalize → fingers → rule classifier → smoothing | done (`c31f505`) |
| 3 | WebSocket `/ws` streaming the pipeline; wire-format Pydantic models | done (`09b82bf`) |
| 4 | Frontend skeleton: Vite + React + TS + Tailwind, pages, nav, theme | done (`3de19bc`) |
| 5 | Connect end-to-end: webcam capture → frame throttle → WS → overlay + gesture card | done (`8c9b254`) |
| 6 | Robustness/UX: settings, Recharts dashboard, gesture history, error/reconnect UX, a11y | done (`53aafb5`) |
| 7 | ML upgrade: dataset format, feature set, training + eval + comparison, backend switch, Model page | done — real model trained (2258 samples / 2 sessions, logreg selected, test F1 0.954) |
| 8 | Deployment: backend Docker → Hugging Face Spaces, frontend → Vercel (**needs user accounts/secrets**) | next |
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
- Phase 5 wiring: `useWebcam` (getUserMedia + permission states) -> `frameCapture`
  (downscale to 320px JPEG on a reused canvas) -> `useGestureSocket` (one send
  timer throttled to the server's fps, skip-if-in-flight, backoff reconnect) ->
  `drawLandmarks` (skeleton on an overlay canvas). `LivePage` wires them.
- Browser-only paths (getUserMedia, canvas.toBlob, browser WebSocket) are covered
  by mocked unit tests, NOT a real camera. Transport verified live: preview build
  serves, REST CORS header present, WS handshake returns `ready`.
- TODO Phase 8: the `/ws` endpoint does not yet validate the browser `Origin`
  header (Starlette CORS middleware doesn't cover WebSockets). Add an allowlist
  check before deploying.
- Phase 6: settings live in `useSettings` context (localStorage), session data in
  `useSessionRecorder` context; both wrap the app in `main.tsx`. Sensitivity maps
  to the backend classifier threshold via `sensitivityToMinConfidence`, pushed to
  `/ws` as `{"type":"config","min_confidence":x}`. Classifier gained a runner-up
  margin so near-ties read as "unrecognized". Dashboard is `React.lazy`-loaded
  (keeps Recharts out of the initial bundle). Real threshold tuning still needs
  real webcam data - the plumbing is done, the numbers are provisional.
- Phase 7: feature set in `app/vision/features.py` (25 engineered geometric
  features, `FEATURE_VERSION` guards train/inference match). `backend/ml/`:
  `dataset.py` (CSV of normalized landmarks, session column), `synthetic.py`
  (jittered dataset for pipeline tests), `train.py` (session-group split, compares
  most_frequent / logreg / random_forest / svm_rbf + scores the rule baseline on
  the same test set), `evaluate.py`, `metrics.py`. `app/vision/classifier_ml.py`
  loads the `.joblib`; `GesturePipeline(classifier=...)` switches rule<->ml and
  falls back to rule if no model. `/ws` `ready` now carries `classifier` +
  `ml_available`; `{"type":"config","classifier":"ml"}` switches live. `GET /model`
  serves `ml/reports/comparison.json`. Frontend: `/model` page, engine toggle in
  Settings. Model `.joblib` files and `ml/data/*.csv` are git-ignored.
- Phase 7 real model (2026-09-04): user collected 2258 samples across sessions
  s1/s2 and ran `python -m ml.train`. Committed `comparison.json` is now `real`
  (`provisional:false`). Group-by-session split (s1 train / s2 test):
  logreg F1 0.954 / acc 0.955 (selected), svm_rbf 0.908, random_forest 0.831,
  rule_based 0.636 / acc 0.701, most_frequent 0.045. RF/SVM had higher CV-F1 on
  s1 but lost more on the unseen s2 -> logreg generalises best across sessions.
  Verified: MLClassifier reproduces 0.955 acc on s2; pipeline switch routes to the
  real joblib; missing-model fallback to rule works.
- MediaPipe: classic `solutions.hands` API, model bundled (no download). Works on
  Python 3.12 / Windows with `mediapipe==0.10.21`, `numpy==1.26.4`.
- Vision unit tests use synthetic hands (`tests/fixtures/synthetic_hands.py`) — no camera.
- Rule-based thresholds in `fingers.py` / `classifier_rules.py` are tuned to the
  synthetic fixtures; expect to retune against real webcam data in Phase 5.
- Phase 8 is the hard stop: needs the user's Vercel + Hugging Face accounts.
