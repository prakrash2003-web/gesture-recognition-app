"""Stage 6: turn a jittery stream of per-frame predictions into a stable one.

A frame-by-frame classifier flickers: one bad frame (motion blur, a half-formed
hand shape) flips the label for a moment. Humans read that as broken. We fix it
with temporal smoothing - a short memory of recent predictions:

  * Keep the last N predictions in a ring buffer.
  * The reported gesture is the one that holds a majority of that buffer.
  * We only switch to a new gesture once it has been the majority for a few
    frames in a row, which stops rapid back-and-forth.
  * Reported confidence is the average confidence of the winning gesture's frames.

At ~10 fps, a buffer of 6 is about 0.6 s of context - enough to kill flicker,
short enough that the UI still feels responsive.
"""

from __future__ import annotations

from collections import Counter, deque

from app.vision.types import GesturePrediction


class GestureSmoother:
    def __init__(
        self,
        *,
        window: int = 6,
        min_agreement: float = 0.5,
        switch_frames: int = 2,
    ) -> None:
        self._window = window
        self._min_agreement = min_agreement
        self._switch_frames = switch_frames
        self._buffer: deque[GesturePrediction] = deque(maxlen=window)
        self._stable: str | None = None
        self._candidate: str | None = None
        self._candidate_streak = 0

    def update(self, prediction: GesturePrediction) -> GesturePrediction:
        self._buffer.append(prediction)

        labels = [p.gesture for p in self._buffer]
        winner, count = Counter(labels).most_common(1)[0]
        agreement = count / len(self._buffer)

        if agreement >= self._min_agreement and winner is not None:
            if winner == self._stable:
                self._candidate = None
                self._candidate_streak = 0
            elif winner == self._candidate:
                self._candidate_streak += 1
                if self._candidate_streak >= self._switch_frames:
                    self._stable = winner
                    self._candidate = None
                    self._candidate_streak = 0
            else:
                self._candidate = winner
                self._candidate_streak = 1

        matching = [p.confidence for p in self._buffer if p.gesture == self._stable]
        avg_confidence = sum(matching) / len(matching) if matching else prediction.confidence

        return GesturePrediction(
            gesture=self._stable,
            confidence=round(avg_confidence, 4),
            scores=prediction.scores,
        )

    def reset(self) -> None:
        self._buffer.clear()
        self._stable = None
        self._candidate = None
        self._candidate_streak = 0
