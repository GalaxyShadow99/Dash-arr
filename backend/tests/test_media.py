import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from auth import create_access_token
from config import RADARR_URL, SONARR_URL
from main import app

client = TestClient(app)
FIXTURES_DIR = Path(__file__).parent / "fixtures"


def load_fixture(filename: str):
    return json.loads((FIXTURES_DIR / filename).read_text())


@pytest.fixture
def auth_headers():
    token = create_access_token({"sub": "admin@example.com"})
    return {"Authorization": f"Bearer {token}"}


# ENDPOINT: GET /api/media/all
def test_get_all_media(respx_mock, auth_headers):
    """GET /api/media/all - Récupère l'ensemble des films et séries surveillés."""
    movies_data = load_fixture("radarr_movies.json")
    series_data = load_fixture("sonarr_series.json")

    respx_mock.get(f"{RADARR_URL}/api/v3/movie").respond(200, json=movies_data)
    respx_mock.get(f"{SONARR_URL}/api/v3/series").respond(200, json=series_data)

    response = client.get("/api/media/all", headers=auth_headers)
    assert response.status_code == 200

    payload = response.json()
    assert payload["success"] is True

    data = payload["data"]
    assert "movies" in data
    assert "series" in data
    assert "all" in data
    assert len(data["movies"]) == len(movies_data)
    assert len(data["series"]) == len(series_data)
    assert len(data["all"]) == len(movies_data) + len(series_data)


# ENDPOINT: GET /api/media/indexer-health
def test_get_indexer_health(respx_mock, auth_headers):
    """GET /api/media/indexer-health - Vérifie l'état de santé des indexeurs configurés."""
    indexers_sample = [
        {"id": 1, "name": "C411", "enableRss": True, "enableSearch": True}
    ]
    respx_mock.get(f"{RADARR_URL}/api/v3/indexer").respond(200, json=indexers_sample)
    respx_mock.post(f"{RADARR_URL}/api/v3/indexer/testall").respond(200, json=[])

    response = client.get("/api/media/indexer-health", headers=auth_headers)
    assert response.status_code == 200

    payload = response.json()
    assert payload["success"] is True
    assert isinstance(payload["data"], list)
