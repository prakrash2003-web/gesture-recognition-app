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


def test_defaults_to_the_rule_based_classifier():
    pipeline = GesturePipeline()
    try:
        assert pipeline.active_classifier == "rule"
    finally:
        pipeline.close()


def test_ml_request_without_a_model_falls_back_to_rule():
    pipeline = GesturePipeline(classifier="ml", model_path="ml/models/__absent__.joblib")
    try:
        assert pipeline.active_classifier == "rule"
        assert pipeline.ml_available is False
        assert pipeline.ml_error is not None
    finally:
        pipeline.close()


def test_switches_to_ml_when_a_model_is_available(trained_model_path):
    pipeline = GesturePipeline(model_path=str(trained_model_path))
    try:
        assert pipeline.active_classifier == "rule"
        assert pipeline.set_classifier("ml") is True
        assert pipeline.active_classifier == "ml"
        assert pipeline.set_classifier("rule") is True
        assert pipeline.active_classifier == "rule"
    finally:
        pipeline.close()
