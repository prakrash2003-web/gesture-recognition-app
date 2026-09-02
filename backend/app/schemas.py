"""Pydantic models: the exact shape of the data our API sends and receives.

A Pydantic model is a class where every attribute has a type. FastAPI uses these
models to validate data, to convert responses to JSON, and to build the interactive
API docs. Defining every shape here in one place keeps them consistent, and lets
the frontend's TypeScript types (Phase 4) mirror them one-to-one.
"""

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Body returned by GET /health."""

    status: str = Field(examples=["ok"])
    service: str = Field(examples=["gestureflow-backend"])
    version: str = Field(examples=["0.1.0"])


class Gesture(BaseModel):
    """One gesture the backend knows how to recognize."""

    id: str = Field(
        description="Stable machine name, used in code and WebSocket messages.",
        examples=["thumbs_up"],
    )
    name: str = Field(description="Human-friendly label for the UI.", examples=["Thumbs Up"])
    emoji: str = Field(examples=["\U0001f44d"])
    description: str = Field(description="How a person performs this gesture.")


class GesturesResponse(BaseModel):
    """Body returned by GET /gestures."""

    count: int
    gestures: list[Gesture]
