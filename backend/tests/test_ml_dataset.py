"""Tests for ml.dataset - the on-disk labelled-landmark format and its validation."""

import numpy as np
import pytest

from ml.dataset import (
    HEADER,
    LANDMARK_COLUMNS,
    Dataset,
    dataset_from_raw,
    load_files,
    open_writer,
    summary,
    validate,
    write_row,
)
from ml.synthetic import ALL_GESTURES, sample_dataset


def test_header_has_label_session_time_and_63_landmark_columns():
    assert HEADER[:3] == ("label", "session", "captured_at")
    assert len(LANDMARK_COLUMNS) == 63


def test_round_trips_through_a_csv_file(tmp_path):
    path = tmp_path / "s1.csv"
    handle, writer = open_writer(path)
    for name, make in ALL_GESTURES.items():
        write_row(writer, label=name, session="s1", normalized_landmarks=make())
    handle.close()

    loaded = load_files([path])
    assert len(loaded) == len(ALL_GESTURES)
    assert loaded.landmarks.shape == (len(ALL_GESTURES), 21, 3)
    assert set(loaded.labels.tolist()) == set(ALL_GESTURES)


def test_write_row_rejects_an_unknown_label(tmp_path):
    _handle, writer = open_writer(tmp_path / "x.csv")
    with pytest.raises(ValueError):
        write_row(writer, label="high_five", session="s1", normalized_landmarks=np.zeros((21, 3)))


def test_validate_flags_missing_classes_and_single_session():
    raw, labels, sessions = sample_dataset(30, n_sessions=1, seed=1)
    ds = dataset_from_raw(raw, labels[:60], sessions[:60])  # drop most classes
    problems = validate(ds)
    assert any("no samples for" in p for p in problems)
    assert any("one session" in p for p in problems)


def test_validate_passes_a_healthy_dataset():
    raw, labels, sessions = sample_dataset(120, n_sessions=3, seed=2)
    ds = dataset_from_raw(raw, labels, sessions)
    assert validate(ds) == []


def test_summary_counts_per_label_and_session():
    raw, labels, sessions = sample_dataset(60, n_sessions=2, seed=3)
    info = summary(dataset_from_raw(raw, labels, sessions))
    assert info["n_sessions"] == 2
    assert sum(info["per_label"].values()) == info["n_samples"]


def test_empty_dataset_is_reported_as_empty():
    empty = Dataset(np.empty((0, 21, 3)), np.array([], dtype=str), np.array([], dtype=str))
    assert validate(empty) == ["dataset is empty"]
