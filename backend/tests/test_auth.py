import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# /auth/token
# ---------------------------------------------------------------------------

class TestLogin:
    def test_login_success(self):
        """Valid credentials return 200 with access and refresh tokens."""
        response = client.post("/auth/token", json={"username": "admin", "password": "admin123"})
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0
        assert len(data["refresh_token"]) > 0

    def test_login_wrong_password(self):
        """Wrong password returns 401."""
        response = client.post("/auth/token", json={"username": "admin", "password": "wrong"})
        assert response.status_code == 401

    def test_login_wrong_username(self):
        """Unknown username returns 401."""
        response = client.post("/auth/token", json={"username": "unknown", "password": "admin123"})
        assert response.status_code == 401

    def test_login_missing_fields(self):
        """Missing request body fields returns 422."""
        response = client.post("/auth/token", json={})
        assert response.status_code == 422


# ---------------------------------------------------------------------------
# /auth/refresh
# ---------------------------------------------------------------------------

class TestRefresh:
    def _get_tokens(self):
        response = client.post("/auth/token", json={"username": "admin", "password": "admin123"})
        return response.json()

    def test_refresh_success(self):
        """A valid refresh token returns a new pair of tokens."""
        tokens = self._get_tokens()
        response = client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_refresh_with_access_token_fails(self):
        """Passing an access token to the refresh endpoint returns 401."""
        tokens = self._get_tokens()
        response = client.post("/auth/refresh", json={"refresh_token": tokens["access_token"]})
        assert response.status_code == 401

    def test_refresh_invalid_token(self):
        """A garbage token returns 401."""
        response = client.post("/auth/refresh", json={"refresh_token": "not.a.valid.token"})
        assert response.status_code == 401

    def test_refresh_missing_field(self):
        """Missing refresh_token field returns 422."""
        response = client.post("/auth/refresh", json={})
        assert response.status_code == 422
