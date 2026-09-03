"""Stage 1: turn the JPEG bytes the browser sends into a NumPy image array.

The browser captures a webcam frame, compresses it to JPEG (small = fast to send
over the WebSocket), and sends the raw bytes. OpenCV decodes those bytes back into
a height x width x 3 array of pixels that the rest of the pipeline can work on.
"""

from __future__ import annotations

import cv2
import numpy as np


class FrameDecodeError(ValueError):
    """Raised when the received bytes are not a decodable image."""


def decode_jpeg(data: bytes) -> np.ndarray:
    """Decode JPEG/PNG bytes to a BGR image array of shape (H, W, 3), dtype uint8.

    OpenCV returns images in BGR channel order (blue, green, red) rather than the
    more common RGB - a historical quirk we account for when handing frames to
    MediaPipe.

    Raises FrameDecodeError if the bytes cannot be decoded.
    """
    if not data:
        raise FrameDecodeError("empty frame payload")

    buffer = np.frombuffer(data, dtype=np.uint8)
    image = cv2.imdecode(buffer, cv2.IMREAD_COLOR)
    if image is None:
        raise FrameDecodeError("bytes are not a valid image")
    return image


def downscale(image: np.ndarray, max_width: int = 320) -> np.ndarray:
    """Shrink the image so it is at most `max_width` pixels wide (keeps aspect ratio).

    Landmark detection does not need a large image, and smaller frames are much
    faster to process. The browser already downscales before sending; this is a
    safety net for clients that do not.
    """
    height, width = image.shape[:2]
    if width <= max_width:
        return image
    scale = max_width / width
    new_size = (max_width, max(1, round(height * scale)))
    return cv2.resize(image, new_size, interpolation=cv2.INTER_AREA)
