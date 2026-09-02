# backend/

The Python side of GestureFlow: a FastAPI app that (from Phase 3 on) receives webcam
frames over a WebSocket, runs MediaPipe hand-landmark detection, classifies the
gesture, and streams results back.

## Status

**Phase 1 complete** — FastAPI skeleton with the plain HTTP endpoints and a test suite.

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
│   └── vision/          (Phase 2) OpenCV decode, MediaPipe landmarks, classifier, smoothing
├── ml/                  (Phase 7) data-collection + training scripts
├── tests/               pytest suite
│   ├── conftest.py      shared fixtures (the TestClient)
│   └── test_routes.py
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
