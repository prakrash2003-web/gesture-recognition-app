"""Application entry point: builds the `app` object that Uvicorn runs.

Start the server locally, from the backend/ folder, with:

    uvicorn app.main:app --reload
            |        |    |
            |        |    +-- auto-restart whenever a .py file changes (dev only)
            |        +------- the variable named `app`, defined below
            +---------------- the module app/main.py
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import ALLOWED_ORIGINS
from app.routes import router as rest_router
from app.ws import router as ws_router

app = FastAPI(
    title="GestureFlow API",
    version=__version__,
    summary="Real-time hand gesture recognition backend.",
)

# CORS ("Cross-Origin Resource Sharing"): browsers block a page served from one
# origin (e.g. localhost:5173) from reading responses from another origin
# (localhost:8000) unless the server explicitly opts in with these headers.
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(rest_router)
app.include_router(ws_router)


@app.get("/", tags=["system"])
def root() -> dict[str, str]:
    """Friendly landing response so hitting the base URL isn't a 404."""
    return {"service": "gestureflow-backend", "docs": "/docs"}
