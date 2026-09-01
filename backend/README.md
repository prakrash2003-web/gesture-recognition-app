# backend/

The Python side of GestureFlow: a FastAPI app that receives webcam frames over a WebSocket,
runs MediaPipe hand-landmark detection, classifies the gesture, and streams results back.

**Not built yet.** Implementation starts in **Phase 1** (FastAPI skeleton + `GET /health`).

Planned layout:

```
backend/
├── app/
│   ├── main.py         FastAPI app + middleware + routes
│   ├── ws.py           the /ws WebSocket endpoint (the core loop)
│   ├── routes.py       GET /health, GET /gestures
│   ├── schemas.py      Pydantic message models
│   └── vision/         OpenCV decode, MediaPipe landmarks, classifier, smoothing
├── ml/                 data-collection + training scripts (Phase 2)
├── tests/              pytest
├── requirements.txt
└── Dockerfile
```
