"""The plain request/response HTTP endpoints: a health check and the gesture list.

These are "REST" style: one request in, one response out, connection closes. The
live video stream in Phase 3 will use a WebSocket instead - a different tool for a
different job.

`router` is an APIRouter: a group of routes we attach to the app in main.py.
Keeping routes out of main.py keeps each file small and focused.
"""

from fastapi import APIRouter

from app import __version__
from app.gestures import SUPPORTED_GESTURES
from app.schemas import GesturesResponse, HealthResponse

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
