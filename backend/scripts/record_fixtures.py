"""Record real hand-landmark samples from your webcam.

This is a developer utility, not part of the app or the test suite. It has two uses:

  * Phase 2/5: capture a handful of REAL landmark arrays for a gesture and eyeball
    that the rule-based classifier agrees with them.
  * Phase 7: collect the labelled dataset the scikit-learn classifier trains on.

Usage (from the backend/ folder, virtual environment active):

    python scripts/record_fixtures.py --gesture thumbs_up --out ml/data

Controls: press SPACE to save the current frame's landmarks, Q to quit.
Each capture appends one row (label + 63 numbers) to <out>/<gesture>.csv.
"""

from __future__ import annotations

import argparse
import csv
import time
from pathlib import Path

import cv2

from app.vision.landmarks import LandmarkDetector
from app.vision.normalize import normalize_landmarks


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--gesture", required=True, help="gesture id, e.g. thumbs_up")
    parser.add_argument("--out", default="ml/data", help="output directory")
    parser.add_argument("--camera", type=int, default=0, help="webcam index")
    args = parser.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    csv_path = out_dir / f"{args.gesture}.csv"

    capture = cv2.VideoCapture(args.camera)
    if not capture.isOpened():
        raise SystemExit(f"could not open camera {args.camera}")

    saved = 0
    with (
        LandmarkDetector(static_image_mode=False) as detector,
        csv_path.open("a", newline="") as handle,
    ):
        writer = csv.writer(handle)
        print(f"Recording '{args.gesture}' -> {csv_path}. SPACE = save, Q = quit.")
        while True:
            ok, frame = capture.read()
            if not ok:
                break
            hand = detector.detect(frame)

            overlay = frame.copy()
            status = "hand detected" if hand else "no hand"
            cv2.putText(
                overlay,
                f"{status}  saved={saved}",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 255, 0),
                2,
            )
            cv2.imshow("record_fixtures", overlay)

            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                break
            if key == ord(" ") and hand is not None:
                row = normalize_landmarks(hand.points).flatten().round(6).tolist()
                writer.writerow([args.gesture, time.time(), *row])
                handle.flush()
                saved += 1

    capture.release()
    cv2.destroyAllWindows()
    print(f"done: {saved} samples in {csv_path}")


if __name__ == "__main__":
    main()
