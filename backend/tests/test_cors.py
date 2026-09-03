"""Tests for the CORS configuration.

CORS is enforced by the browser, not the server - but the server has to send the
right `Access-Control-Allow-Origin` header for the browser to allow the response.
These tests check that header is present for an allowed origin and absent for a
random one.
"""

from app.config import ALLOWED_ORIGINS


def test_allowed_origin_gets_the_cors_header(client):
    origin = ALLOWED_ORIGINS[0]
    response = client.get("/health", headers={"Origin": origin})
    assert response.headers.get("access-control-allow-origin") == origin


def test_unknown_origin_does_not_get_the_cors_header(client):
    response = client.get("/health", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in response.headers


def test_preflight_request_is_answered(client):
    response = client.options(
        "/gestures",
        headers={
            "Origin": ALLOWED_ORIGINS[0],
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ALLOWED_ORIGINS[0]
