from enum import Enum

import requests
from fastapi import HTTPException, status

from config import RADARR_API_KEY, RADARR_URL


class MediaType(str, Enum):
    MOVIE = "movie"
    TV = "tv"
    PERSON = "person"


def _get_radarr_headers() -> dict:
    return {
        "Accept": "application/json",
        "X-Api-Key": RADARR_API_KEY,
    }


def _handle_response(response: requests.Response):
    """Gère proprement les erreurs de l'API Radarr en extrayant un message clair sans stacktrace."""
    if response.status_code in (401, 403):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Échec d'authentification auprès de Radarr : vérifiez RADARR_API_KEY.",
        )

    if not response.ok:
        # Essayer d'extraire le message d'erreur propre renvoyé par Radarr
        try:
            error_data = response.json()
            error_message = error_data.get("message") or error_data.get("description")
        except Exception:
            error_message = None

        # Si Radarr renvoie une MovieNotFoundException (qui est renvoyée en code 500 par leur backend)
        if (
            response.status_code == 404
            or (error_message and "was not found" in error_message)
            or (error_message and "MovieNotFoundException" in error_message)
        ):
            clean_msg = (
                error_message.split("\n")[0]
                if error_message
                else "Film ou média introuvable sur TMDB."
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=clean_msg,
            )

        # Message propre pour les autres erreurs (sans la stacktrace C# géante)
        clean_detail = (
            error_message.split("\n")[0] if error_message else response.text[:200]
        )
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Erreur Radarr: {clean_detail}",
        )

    return response.json()


def get_tmdb_movie_details(tmdb_id: int):
    """Lookup d'un film par son ID TMDB via Radarr."""
    url = f"{RADARR_URL}/api/v3/movie/lookup/tmdb?tmdbId={tmdb_id}"
    try:
        response = requests.get(url, headers=_get_radarr_headers(), timeout=10.0)
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Impossible de joindre Radarr: {exc!s}",
        )
    return _handle_response(response)


def search_tmdb(query: str):
    """Recherche de film par titre via Radarr lookup."""
    url = f"{RADARR_URL}/api/v3/movie/lookup?term={query}"
    try:
        response = requests.get(url, headers=_get_radarr_headers(), timeout=10.0)
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Impossible de joindre Radarr: {exc!s}",
        )
    return _handle_response(response)
