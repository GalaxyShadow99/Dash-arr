import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from auth import create_access_token
from config import RADARR_URL
from main import app

client = TestClient(app)
FIXTURES_DIR = Path(__file__).parent / "fixtures"


def load_fixture(filename: str):
    return json.loads((FIXTURES_DIR / filename).read_text())


@pytest.fixture
def auth_headers():
    token = create_access_token({"sub": "admin@example.com"})
    return {"Authorization": f"Bearer {token}"}


# ENDPOINT: GET /api/radarr/movies
def test_get_movies(respx_mock, auth_headers):
    """GET /api/radarr/movies - Liste tous les films surveillés."""
    movies_data = load_fixture("radarr_movies.json")
    respx_mock.get(f"{RADARR_URL}/api/v3/movie").respond(200, json=movies_data)

    response = client.get("/api/radarr/movies", headers=auth_headers)
    assert response.status_code == 200

    payload = response.json()
    assert payload["success"] is True
    assert len(payload["data"]) == len(movies_data)
    assert payload["data"][0]["title"] == movies_data[0]["title"]


# ENDPOINT: GET /api/radarr/movie/{movie_id}
def test_get_movie_details(respx_mock, auth_headers):
    """GET /api/radarr/movie/{movie_id} - Récupère les détails d'un film."""
    movie_data = load_fixture("radarr_movie_detail.json")
    movie_id = movie_data["id"]
    respx_mock.get(f"{RADARR_URL}/api/v3/movie/{movie_id}").respond(
        200, json=movie_data
    )

    response = client.get(f"/api/radarr/movie/{movie_id}", headers=auth_headers)
    assert response.status_code == 200

    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["id"] == movie_id
    assert payload["data"]["title"] == movie_data["title"]


# ENDPOINT: GET /api/radarr/lookup
def test_lookup_movies(respx_mock, auth_headers):
    """GET /api/radarr/lookup - Recherche un film par titre ou terme."""
    lookup_data = load_fixture("radarr_lookup.json")
    respx_mock.get(f"{RADARR_URL}/api/v3/movie/lookup").respond(200, json=lookup_data)

    response = client.get("/api/radarr/lookup?query=Fight%20Club", headers=auth_headers)
    assert response.status_code == 200

    payload = response.json()
    assert payload["success"] is True
    assert len(payload["data"]) > 0


# ENDPOINT: GET /api/radarr/releases
def test_get_movie_releases(respx_mock, auth_headers):
    """GET /api/radarr/releases - Liste les releases disponibles pour un film."""
    movie_data = load_fixture("radarr_movie_detail.json")
    movie_id = movie_data["id"]
    releases_data = load_fixture("radarr_releases.json")
    respx_mock.get(f"{RADARR_URL}/api/v3/release").respond(200, json=releases_data)

    response = client.get(
        f"/api/radarr/releases?movie_id={movie_id}", headers=auth_headers
    )
    assert response.status_code == 200

    payload = response.json()
    assert payload["success"] is True
    assert isinstance(payload["data"], list)


# ENDPOINT: GET /api/radarr/releases/check
def test_check_movie_releases(respx_mock, auth_headers):
    """GET /api/radarr/releases/check - Vérifie si des releases existent sur les trackers."""
    movie_data = load_fixture("radarr_movie_detail.json")
    movie_id = movie_data["id"]
    releases_data = load_fixture("radarr_releases.json")
    respx_mock.get(f"{RADARR_URL}/api/v3/release").respond(200, json=releases_data)

    response = client.get(
        f"/api/radarr/releases/check?movie_id={movie_id}", headers=auth_headers
    )
    assert response.status_code == 200

    payload = response.json()
    assert payload["success"] is True
    assert "hasReleases" in payload["data"]
    assert "trackers" in payload["data"]


# ENDPOINT: POST /api/radarr/movie/{tmdb_id}
def test_add_movie_by_tmdb(respx_mock, auth_headers):
    """POST /api/radarr/movie/{tmdb_id} - Ajoute un film dans Radarr via TMDB."""
    movie_data = load_fixture("radarr_movie_detail.json")
    tmdb_id = movie_data.get("tmdbId", 550)

    # Simule lookup TMDB puis création dans Radarr
    respx_mock.get(f"{RADARR_URL}/api/v3/movie/lookup/tmdb").respond(
        200, json=movie_data
    )
    respx_mock.post(f"{RADARR_URL}/api/v3/movie").respond(201, json=movie_data)

    response = client.post(f"/api/radarr/movie/{tmdb_id}", headers=auth_headers)
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True


# ENDPOINT: PUT /api/radarr/movie/{movie_id}
def test_update_movie(respx_mock, auth_headers):
    """PUT /api/radarr/movie/{movie_id} - Met à jour le suivi ou le statut d'un film."""
    movie_data = load_fixture("radarr_movie_detail.json")
    movie_id = movie_data["id"]

    respx_mock.get(f"{RADARR_URL}/api/v3/movie/{movie_id}").respond(
        200, json=movie_data
    )
    respx_mock.put(f"{RADARR_URL}/api/v3/movie/{movie_id}").respond(
        200, json=movie_data
    )

    response = client.put(
        f"/api/radarr/movie/{movie_id}",
        json={"monitored": True},
        headers=auth_headers,
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True


# ENDPOINT: DELETE /api/radarr/movie/{movie_id}
def test_delete_movie(respx_mock, auth_headers):
    """DELETE /api/radarr/movie/{movie_id} - Supprime un film de Radarr."""
    movie_data = load_fixture("radarr_movie_detail.json")
    movie_id = movie_data["id"]
    respx_mock.delete(f"{RADARR_URL}/api/v3/movie/{movie_id}").respond(200)

    response = client.delete(f"/api/radarr/movie/{movie_id}", headers=auth_headers)
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
