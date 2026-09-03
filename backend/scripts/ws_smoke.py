"""Manual end-to-end check of the /ws endpoint against a running server.

Start the server first (from backend/, venv active):
    uvicorn app.main:app

Then, in another terminal:
    python scripts/ws_smoke.py

It opens the socket, sends a few synthetic frames, and prints each reply. Use it
to sanity-check the real network path (TestClient only exercises the app
in-process).
"""

from __future__ import annotations

import asyncio
import json

import cv2
import numpy as np
import websockets

URL = "ws://127.0.0.1:8000/ws"


def _synthetic_frame() -> bytes:
    image = (np.random.default_rng().random((240, 320, 3)) * 255).astype(np.uint8)
    return cv2.imencode(".jpg", image)[1].tobytes()


async def main() -> None:
    async with websockets.connect(URL, max_size=4 * 1024 * 1024) as ws:
        ready = json.loads(await ws.recv())
        print("ready:", ready["type"], "-", len(ready["gestures"]), "gestures")

        for i in range(5):
            await ws.send(_synthetic_frame())
            reply = json.loads(await ws.recv())
            print(
                f"frame {i}: type={reply['type']} hand={reply.get('hand_present')} "
                f"gesture={reply.get('gesture')} infer={reply.get('inference_ms')}ms "
                f"dropped={reply.get('frames_dropped')}"
            )
            await asyncio.sleep(0.1)

        await ws.send('{"type": "reset"}')
        await ws.send(b"not a jpeg")
        err = json.loads(await ws.recv())
        print("bad frame:", err["type"], "-", err.get("detail"))


if __name__ == "__main__":
    asyncio.run(main())
