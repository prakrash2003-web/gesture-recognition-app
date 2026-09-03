"""Tests for the /ws WebSocket endpoint.

FastAPI's TestClient can drive a WebSocket synchronously: `websocket_connect`
opens it, then `send_bytes` / `receive_json` exchange messages. The app runs
in-process, so this exercises the real receive/process loops and the real
GesturePipeline (MediaPipe loads from the bundled model - no network).
"""

import cv2
import numpy as np

from app.gestures import SUPPORTED_GESTURES


def _blank_jpeg(width: int = 320, height: int = 240) -> bytes:
    image = np.zeros((height, width, 3), dtype=np.uint8)
    return cv2.imencode(".jpg", image)[1].tobytes()


def test_sends_ready_with_the_gesture_list_on_connect(client):
    with client.websocket_connect("/ws") as ws:
        message = ws.receive_json()

    assert message["type"] == "ready"
    assert message["recommended_fps"] == 10
    assert {g["id"] for g in message["gestures"]} == {g.id for g in SUPPORTED_GESTURES}


def test_processes_a_frame_and_returns_a_result(client):
    with client.websocket_connect("/ws") as ws:
        ws.receive_json()  # ready
        ws.send_bytes(_blank_jpeg())
        result = ws.receive_json()

    assert result["type"] == "result"
    assert result["hand_present"] is False
    assert result["gesture"] is None
    assert result["landmarks"] is None
    assert result["inference_ms"] >= 0
    assert result["frames_dropped"] >= 0


def test_bad_frame_bytes_produce_an_error_message_not_a_disconnect(client):
    with client.websocket_connect("/ws") as ws:
        ws.receive_json()  # ready
        ws.send_bytes(b"definitely not a jpeg")
        message = ws.receive_json()

        assert message["type"] == "error"
        assert message["detail"]

        # Connection still usable afterwards.
        ws.send_bytes(_blank_jpeg())
        assert ws.receive_json()["type"] == "result"


def test_reset_control_message_is_accepted(client):
    with client.websocket_connect("/ws") as ws:
        ws.receive_json()  # ready
        ws.send_text('{"type": "reset"}')
        ws.send_bytes(_blank_jpeg())
        assert ws.receive_json()["type"] == "result"


def test_unknown_text_message_is_ignored(client):
    with client.websocket_connect("/ws") as ws:
        ws.receive_json()  # ready
        ws.send_text("not json at all")
        ws.send_bytes(_blank_jpeg())
        assert ws.receive_json()["type"] == "result"
