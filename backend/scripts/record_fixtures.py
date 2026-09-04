"""Record real hand-landmark samples from a webcam into the training dataset.

A developer utility - not part of the running app or the test suite. It writes
the canonical dataset format (ml.dataset): one CSV per *session*, each row a
gesture label + the 21 NORMALIZED landmarks. Raw images are never stored.

Usage (from the backend/ folder, virtual environment active):

    python scripts/record_fixtures.py --gesture open_palm --session morning
    python scripts/record_fixtures.py --gesture fist       --session morning
    # ... one run per gesture. Repeat all six under a 2nd --session (e.g. "evening")
    # so training can split train/test by session without leakage.

Controls in the window:
    SPACE  start / pause continuous capture (saves ~10 samples/second while a
           hand is visible)
    S      save a single frame
    Q      quit

Then train:  python -m ml.train
"""

from __future__ import annotations

import argparse
import time
from pathlib import Path

import cv2

from app.gestures import SUPPORTED_GESTURES
from app.vision.landmarks import LandmarkDetector
from app.vision.normalize import normalize_landmarks
from ml.dataset import load_dir, open_writer, summary, validate, write_row

_GESTURE_IDS = {g.id for g in SUPPORTED_GESTURES}
_CAPTURE_INTERVAL_S = 0.1  # ~10 samples/second in continuous mode


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--gesture", required=True, help=f"one of: {sorted(_GESTURE_IDS)}")
    parser.add_argument("--session", required=True, help="a name for this recording run")
    parser.add_argument("--out", default="ml/data", help="dataset directory")
    parser.add_argument("--camera", type=int, default=0, help="webcam index")
    parser.add_argument("--target", type=int, default=150, help="samples to aim for")
    args = parser.parse_args()

    if args.gesture not in _GESTURE_IDS:
        raise SystemExit(f"unknown gesture {args.gesture!r}; choose from {sorted(_GESTURE_IDS)}")

    out_dir = Path(args.out)
    csv_path = out_dir / f"{args.session}.csv"

    capture = cv2.VideoCapture(args.camera)
    if not capture.isOpened():
        raise SystemExit(
            f"could not open camera {args.camera}. Try a different --camera index, "
            "or use a phone as a webcam (see the project docs)."
        )

    saved = 0
    recording = False
    last_capture = 0.0
    handle, writer = open_writer(csv_path)

    print(
        f"Recording '{args.gesture}' (session '{args.session}') -> {csv_path}\n"
        f"SPACE = start/pause continuous capture, S = one frame, Q = quit"
    )
    try:
        with LandmarkDetector(static_image_mode=False) as detector:
            while True:
                ok, frame = capture.read()
                if not ok:
                    break
                hand = detector.detect(frame)
                now = time.monotonic()

                take_one = False
                key = cv2.waitKey(1) & 0xFF
                if key == ord("q"):
                    break
                if key == ord(" "):
                    recording = not recording
                if key == ord("s"):
                    take_one = True

                if hand is not None and (
                    take_one or (recording and now - last_capture >= _CAPTURE_INTERVAL_S)
                ):
                    write_row(
                        writer,
                        label=args.gesture,
                        session=args.session,
                        normalized_landmarks=normalize_landmarks(hand.points),
                    )
                    handle.flush()
                    saved += 1
                    last_capture = now

                _draw_hud(frame, hand is not None, recording, saved, args)
                cv2.imshow("record_fixtures", frame)
    finally:
        handle.close()
        capture.release()
        cv2.destroyAllWindows()

    print(f"\ndone: saved {saved} '{args.gesture}' samples to {csv_path}")
    _report_dataset(out_dir)


def _draw_hud(frame, hand: bool, recording: bool, saved: int, args) -> None:
    status = "REC" if recording else "paused"
    colour = (0, 0, 255) if recording else (0, 200, 0)
    hand_txt = "hand" if hand else "no hand"
    cv2.putText(
        frame,
        f"{args.gesture}  [{status}]  {hand_txt}  {saved}/{args.target}",
        (10, 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        colour,
        2,
    )


def _report_dataset(out_dir: Path) -> None:
    try:
        dataset = load_dir(out_dir)
    except FileNotFoundError:
        return
    info = summary(dataset)
    print("\ndataset so far:")
    print(f"  {info['n_samples']} samples across {info['n_sessions']} session(s)")
    for label, count in sorted(info["per_label"].items()):
        print(f"    {label:12s} {count}")
    problems = validate(dataset)
    if problems:
        print("  still needed before training:")
        for p in problems:
            print(f"    - {p}")
    else:
        print("  ready to train:  python -m ml.train")


if __name__ == "__main__":
    main()
