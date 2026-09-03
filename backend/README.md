# backend/

The Python side of GestureFlow: a FastAPI app that (from Phase 3 on) receives webcam
frames over a WebSocket, runs MediaPipe hand-landmark detection, classifies the
gesture, and streams results back.

## Status

**Phase 2 complete** — HTTP endpoints + the offline computer-vision pipeline
(decode → landmarks → normalize → finger analysis → rule-based classifier → smoothing).
The WebSocket that streams frames through this pipeline arrives in Phase 3.

| Endpoint | Method | Purpose |
|---|---|---|
| `/` | GET | Friendly landing response pointing at `/docs` |
| `/health` | GET | Liveness check (used by the frontend badge and the deploy platform) |
| `/gestures` | GET | The list of recognizable gestures (single source of truth for the UI) |
| `/docs` | GET | Auto-generated interactive API documentation (Swagger UI) |

## Layout

```
backend/
├── app/
│   ├── __init__.py      package marker + __version__
│   ├── main.py          builds the FastAPI app, mounts the router
│   ├── routes.py        GET /, /health, /gestures
│   ├── schemas.py       Pydantic response models
│   ├── gestures.py      the canonical gesture list
│   └── vision/          the CV pipeline (see below)
│       ├── decode.py         JPEG bytes -> image array (OpenCV)
│       ├── landmarks.py      image -> 21 hand points (MediaPipe)
│       ├── normalize.py      position/scale-independent landmarks
│       ├── geometry.py       distance / angle helpers
│       ├── fingers.py        per-finger extended/curled detection
│       ├── classifier_rules.py   finger pattern + geometry -> gesture
│       ├── smoothing.py      majority vote over recent frames
│       ├── pipeline.py       ties the stages together (used by the WebSocket)
│       └── types.py          dataclasses passed between stages
├── scripts/            developer utilities (record_fixtures.py: capture real landmarks)
├── ml/                  (Phase 7) data-collection + training scripts
├── tests/               pytest suite (synthetic hands; no camera needed)
│   ├── conftest.py      shared fixtures (the TestClient)
│   ├── fixtures/        synthetic 21-point hands
│   └── test_*.py
├── requirements.txt      runtime dependencies
├── requirements-dev.txt  + test/lint tools
├── pyproject.toml        ruff + pytest configuration
└── Dockerfile            (Phase 8)
```

## Running locally

From this `backend/` folder, with the project virtual environment active:

```bash
# 1. install dependencies (first time only)
pip install -r requirements-dev.txt

# 2. start the dev server (auto-reloads on file changes)
uvicorn app.main:app --reload
# -> http://127.0.0.1:8000/docs

# 3. run the checks
ruff check .
ruff format --check .
pytest -v
```
