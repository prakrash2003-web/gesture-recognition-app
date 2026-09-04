# backend/

The Python side of GestureFlow: a FastAPI app that (from Phase 3 on) receives webcam
frames over a WebSocket, runs MediaPipe hand-landmark detection, classifies the
gesture, and streams results back.

## Status

**Phase 7 complete** — HTTP endpoints, the CV pipeline, the `/ws` real-time
stream, and an optional trained ML classifier alongside the rule-based baseline.

| Endpoint | Method | Purpose |
|---|---|---|
| `/` | GET | Friendly landing response pointing at `/docs` |
| `/health` | GET | Liveness check (used by the frontend badge and the deploy platform) |
| `/gestures` | GET | The list of recognizable gestures (single source of truth for the UI) |
| `/model` | GET | Rule-vs-ML comparison report + whether the ML model is available |
| `/docs` | GET | Auto-generated interactive API documentation (Swagger UI) |
| `/ws` | WebSocket | Send JPEG frames (binary), receive gesture results (JSON) |

### `/ws` protocol

| Direction | Message |
|---|---|
| server → client | `{"type":"ready","gestures":[...],"recommended_fps":10,"min_confidence":0.72,"classifier":"rule","ml_available":false}` once on connect |
| client → server | raw JPEG bytes (one frame) |
| client → server | `{"type":"reset"}` to clear smoothing history |
| client → server | `{"type":"config","min_confidence":0.6}` and/or `{"type":"config","classifier":"ml"}` |
| server → client | `{"type":"result","gesture":...,"confidence":...,"landmarks":[...],"frames_dropped":N,...}` |
| server → client | `{"type":"error","detail":...}` (connection stays open) |

### Classifier

The rule-based classifier (`app/vision/classifier_rules.py`) is the always-available
baseline. Set `GESTUREFLOW_CLASSIFIER=ml` (or switch on the Live page) to use the
trained scikit-learn model from `ml/models/gesture_clf.joblib`; it falls back to
rule-based if no model file is present. See [`ml/README.md`](ml/README.md) for how
to collect data and train.

Each connection gets its own `GesturePipeline`. Only the newest frame is
processed; frames that arrive while one is in flight are dropped (`frames_dropped`
reports how many). MediaPipe runs in a worker thread so it never blocks the server.

The `/ws` endpoint rejects (close code 1008) browser connections whose `Origin`
is not in `GESTUREFLOW_ALLOWED_ORIGINS`; clients that send no `Origin` (scripts)
are allowed. Set `GESTUREFLOW_WS_ALLOW_ANY_ORIGIN=1` to disable the check.

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
│   ├── config.py        env-var settings (CORS origins, classifier, model path)
│   ├── ws.py           the /ws WebSocket endpoint (receive + process loops)
│   └── vision/          the CV pipeline (see below)
│       ├── decode.py         JPEG bytes -> image array (OpenCV)
│       ├── landmarks.py      image -> 21 hand points (MediaPipe)
│       ├── normalize.py      position/scale-independent landmarks
│       ├── geometry.py       distance / angle helpers
│       ├── fingers.py        per-finger extended/curled detection
│       ├── features.py       normalized hand -> 25-value feature vector (train + inference)
│       ├── classifier_rules.py   finger pattern + geometry -> gesture (baseline)
│       ├── classifier_ml.py  trained scikit-learn model inference wrapper
│       ├── smoothing.py      majority vote over recent frames
│       ├── pipeline.py       ties the stages together; switches rule <-> ml
│       └── types.py          dataclasses passed between stages
├── scripts/            developer utilities (record_fixtures.py, ws_smoke.py)
├── ml/                  offline ML pipeline - see ml/README.md
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
