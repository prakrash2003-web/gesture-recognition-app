"""The on-disk labelled-landmark dataset format, plus load / validate helpers.

One row = one hand pose:

    label, session, captured_at, lm0_x, lm0_y, lm0_z, ..., lm20_x, lm20_y, lm20_z

  * label       - a gesture id from app.gestures.SUPPORTED_GESTURES
  * session     - an id for the one recording run this sample came from. Used to
                  split train/test by session so near-duplicate consecutive
                  frames can't leak across the split.
  * captured_at - unix seconds, for provenance only
  * lm*_*       - the 21 landmarks AFTER normalize_landmarks (wrist at origin,
                  hand scaled to ~1). We store normalized landmarks, never raw
                  images, and re-derive model features from them at train time -
                  so the feature set can evolve without re-collecting data.

Files are plain CSV so they are diff-able and inspectable. Put them in ml/data/
(git-ignored); training reads every *.csv it finds there.
"""

from __future__ import annotations

import csv
import time
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from app.gestures import SUPPORTED_GESTURES

_VALID_LABELS = {g.id for g in SUPPORTED_GESTURES}

LANDMARK_COLUMNS: tuple[str, ...] = tuple(
    f"lm{i}_{axis}" for i in range(21) for axis in ("x", "y", "z")
)
HEADER: tuple[str, ...] = ("label", "session", "captured_at", *LANDMARK_COLUMNS)

MIN_SAMPLES_PER_CLASS = 20


@dataclass(frozen=True)
class Dataset:
    landmarks: np.ndarray  # (N, 21, 3) normalized landmarks
    labels: np.ndarray  # (N,) str
    sessions: np.ndarray  # (N,) str

    def __len__(self) -> int:
        return len(self.labels)


def open_writer(path: Path):
    """Open `path` for appending, writing the header if the file is new."""
    path.parent.mkdir(parents=True, exist_ok=True)
    is_new = not path.exists() or path.stat().st_size == 0
    handle = path.open("a", newline="")
    writer = csv.writer(handle)
    if is_new:
        writer.writerow(HEADER)
    return handle, writer


def write_row(writer, *, label: str, session: str, normalized_landmarks: np.ndarray) -> None:
    if label not in _VALID_LABELS:
        raise ValueError(f"unknown gesture label {label!r}")
    if normalized_landmarks.shape != (21, 3):
        raise ValueError(f"expected (21, 3) landmarks, got {normalized_landmarks.shape}")
    flat = normalized_landmarks.astype(np.float64).round(6).flatten().tolist()
    writer.writerow([label, session, f"{time.time():.3f}", *flat])


def dataset_from_raw(raw_landmarks: np.ndarray, labels: list[str], sessions: list[str]) -> Dataset:
    """Build a Dataset from RAW (un-normalized) landmarks, normalizing each one.

    Used by the synthetic-data path so it matches what the on-disk format stores.
    """
    from app.vision.normalize import normalize_landmarks

    normalized = np.array([normalize_landmarks(hand) for hand in raw_landmarks])
    return Dataset(normalized, np.array(labels, dtype=str), np.array(sessions, dtype=str))


def load_files(paths: list[Path]) -> Dataset:
    labels: list[str] = []
    sessions: list[str] = []
    rows: list[list[float]] = []

    for path in paths:
        with path.open(newline="") as handle:
            reader = csv.DictReader(handle)
            missing = set(HEADER) - set(reader.fieldnames or [])
            if missing:
                raise ValueError(f"{path.name}: missing columns {sorted(missing)}")
            for record in reader:
                labels.append(record["label"])
                sessions.append(record["session"])
                rows.append([float(record[col]) for col in LANDMARK_COLUMNS])

    if not rows:
        return Dataset(np.empty((0, 21, 3)), np.array([], dtype=str), np.array([], dtype=str))

    landmarks = np.array(rows, dtype=np.float64).reshape(-1, 21, 3)
    return Dataset(landmarks, np.array(labels, dtype=str), np.array(sessions, dtype=str))


def load_dir(directory: Path) -> Dataset:
    files = sorted(p for p in directory.glob("*.csv"))
    if not files:
        raise FileNotFoundError(f"no *.csv dataset files in {directory}")
    return load_files(files)


def summary(dataset: Dataset) -> dict[str, object]:
    labels, label_counts = np.unique(dataset.labels, return_counts=True)
    sessions, session_counts = np.unique(dataset.sessions, return_counts=True)
    return {
        "n_samples": len(dataset),
        "per_label": dict(zip(labels.tolist(), label_counts.tolist(), strict=True)),
        "per_session": dict(zip(sessions.tolist(), session_counts.tolist(), strict=True)),
        "n_sessions": len(sessions),
    }


def validate(dataset: Dataset) -> list[str]:
    """Return a list of human-readable problems ([] means the dataset is usable)."""
    problems: list[str] = []
    if len(dataset) == 0:
        return ["dataset is empty"]

    unknown = set(dataset.labels.tolist()) - _VALID_LABELS
    if unknown:
        problems.append(f"unknown labels: {sorted(unknown)}")

    missing = _VALID_LABELS - set(dataset.labels.tolist())
    if missing:
        problems.append(f"no samples for: {sorted(missing)}")

    labels, counts = np.unique(dataset.labels, return_counts=True)
    thin = [
        f"{lbl} ({n})" for lbl, n in zip(labels, counts, strict=True) if n < MIN_SAMPLES_PER_CLASS
    ]
    if thin:
        problems.append(f"fewer than {MIN_SAMPLES_PER_CLASS} samples for: {thin}")

    if not np.isfinite(dataset.landmarks).all():
        problems.append("landmark array contains NaN or inf")

    if len(np.unique(dataset.sessions)) < 2:
        problems.append(
            "only one session - train/test split cannot be leakage-safe; "
            "record at least 2 separate sessions"
        )

    return problems
