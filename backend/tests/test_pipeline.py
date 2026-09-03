"""Tests for app.vision.pipeline - the end-to-end frame processor."""

import cv2
import numpy as np

from app.vision.decode import FrameDecodeError
from app.vision.pipeline import GesturePipeline


def _jpeg(image: np.ndarray) -> bytes:
    return cv2.imencode(".jpg", image)[1].tobytes()


def test_blank_frame_reports_no_hand():
    pipeline = GesturePipeline()
    try:
        result = pipeline.process_frame(_jpeg(np.zeros((240, 320, 3), dtype=np.uint8)))
    finally:
        pipeline.close()

    assert result.hand_present is False
    assert result.gesture is None
    assert result.landmarks is None
    assert result.inference_ms >= 0


def test_bad_bytes_propagate_a_decode_error():
    pipeline = GesturePipeline()
    try:
        raised = False
        try:
            pipeline.process_frame(b"not a frame")
        except FrameDecodeError:
            raised = True
        assert raised
    finally:
        pipeline.close()


def test_min_confidence_is_clamped_on_construction_and_update():
    pipeline = GesturePipeline(min_confidence=5.0)
    try:
        assert pipeline.min_confidence <= 0.95
        pipeline.set_min_confidence(-1.0)
        assert pipeline.min_confidence >= 0.40
        pipeline.set_min_confidence(0.6)
        assert pipeline.min_confidence == 0.6
    finally:
        pipeline.close()
