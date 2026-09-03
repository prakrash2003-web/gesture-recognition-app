"""Tests for app.vision.decode - JPEG bytes <-> image array."""

import cv2
import numpy as np
import pytest

from app.vision.decode import FrameDecodeError, decode_jpeg, downscale


def _encode(image: np.ndarray) -> bytes:
    ok, buffer = cv2.imencode(".jpg", image)
    assert ok
    return buffer.tobytes()


def test_round_trips_a_real_jpeg():
    original = (np.random.default_rng(0).random((120, 160, 3)) * 255).astype(np.uint8)
    decoded = decode_jpeg(_encode(original))
    assert decoded.shape == (120, 160, 3)
    assert decoded.dtype == np.uint8


def test_empty_payload_is_rejected():
    with pytest.raises(FrameDecodeError):
        decode_jpeg(b"")


def test_garbage_bytes_are_rejected():
    with pytest.raises(FrameDecodeError):
        decode_jpeg(b"this is not an image")


def test_downscale_caps_the_width_and_keeps_aspect_ratio():
    tall = np.zeros((900, 600, 3), dtype=np.uint8)
    out = downscale(tall, max_width=320)
    assert out.shape[1] == 320
    assert out.shape[0] == 480  # 900 * (320/600)


def test_downscale_leaves_small_images_untouched():
    small = np.zeros((100, 200, 3), dtype=np.uint8)
    assert downscale(small, max_width=320) is small
