"""The canonical set of gestures GestureFlow recognizes - the single source of truth.

Exposed to the frontend at GET /gestures, and imported by the classifier in Phase 2,
so the guide shown in the UI can never drift from what the recognizer supports.
"""

from app.schemas import Gesture

SUPPORTED_GESTURES: list[Gesture] = [
    Gesture(
        id="open_palm",
        name="Open Palm",
        emoji="✋",
        description="All five fingers extended, palm facing the camera.",
    ),
    Gesture(
        id="fist",
        name="Fist",
        emoji="✊",
        description="All fingers curled into the palm.",
    ),
    Gesture(
        id="thumbs_up",
        name="Thumbs Up",
        emoji="\U0001f44d",
        description="Hand closed into a fist with the thumb pointing up.",
    ),
    Gesture(
        id="victory",
        name="Victory / Peace",
        emoji="✌️",
        description="Index and middle fingers extended in a V, the other fingers closed.",
    ),
    Gesture(
        id="pointing_up",
        name="Pointing Up",
        emoji="☝️",
        description="Only the index finger extended, pointing upward.",
    ),
    Gesture(
        id="ok_sign",
        name="OK Sign",
        emoji="\U0001f44c",
        description="Thumb and index fingertip form a circle; the other fingers extended.",
    ),
]
