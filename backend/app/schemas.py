"""Pydantic models: the exact shape of the data our API sends and receives.

A Pydantic model is a class where every attribute has a type. FastAPI uses these
models to validate data, to convert responses to JSON, and to build the interactive
API docs. Defining every shape here in one place keeps them consistent, and lets
the frontend's TypeScript types (Phase 4) mirror them one-to-one.
"""

from typing import Literal

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


class ModelInfoResponse(BaseModel):
    """Body returned by GET /model - powers the frontend's Model comparison page."""

    default_classifier: Literal["rule", "ml"] = Field(
        description="Which classifier a new connection starts with."
    )
    ml_available: bool = Field(description="Whether a trained model file is present.")
    report: dict | None = Field(
        default=None,
        description="The committed rule-vs-ML comparison report (ml/reports/comparison.json).",
    )


# --- WebSocket (/ws) message shapes --------------------------------------------
#
# Unlike the REST routes above, FastAPI does not auto-serialize WebSocket traffic,
# so we build these models explicitly and send `model.model_dump()`. The `type`
# field is a discriminator: the frontend switches on it to know which message it
# received. Keeping the shapes here means the TypeScript types in Phase 4 can
# match field-for-field.


class ReadyMessage(BaseModel):
    """First message the server sends after the socket opens."""

    type: Literal["ready"] = "ready"
    gestures: list[Gesture]
    recommended_fps: int = Field(
        default=10, description="How many frames per second the client should send."
    )
    min_confidence: float = Field(
        description="Current classifier threshold (the UI's sensitivity control)."
    )
    classifier: Literal["rule", "ml"] = Field(description="Classifier currently in use.")
    ml_available: bool = Field(description="Whether the ML classifier can be selected.")


class ConfigMessage(BaseModel):
    """Client -> server tuning message, e.g.
    {"type": "config", "min_confidence": 0.6} or {"type": "config", "classifier": "ml"}.
    Every field is optional; only the ones present are applied.
    """

    type: Literal["config"] = "config"
    min_confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    classifier: Literal["rule", "ml"] | None = None


class FrameResultMessage(BaseModel):
    """One processed frame's result."""

    type: Literal["result"] = "result"
    gesture: str | None = Field(description="Gesture id, or null if none recognized.")
    confidence: float = Field(ge=0.0, le=1.0)
    hand_present: bool
    handedness: str | None = Field(description='"Left" / "Right" from the camera view.')
    landmarks: list[list[float]] | None = Field(
        description="21 [x, y] points in 0..1 frame coordinates, for drawing the skeleton."
    )
    scores: dict[str, float] = Field(description="Per-gesture match score, for debugging/UX.")
    inference_ms: float = Field(description="Server time spent on this frame.")
    frames_dropped: int = Field(
        default=0, description="Frames skipped because a newer one had already arrived."
    )


class ErrorMessage(BaseModel):
    """A recoverable problem with one frame. The connection stays open."""

    type: Literal["error"] = "error"
    detail: str
