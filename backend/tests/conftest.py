"""Shared test fixtures.

pytest loads any file named conftest.py automatically, for every test in this
folder - the tests never import it directly.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    """An HTTP client that calls the app in-process: no network, no running server.

    A test that has a `client` parameter receives whatever this function returns.
    """
    return TestClient(app)
