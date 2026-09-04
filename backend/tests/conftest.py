"""Shared test fixtures.

pytest loads any file named conftest.py automatically, for every test in this
folder - the tests never import it directly.
"""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    """An HTTP client that calls the app in-process: no network, no running server.

    A test that has a `client` parameter receives whatever this function returns.
    """
    return TestClient(app)


@pytest.fixture(scope="session")
def trained_model_path(tmp_path_factory: pytest.TempPathFactory) -> Path:
    """Train a small synthetic model once per test session and return its path.

    Real datasets are not available in CI, so ML-inference tests use a model
    trained on the synthetic hands - enough to exercise the load / predict /
    fallback code paths.
    """
    from ml.dataset import dataset_from_raw
    from ml.synthetic import sample_dataset
    from ml.train import _save_model, train

    raw, labels, sessions = sample_dataset(120, n_sessions=3, seed=7)
    dataset = dataset_from_raw(raw, labels, sessions)
    result = train(dataset, seed=7, kind="synthetic")

    path = tmp_path_factory.mktemp("model") / "gesture_clf.joblib"
    _save_model(result.pipeline, result.report, path)
    return path
