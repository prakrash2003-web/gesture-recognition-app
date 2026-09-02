"""Tests for the plain HTTP endpoints: /, /health, /gestures.

Each test follows arrange -> act -> assert: set up inputs, make the call, then
check the result with `assert` statements. pytest reports a test as failed the
moment one of its asserts is false.
"""

from app.gestures import SUPPORTED_GESTURES


def test_root_points_to_docs(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["docs"] == "/docs"


def test_health_reports_ok(client):
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "gestureflow-backend"
    assert body["version"]  # present and non-empty


def test_gestures_returns_all_supported_gestures(client):
    response = client.get("/gestures")

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == len(SUPPORTED_GESTURES)
    assert body["count"] == len(body["gestures"])

    returned_ids = {g["id"] for g in body["gestures"]}
    expected_ids = {g.id for g in SUPPORTED_GESTURES}
    assert returned_ids == expected_ids


def test_gesture_entries_are_well_formed(client):
    """IDs are a contract with the frontend and the classifier - guard against typos."""
    response = client.get("/gestures")

    for gesture in response.json()["gestures"]:
        assert gesture["id"].islower()
        assert " " not in gesture["id"]
        assert gesture["name"]
        assert gesture["emoji"]
        assert gesture["description"]
