"""The /ws WebSocket endpoint: the real-time core of the backend.

Lifecycle of one connection:

    browser connects
        -> server accepts, builds a GesturePipeline (loads MediaPipe), sends "ready"
        -> browser streams JPEG frames (binary) ~10x/second
        -> server processes the NEWEST frame, sends a "result", repeats
        -> browser closes (camera stopped) -> server tears the pipeline down

Two concurrent tasks per connection:

  * receiver  - reads every incoming message and keeps only the most recent frame
                (older un-processed frames are dropped: a stale gesture is useless).
  * processor - whenever a new frame is waiting, runs it through the pipeline in a
                worker thread (MediaPipe is blocking) and sends the result back.

They share a tiny `_ConnectionState`. An asyncio.Event wakes the processor only
when there is something to do, so an idle connection costs nothing.
"""

from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass, field

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError
from starlette.concurrency import run_in_threadpool

from app.config import ALLOWED_ORIGINS, CLASSIFIER, MODEL_PATH, WS_CHECK_ORIGIN
from app.gestures import SUPPORTED_GESTURES
from app.schemas import ConfigMessage, ErrorMessage, FrameResultMessage, ReadyMessage
from app.vision.decode import FrameDecodeError
from app.vision.pipeline import GesturePipeline

router = APIRouter()

_RECOMMENDED_FPS = 10


def _start_classifier() -> str:
    return "ml" if CLASSIFIER == "ml" else "rule"


def _origin_allowed(websocket: WebSocket) -> bool:
    """CORS middleware does not cover WebSockets, so we check the Origin here.

    A browser always sends `Origin`; non-browser clients (our smoke script) send
    none and are allowed. A present-but-unlisted origin is rejected.
    """
    if not WS_CHECK_ORIGIN:
        return True
    origin = websocket.headers.get("origin")
    return origin is None or origin in ALLOWED_ORIGINS


@dataclass
class _ConnectionState:
    latest_frame: bytes | None = None
    frames_received: int = 0
    frames_processed: int = 0
    reset_requested: bool = False
    pending_min_confidence: float | None = None
    pending_classifier: str | None = None
    open: bool = True
    wake: asyncio.Event = field(default_factory=asyncio.Event)


async def _receive_loop(websocket: WebSocket, state: _ConnectionState) -> None:
    """Consume every inbound message; keep just the newest frame."""
    while state.open:
        message = await websocket.receive()

        if message["type"] == "websocket.disconnect":
            state.open = False
            state.wake.set()
            return

        if (data := message.get("bytes")) is not None:
            state.latest_frame = data
            state.frames_received += 1
            state.wake.set()
        elif (text := message.get("text")) is not None:
            _handle_control_message(text, state)


def _handle_control_message(text: str, state: _ConnectionState) -> None:
    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        return
    if not isinstance(payload, dict):
        return

    kind = payload.get("type")
    if kind == "reset":
        state.reset_requested = True
        state.wake.set()
    elif kind == "config":
        try:
            config = ConfigMessage.model_validate(payload)
        except ValidationError:
            return
        if config.min_confidence is not None:
            state.pending_min_confidence = config.min_confidence
        if config.classifier is not None:
            state.pending_classifier = config.classifier
        state.wake.set()


async def _process_loop(
    websocket: WebSocket, pipeline: GesturePipeline, state: _ConnectionState
) -> None:
    """Process the newest waiting frame, forever, until the socket closes."""
    while state.open:
        await state.wake.wait()
        state.wake.clear()

        if state.reset_requested:
            state.reset_requested = False
            await run_in_threadpool(pipeline.reset)

        if state.pending_min_confidence is not None:
            pipeline.set_min_confidence(state.pending_min_confidence)
            state.pending_min_confidence = None

        if state.pending_classifier is not None:
            wanted = state.pending_classifier
            state.pending_classifier = None
            ok = await run_in_threadpool(pipeline.set_classifier, wanted)
            if not ok:
                await _safe_send(
                    websocket,
                    ErrorMessage(detail=pipeline.ml_error or "classifier unavailable"),
                )

        frame = state.latest_frame
        state.latest_frame = None
        if frame is None:
            continue

        received_when_taken = state.frames_received
        try:
            result = await run_in_threadpool(pipeline.process_frame, frame)
        except FrameDecodeError as exc:
            await _safe_send(websocket, ErrorMessage(detail=str(exc)))
            continue

        state.frames_processed += 1
        dropped = received_when_taken - state.frames_processed
        await _safe_send(
            websocket,
            FrameResultMessage(
                gesture=result.gesture,
                confidence=result.confidence,
                hand_present=result.hand_present,
                handedness=result.handedness,
                landmarks=result.landmarks,
                scores=result.scores,
                inference_ms=result.inference_ms,
                frames_dropped=max(0, dropped),
            ),
        )


async def _safe_send(
    websocket: WebSocket, message: ReadyMessage | FrameResultMessage | ErrorMessage
) -> None:
    try:
        await websocket.send_json(message.model_dump())
    except (WebSocketDisconnect, RuntimeError):
        # Client vanished between receiving a frame and sending its result.
        pass


@router.websocket("/ws")
async def gesture_socket(websocket: WebSocket) -> None:
    if not _origin_allowed(websocket):
        await websocket.close(code=1008)  # policy violation
        return

    await websocket.accept()

    pipeline: GesturePipeline = await run_in_threadpool(
        lambda: GesturePipeline(classifier=_start_classifier(), model_path=MODEL_PATH)
    )
    await _safe_send(
        websocket,
        ReadyMessage(
            gestures=list(SUPPORTED_GESTURES),
            recommended_fps=_RECOMMENDED_FPS,
            min_confidence=pipeline.min_confidence,
            classifier=pipeline.active_classifier,
            ml_available=pipeline.ml_available,
        ),
    )

    state = _ConnectionState()
    receiver = asyncio.create_task(_receive_loop(websocket, state))
    try:
        await _process_loop(websocket, pipeline, state)
    except WebSocketDisconnect:
        pass
    finally:
        state.open = False
        receiver.cancel()
        await run_in_threadpool(pipeline.close)
