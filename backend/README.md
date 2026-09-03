# backend/

The Python side of GestureFlow: a FastAPI app that (from Phase 3 on) receives webcam
frames over a WebSocket, runs MediaPipe hand-landmark detection, classifies the
gesture, and streams results back.

## Status

**Phase 3 complete** — the HTTP endpoints, the offline CV pipeline, and the
`/ws` WebSocket that streams webcam frames through that pipeline in real time.

| Endpoint | Method | Purpose |
|---|---|---|
| `/` | GET | Friendly landing response pointing at `/docs` |
| `/health` | GET | Liveness check (used by the frontend badge and the deploy platform) |
| `/gestures` | GET | The list of recognizable gestures (single source of truth for the UI) |
| `/docs` | GET | Auto-generated interactive API documentation (Swagger UI) |
| `/ws` | WebSocket | Send JPEG frames (binary), receive gesture results (JSON) |

### `/ws` protocol

| Direction | Message |
|---|---|
| server → client | `{"type":"ready","gestures":[...],"recommended_fps":10}` once on connect |
| client → server | raw JPEG bytes (one frame) |
| client → server | `{"type":"reset"}` to clear smoothing history |
| server → client | `{"type":"result","gesture":...,"confidence":...,"landmarks":[...],"frames_dropped":N,...}` |
| server → client | `{"type":"error","detail":...}` (connection stays open) |

Each connection gets its own `GesturePipeline`. Only the newest frame is
processed; frames that arrive while one is in flight are dropped (`frames_dropped`
reports how many). MediaPipe runs in a worker thread so it never blocks the server.

Manual check against a live server: `python scripts/ws_smoke.py`.

## Layout

```
backend/
├── app/
│   ├── __init__.py      package marker + __version__
│   ├── main.py          builds the FastAPI app, mounts the router
│   ├── routes.py        GET /, /health, /gestures
│   ├── schemas.py       Pydantic response models
│   ├── gestures.py      the canonical gesture list
│   ├── ws.py           the /ws WebSocket endpoint (receive + process loops)
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
