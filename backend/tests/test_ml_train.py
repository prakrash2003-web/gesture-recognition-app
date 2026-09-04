"""Tests for ml.train - model comparison, split hygiene, persistence."""

import numpy as np
import pytest

from ml.dataset import dataset_from_raw
from ml.synthetic import sample_dataset
from ml.train import _save_model, train


@pytest.fixture(scope="module")
def result():
    raw, labels, sessions = sample_dataset(150, n_sessions=4, seed=11)
    return train(dataset_from_raw(raw, labels, sessions), seed=11, kind="synthetic")


def test_reports_every_candidate_and_the_rule_baseline(result):
    models = result.report["models"]
    assert "rule_based" in models
    assert "most_frequent" in models
    assert result.selected_model in models
    assert result.selected_model not in ("most_frequent", "rule_based")


def test_split_is_by_session_when_multiple_sessions_exist(result):
    assert result.report["split"] == "group-by-session"
    assert result.report["n_train"] + result.report["n_test"] == result.report["n_samples"]


def test_every_model_reports_the_core_metrics(result):
    for metrics in result.report["models"].values():
        for key in ("accuracy", "precision_macro", "recall_macro", "f1_macro"):
            assert 0.0 <= metrics[key] <= 1.0
        assert len(metrics["confusion_matrix"]) == len(metrics["confusion_labels"])


def test_selected_model_beats_the_most_frequent_baseline(result):
    models = result.report["models"]
    assert models[result.selected_model]["f1_macro"] > models["most_frequent"]["f1_macro"]


def test_trained_model_saves_and_reloads(result, tmp_path):
    path = tmp_path / "m.joblib"
    _save_model(result.pipeline, result.report, path)

    import joblib

    bundle = joblib.load(path)
    assert bundle["provisional"] is True
    assert bundle["dataset"] == "synthetic"
    assert bundle["model_name"] == result.selected_model
    assert hasattr(bundle["pipeline"], "predict")


def test_rejects_a_dataset_missing_a_class():
    raw, labels, sessions = sample_dataset(120, n_sessions=3, seed=5)
    keep = np.array(labels) != "fist"
    partial = dataset_from_raw(
        raw[keep],
        np.array(labels)[keep].tolist(),
        np.array(sessions)[keep].tolist(),
    )
    with pytest.raises(ValueError, match="not usable"):
        train(partial)
