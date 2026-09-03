"""Stage 2: find a hand in the image and return its 21 landmark points.

This is the one stage we do NOT implement ourselves: MediaPipe Hands is a
pre-trained model from Google that locates a hand and regresses 21 joint
positions (wrist + 4 points per finger). Re-training something equivalent would
be a multi-month project on its own and is not what this portfolio piece is about
- the interesting, hand-written logic is the gesture classification in the next
stages.

We use the classic `mediapipe.solutions.hands` API: the model is bundled with the
package (no separate download), which keeps local dev, CI, and the Docker image
simple. MediaPipe's newer "Tasks" API is the forward-looking alternative but needs
a model file managed alongside the code.
"""

from __future__ import annotations

import mediapipe as mp
import numpy as np

from app.vision.types import HandLandmarks

_mp_hands = mp.solutions.hands


class LandmarkDetector:
    """Wraps a MediaPipe Hands graph. Not thread-safe: create one per connection.

    `min_detection_confidence` / `min_tracking_confidence` are MediaPipe's own
    thresholds for "is this a hand" and "is this still the same hand as last
    frame". `static_image_mode=False` means MediaPipe tracks the hand across
    frames instead of re-detecting from scratch every time, which is faster for a
    live video stream.
    """

    def __init__(
        self,
        *,
        max_num_hands: int = 1,
        min_detection_confidence: float = 0.6,
        min_tracking_confidence: float = 0.5,
        static_image_mode: bool = False,
    ) -> None:
        self._hands = _mp_hands.Hands(
            static_image_mode=static_image_mode,
            max_num_hands=max_num_hands,
            model_complexity=0,  # 0 = lite model: fastest, accurate enough for gestures
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )

    def detect(self, image_bgr: np.ndarray) -> HandLandmarks | None:
        """Return the most prominent hand's landmarks, or None if no hand is found.

        MediaPipe expects an RGB image; OpenCV gives us BGR, so we swap channels.
        """
        image_rgb = image_bgr[:, :, ::-1]
        result = self._hands.process(image_rgb)

        if not result.multi_hand_landmarks:
            return None

        hand = result.multi_hand_landmarks[0]
        points = np.array([[lm.x, lm.y, lm.z] for lm in hand.landmark], dtype=np.float64)

        handedness = "Unknown"
        detection_confidence = 0.0
        if result.multi_handedness:
            classification = result.multi_handedness[0].classification[0]
            handedness = classification.label
            detection_confidence = float(classification.score)

        return HandLandmarks(
            points=points,
            handedness=handedness,
            detection_confidence=detection_confidence,
        )

    def close(self) -> None:
        self._hands.close()

    def __enter__(self) -> LandmarkDetector:
        return self

    def __exit__(self, *_exc: object) -> None:
        self.close()
