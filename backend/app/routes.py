"""The plain request/response HTTP endpoints: health, gesture list, model info.

These are "REST" style: one request in, one response out, connection closes. The
live video stream uses a WebSocket instead - a different tool for a different job.

`router` is an APIRouter: a group of routes we attach to the app in main.py.
Keeping routes out of main.py keeps each file small and focused.
"""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter

from app import __version__
from app.config import CLASSIFIER, MODEL_PATH, MODEL_REPORT_PATH
from app.gestures import SUPPORTED_GESTURES
from app.schemas import GesturesResponse, HealthResponse, ModelInfoResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    """Liveness check: returns 200 and a small JSON body when the server is up.

    The frontend polls this to show a "backend online" badge, and the hosting
    platform (Phase 8) uses it to tell whether the container is healthy.
    """
    return HealthResponse(status="ok", service="gestureflow-backend", version=__version__)


@router.get("/gestures", response_model=GesturesResponse, tags=["gestures"])
def list_gestures() -> GesturesResponse:
    """Return every gesture the backend can recognize.

    The frontend fetches this once on load to build its Gesture Guide page, so the
    guide always matches what the backend actually supports.
    """
    return GesturesResponse(count=len(SUPPORTED_GESTURES), gestures=SUPPORTED_GESTURES)


@router.get("/model", response_model=ModelInfoResponse, tags=["model"])
def model_info() -> ModelInfoResponse:
    """Return the rule-vs-ML comparison report and whether the ML model is usable.

    The frontend's Model page renders this. `report` is null until `python -m
    ml.train` has produced ml/reports/comparison.json.
    """
    default = "ml" if CLASSIFIER == "ml" else "rule"
    ml_available = Path(MODEL_PATH).is_file()

    report: dict | None = None
    report_path = Path(MODEL_REPORT_PATH)
    if report_path.is_file():
        try:
            report = json.loads(report_path.read_text())
        except (json.JSONDecodeError, OSError):
            report = None

    return ModelInfoResponse(default_classifier=default, ml_available=ml_available, report=report)
