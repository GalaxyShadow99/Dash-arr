import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from auth import create_access_token
from config import SONARR_URL
from main import app

client = TestClient(app)
FIXTURES_DIR = Path(__file__).parent / "fixtures"


def load_fixture(filename: str):
    return json.loads((FIXTURES_DIR / filename).read_text())


@pytest.fixture
def auth_headers():
    token = create_access_token({"sub": "admin@example.com"})
    return {"Authorization": f"Bearer {token}"}


# ENDPOINT: GET /api/sonarr/series
def test_get_series(respx_mock, auth_headers):
    """GET /api/sonarr/series - Liste toutes les séries surveillées."""
    series_data = load_fixture("sonarr_series.json")
    respx_mock.get(f"{SONARR_URL}/api/v3/series").respond(200, json=series_data)

    response = client.get("/api/sonarr/series", headers=auth_headers)
    assert response.status_code == 200

    payload = response.json()
    assert payload["success"] is True
    assert len(payload["data"]) == len(series_data)


# ENDPOINT: GET /api/sonarr/series/{series_id}
def test_get_series_details(respx_mock, auth_headers):
    """GET /api/sonarr/series/{series_id} - Récupère les détails d'une série."""
    series_list = load_fixture("sonarr_series.json")
    real_series = series_list[0]
    series_id = real_series["id"]

    respx_mock.get(f"{SONARR_URL}/api/v3/series/{series_id}").respond(
        200, json=real_series
    )

    response = client.get(f"/api/sonarr/series/{series_id}", headers=auth_headers)
    assert response.status_code == 200

    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["id"] == series_id


# ENDPOINT: GET /api/sonarr/lookup
def test_lookup_series(respx_mock, auth_headers):
    """GET /api/sonarr/lookup - Recherche une série par terme."""
    lookup_data = load_fixture("sonarr_lookup.json")
    respx_mock.get(f"{SONARR_URL}/api/v3/series/lookup").respond(200, json=lookup_data)

    response = client.get(
        "/api/sonarr/lookup?term=Breaking%20Bad", headers=auth_headers
    )
    assert response.status_code == 200

    payload = response.json()
    assert payload["success"] is True
    assert len(payload["data"]) > 0


# ENDPOINT: GET /api/sonarr/releases
def test_get_series_releases(respx_mock, auth_headers):
    """GET /api/sonarr/releases - Liste les releases pour une série."""
    series_list = load_fixture("sonarr_series.json")
    series_id = series_list[0]["id"]
    respx_mock.get(f"{SONARR_URL}/api/v3/release").respond(200, json=[])

    response = client.get(
        f"/api/sonarr/releases?series_id={series_id}", headers=auth_headers
    )
    assert response.status_code == 200

    payload = response.json()
    assert payload["success"] is True
    assert isinstance(payload["data"], list)


# ENDPOINT: GET /api/sonarr/releases/check
def test_check_series_releases(respx_mock, auth_headers):
    """GET /api/sonarr/releases/check - Vérifie la présence de releases pour une série."""
    series_list = load_fixture("sonarr_series.json")
    series_id = series_list[0]["id"]
    respx_mock.get(f"{SONARR_URL}/api/v3/release").respond(200, json=[])

    response = client.get(
        f"/api/sonarr/releases/check?series_id={series_id}", headers=auth_headers
    )
    assert response.status_code == 200

    payload = response.json()
    assert payload["success"] is True
    assert "hasReleases" in payload["data"]


# ENDPOINT: POST /api/sonarr/series/{tvdbId}
def test_add_series_by_tvdb(respx_mock, auth_headers):
    """POST /api/sonarr/series/{tvdbId} - Ajoute une série via son TVDB ID."""
    series_list = load_fixture("sonarr_series.json")
    real_series = series_list[0]
    tvdb_id = real_series["tvdbId"]

    respx_mock.get(f"{SONARR_URL}/api/v3/series/lookup").respond(
        200, json=[real_series]
    )
    respx_mock.post(f"{SONARR_URL}/api/v3/series").respond(201, json=real_series)

    response = client.post(f"/api/sonarr/series/{tvdb_id}", headers=auth_headers)
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True


# ENDPOINT: PUT /api/sonarr/series/{series_id}
def test_update_series(respx_mock, auth_headers):
    """PUT /api/sonarr/series/{series_id} - Met à jour les paramètres d'une série."""
    series_list = load_fixture("sonarr_series.json")
    real_series = series_list[0]
    series_id = real_series["id"]

    respx_mock.get(f"{SONARR_URL}/api/v3/series/{series_id}").respond(
        200, json=real_series
    )
    respx_mock.put(f"{SONARR_URL}/api/v3/series/{series_id}").respond(
        200, json=real_series
    )

    response = client.put(
        f"/api/sonarr/series/{series_id}",
        json={"monitored": True},
        headers=auth_headers,
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True


# ENDPOINT: DELETE /api/sonarr/series/{series_id}
def test_delete_series(respx_mock, auth_headers):
    """DELETE /api/sonarr/series/{series_id} - Supprime une série de Sonarr."""
    series_list = load_fixture("sonarr_series.json")
    series_id = series_list[0]["id"]
    respx_mock.delete(f"{SONARR_URL}/api/v3/series/{series_id}").respond(200)

    response = client.delete(f"/api/sonarr/series/{series_id}", headers=auth_headers)
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
