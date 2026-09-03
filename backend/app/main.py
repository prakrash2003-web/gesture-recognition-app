"""Application entry point: builds the `app` object that Uvicorn runs.

Start the server locally, from the backend/ folder, with:

    uvicorn app.main:app --reload
            |        |    |
            |        |    +-- auto-restart whenever a .py file changes (dev only)
            |        +------- the variable named `app`, defined below
            +---------------- the module app/main.py
"""

from fastapi import FastAPI

from app import __version__
from app.routes import router as rest_router
from app.ws import router as ws_router

app = FastAPI(
    title="GestureFlow API",
    version=__version__,
    summary="Real-time hand gesture recognition backend.",
)

app.include_router(rest_router)
app.include_router(ws_router)


@app.get("/", tags=["system"])
def root() -> dict[str, str]:
    """Friendly landing response so hitting the base URL isn't a 404."""
    return {"service": "gestureflow-backend", "docs": "/docs"}
