# GestureFlow

**A real-time hand gesture recognition web app** — a React frontend streams your
webcam to a Python (FastAPI + MediaPipe) backend over a WebSocket, which detects
21 hand landmarks and classifies the gesture using either a hand-written
rule-based engine or a trained machine-learning model, then streams the result
back to draw a live hand skeleton and the recognized gesture in real time.

[![CI](https://github.com/prakrash2003-web/gesture-recognition-app/actions/workflows/ci.yml/badge.svg)](https://github.com/prakrash2003-web/gesture-recognition-app/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white)
![scikit--learn](https://img.shields.io/badge/scikit--learn-ML%20model-F7931E?logo=scikitlearn&logoColor=white)
![Status](https://img.shields.io/badge/Status-Live-success)

**🟢 Deployed and live** — this is a working, publicly-accessible application, not
a local-only demo. See the Live Demo section below.

---

## Live demo

| Component | Status | Link |
|---|---|---|
| **Frontend (Vercel)** | 🟢 Live | **[gesture-recognition-app-tawny.vercel.app](https://gesture-recognition-app-tawny.vercel.app/)** |
| **Backend API (Render)** | 🟢 Live | [gesture-recognition-app-8ksr.onrender.com](https://gesture-recognition-app-8ksr.onrender.com) |
| **Health check** | 🟢 Working | [`/health`](https://gesture-recognition-app-8ksr.onrender.com/health) → `{"status":"ok","service":"gestureflow-backend","version":"0.1.0"}` |
| **Model info** | 🟢 Working | [`/model`](https://gesture-recognition-app-8ksr.onrender.com/model) → real evaluation report (see below) |

> The backend is on Render's free tier, which sleeps after ~15 minutes idle. The
> first request after a while can take up to ~30 seconds to wake it — the
> frontend shows a "backend may be waking up" message while this happens. This
> is documented behaviour, not a bug.

Open the live app, allow camera access on the **Live** page, and hold up any of
the six [supported gestures](#supported-gestures).

---

## Key features

- **Real-time gesture recognition** from a live webcam feed, ~10 frames/second end to end
- **21-point hand landmark detection** (MediaPipe Hands), drawn as a live skeleton overlay on the video
- **Two interchangeable classifiers** — a hand-written rule-based engine and a trained scikit-learn model — switchable at runtime from the Settings panel
- **WebSocket streaming pipeline** with automatic reconnect/backoff and a live connection-status indicator
- **Session dashboard** — gesture-frequency and confidence-over-time charts, and a gesture-history timeline, built from the live session
- **Model comparison page** — rule-based vs. every trained candidate, with real accuracy/F1 numbers and confusion matrices, served straight from the backend
- **Backend health monitoring** — a live "online/offline" badge polling `GET /health`
- Adjustable sensitivity, target frame rate, mirrored video, skeleton-overlay toggle
- Light/dark theme, responsive layout, accessible controls (`aria-live` gesture announcements, keyboard-operable settings)

---

## How the system works

```
 Webcam  →  React captures + downscales a frame (~320px JPEG)
    ↓
 WebSocket (wss://)  →  sent to the FastAPI backend, ~10×/second
    ↓
 OpenCV decodes the frame  →  MediaPipe Hands finds 21 landmark points
    ↓
 Landmarks are normalized (translation + scale invariant)
    ↓
 Classifier (rule-based OR trained logistic-regression model) scores the hand
    ↓
 Result streamed back over the WebSocket as JSON
    ↓
 React draws the hand skeleton + shows the gesture name and confidence
```

The two classifiers share the same 21-landmark input and the rule-based engine's
output doubles as a zero-dependency fallback if the trained model is ever
unavailable. The reasoning behind every major design choice (why WebSockets, why
server-side vision, why these ML features, why this train/test split) is written
up in [`docs/decisions.md`](docs/decisions.md).

---

## Supported gestures

The single source of truth is `backend/app/gestures.py` — the frontend's Guide
page is generated from this list, so it can never drift out of sync with what the
backend actually recognizes.

| Gesture | | Description |
|---|---|---|
| Open Palm | ✋ | All five fingers extended, palm facing the camera |
| Fist | ✊ | All fingers curled into the palm |
| Thumbs Up | 👍 | Hand closed into a fist with the thumb pointing up |
| Victory / Peace | ✌️ | Index and middle fingers extended in a V, the other fingers closed |
| Pointing Up | ☝️ | Only the index finger extended, pointing upward |
| OK Sign | 👌 | Thumb and index fingertip form a circle; the other fingers extended |

---

## ML model information

- **Approach:** 21 raw MediaPipe landmarks → normalized (wrist-relative, scale
  invariant) → **25 engineered geometric features** (finger extension ratios,
  joint angles, inter-fingertip distances, tip heights) → classifier.
  `app/vision/features.py` is the single feature implementation shared by
  training *and* inference, version-guarded so a stale model can't silently load.
- **Training data:** a real dataset the author recorded personally —
  **2,258 samples across all 6 gesture classes, from 2 separate recording
  sessions** (varied lighting/distance/angle), stored as normalized landmarks
  (never raw images).
- **Model selection:** four candidates were trained and compared against the
  rule-based baseline on a **session-held-out test split** (train on session 1,
  test on session 2 — a genuinely unseen recording, not just a random shuffle, so
  the numbers reflect real generalization rather than memorizing near-duplicate
  frames).
- **Shipped model:** **Logistic Regression** — selected because it generalized
  best across sessions (the more complex models scored higher in
  cross-validation *within* the training session but lost more accuracy on the
  unseen one).
- **Deployed as:** `backend/ml/models/gesture_clf.joblib` (~4 KB), loaded by the
  backend at connection time. If it's ever missing or incompatible, the backend
  logs a warning and transparently serves the rule-based classifier instead — the
  app never breaks.

### Model comparison / results

Real, committed evaluation results (`backend/ml/reports/comparison.json`,
generated by `python -m ml.train`; also served live at
[`/model`](https://gesture-recognition-app-8ksr.onrender.com/model)):

| Model | Accuracy | Macro F1 | |
|---|---|---|---|
| **Logistic Regression** | **95.5%** | **95.4%** | ✅ shipped |
| SVM (RBF kernel) | 90.8% | 90.8% | |
| Random Forest | 84.3% | 83.1% | |
| Rule-based (baseline) | 86.4% | 83.3% | fallback |
| Most-frequent (dummy baseline) | 15.6% | 4.5% | sanity check |

Full per-class precision/recall/F1 and confusion matrices:
[`backend/ml/reports/EVALUATION.md`](backend/ml/reports/EVALUATION.md), or live
at `/model` above.

---

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Recharts |
| Backend | Python, FastAPI, Uvicorn, WebSockets |
| Computer vision | OpenCV, MediaPipe Hands (21-point landmark model) |
| Machine learning | scikit-learn (Logistic Regression, compared against SVM/Random Forest/a dummy baseline), joblib |
| Real-time transport | WebSocket (`/ws`) + REST (`/health`, `/gestures`, `/model`) |
| Testing | pytest (93 backend tests), Vitest + React Testing Library (93 frontend tests) |
| Linting | ruff + ruff format (backend), oxlint (frontend) |
| CI/CD | GitHub Actions (lint + type-check + test + build, both halves, on every push) |
| Containerization | Docker (backend) |
| Hosting | Vercel (frontend), Render (backend) |

See [`docs/decisions.md`](docs/decisions.md) for **why** each technology was chosen over the alternatives.

---

## System / deployment architecture

```
   Browser
      │  HTTPS (static React build)
      ▼
   Vercel  ── frontend ─────────────────────────────┐
      │                                              │
      │  secure WebSocket (wss://) for the video      │  HTTPS REST
      │  stream + gesture results                    │  (/health, /gestures, /model)
      ▼                                              ▼
   Render  ── backend (Docker container) ───────────────────
      FastAPI + Uvicorn
        └── OpenCV: decode incoming frames
        └── MediaPipe Hands: 21 hand landmarks
        └── Trained Logistic Regression model (rule-based fallback)
```

Two independently deployed services, each with its own repository folder and its
own CI job. Webcam access **requires HTTPS** in the browser (or `localhost`) —
both Vercel and Render provide it automatically, which is why the app works from
the deployed URLs but would refuse camera access over plain HTTP. The backend
also validates the WebSocket's `Origin` header against an allow-list, so only the
deployed frontend (or `localhost` in dev) can open `/ws`.

Full deployment runbook (account setup, exact settings, environment variables,
post-deploy checklist): [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## Project structure

```
gesture-recognition-app/
├── frontend/                 React + Vite app (the browser UI)
│   └── src/
│       ├── pages/             Live, Dashboard, Guide, Model, About
│       ├── components/        CameraView, GesturePanel, charts, settings, ...
│       ├── hooks/              useWebcam, useGestureSocket, useSettings, ...
│       └── lib/                 frame capture, landmark drawing, API client
├── backend/                  FastAPI app (computer vision + gesture recognition)
│   ├── app/
│   │   ├── main.py, routes.py, ws.py, schemas.py, config.py
│   │   └── vision/             decode, landmarks, normalize, features,
│   │                           classifier_rules, classifier_ml, pipeline
│   ├── ml/                    training pipeline (dataset, train, evaluate, reports)
│   ├── scripts/                developer utilities (dataset capture, WS smoke test)
│   └── tests/                  pytest suite (93 tests)
├── docs/                     Architecture notes, deployment runbook, screenshots
├── .github/workflows/        CI (lint + test + build, both halves)
├── Dockerfile                 Backend container (built from the repo root)
└── LICENSE
```

---

## Local setup

Needs Python 3.12+, Node.js 20+, and a webcam.

**1. Backend** (terminal 1):
```bash
cd backend
python -m venv ../.venv && ../.venv/Scripts/activate   # Windows; `source ../.venv/bin/activate` on macOS/Linux
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
# -> http://127.0.0.1:8000/docs
```

**2. Frontend** (terminal 2):
```bash
cd frontend
npm install
cp .env.example .env        # points at the local backend by default
npm run dev
# -> http://localhost:5173
```

Open http://localhost:5173, allow camera access, and press **Start** on the Live
page. Per-service details: [`backend/README.md`](backend/README.md) and
[`frontend/README.md`](frontend/README.md). To train or retrain the ML model on
your own recorded gestures: [`backend/ml/README.md`](backend/ml/README.md).

### Environment variables

| Where | Variable | Purpose | Local default |
|---|---|---|---|
| Backend | `GESTUREFLOW_ALLOWED_ORIGINS` | CORS + WebSocket origin allow-list | `http://localhost:5173` |
| Backend | `GESTUREFLOW_CLASSIFIER` | `ml` (trained model) or `rule` (baseline) | `rule` |
| Backend | `GESTUREFLOW_MODEL_PATH` / `GESTUREFLOW_MODEL_REPORT` | override model/report file locations | resolved next to the app |
| Frontend | `VITE_API_BASE_URL` | backend REST base URL | `http://127.0.0.1:8000` |
| Frontend | `VITE_WS_URL` | backend WebSocket URL | `ws://127.0.0.1:8000/ws` |

Templates: `backend/.env.example`, `frontend/.env.example`. None of these are secrets.

---

## Testing / verification

| Suite | Command | Result |
|---|---|---|
| Backend lint | `ruff check .` (from `backend/`) | clean |
| Backend format | `ruff format --check .` | clean |
| Backend tests | `pytest` | **93 passed** |
| Frontend lint | `npx oxlint` (from `frontend/`) | clean |
| Frontend types | `npm run typecheck` | clean |
| Frontend tests | `npm run test:run` | **93 passed** |
| Frontend build | `npm run build` | succeeds |

All of the above run automatically on every push via GitHub Actions (see the CI
badge at the top of this file). ML-specific checks (model loading, inference
smoke test, feature-version compatibility guard, rule-based fallback) are part of
the backend pytest suite.

---

## Screenshots / demo

No screenshots are committed to this repository yet, and none have been faked or
placeholder-imaged in to make the README look more finished than the repo
actually is. The fastest way to see the real thing is the **live demo above** —
it is the actual deployed application, not a static substitute.

_(To add real screenshots later: capture the Live, Dashboard, Model, and About
pages from the URL above and save them as `docs/screenshots/live.png`,
`dashboard.png`, `model.png`, `about.png` — see
[`docs/screenshots/README.md`](docs/screenshots/README.md) for the exact list.
The README can then reference them directly.)_

---

## Deployment

- **Frontend:** Vercel, root directory `frontend/`, static Vite build, SPA
  rewrite (`frontend/vercel.json`) so client-side routes survive a hard refresh.
- **Backend:** Render, Docker runtime, built from the repo-root `Dockerfile`
  (system libs for OpenCV/MediaPipe, the trained model baked into the image,
  runs as a non-root user, `HEALTHCHECK` on `/health`).
- Both services are configured entirely through environment variables (see
  above) — no code changes are needed to point this repo at different hosts.

Step-by-step instructions to deploy your own copy (account setup, exact
dashboard settings, required env vars, post-deploy checklist):
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## Limitations

- **Render free-tier cold start:** the backend sleeps after ~15 minutes idle;
  the first request afterward takes up to ~30s to wake it (documented above and
  in `docs/DEPLOYMENT.md`, handled gracefully in the UI).
- **Single hand only:** the pipeline is configured for one hand at a time
  (`max_num_hands=1`); a second hand in frame is ignored.
- **Six gestures:** the classifier only recognizes the gestures listed above —
  anything else is reported as "unrecognized" rather than guessed.
- **Training data size:** 2,258 samples from one person across two sessions is
  enough to demonstrate a real, working ML pipeline with an honest held-out
  evaluation, but a production system would want more contributors and sessions
  for better generalization across hands, skin tones, and cameras.
- **In-plane rotation:** classification accuracy (both engines) degrades at
  extreme hand rotation angles (roughly beyond ±45°), as documented in
  `docs/decisions.md` and `docs/progress.md`.

---

## Future improvements

- Expand the training dataset with more contributors/sessions for broader generalization
- Support two-hand gestures
- Add more gesture classes
- Automated visual regression / screenshot tests in CI
- Optional user accounts to persist gesture history across sessions (currently session-only, in-memory)
- A CI job that actually builds the Docker image (currently the Dockerfile is only validated by the deploy platform's build)

---

## License

[MIT](LICENSE)
