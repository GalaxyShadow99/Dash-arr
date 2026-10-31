import asyncio
import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException, status

import auth
from config import RADARR_API_KEY, RADARR_URL, SONARR_API_KEY, SONARR_URL
from schemas.response import ApiResponse
from utils import format_radarr_error

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/media",
    tags=["Media"],
    dependencies=[Depends(auth.verify_jwt_token)],  # type: ignore
)


def _radarr_headers() -> dict:
    return {
        "Content-Type": "application/json",
        "accept": "application/json",
        "X-Api-Key": RADARR_API_KEY,
    }


def _sonarr_headers() -> dict:
    return {
        "Content-Type": "application/json",
        "accept": "application/json",
        "X-Api-Key": SONARR_API_KEY,
    }


async def _fetch_movies(client: httpx.AsyncClient) -> list[dict]:
    try:
        res = await client.get(f"{RADARR_URL}/api/v3/movie", headers=_radarr_headers())
        if res.status_code == 200:
            movies = res.json()
            for m in movies:
                m["mediaType"] = "movie"
            return movies
    except Exception as exc:
        logger.warning("Échec de la récupération des films Radarr: %s", exc)
    return []


async def _fetch_series(client: httpx.AsyncClient) -> list[dict]:
    try:
        res = await client.get(f"{SONARR_URL}/api/v3/series", headers=_sonarr_headers())
        if res.status_code == 200:
            series = res.json()
            for s in series:
                s["mediaType"] = "series"
            return series
    except Exception as exc:
        logger.warning("Échec de la récupération des séries Sonarr: %s", exc)
    return []


@router.get("/all", response_model=ApiResponse)
async def get_all_media():
    """Récupère l'ensemble des films et des séries surveillés (Radarr + Sonarr) en parallèle."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        movies_task = _fetch_movies(client)
        series_task = _fetch_series(client)

        movies, series = await asyncio.gather(movies_task, series_task)

        combined = list(movies) + list(series)

        return ApiResponse(
            success=True,
            message=f"{len(combined)} média(s) récupéré(s) au total ({len(movies)} films, {len(series)} séries)",
            data={
                "movies": movies,
                "series": series,
                "all": combined,
            },
        )


@router.get("/indexer-health", response_model=ApiResponse)
async def indexer_health():
    """Vérifie la santé de tous les indexeurs configurés dans Radarr en testant leur connectivité."""
    async with httpx.AsyncClient(timeout=25.0) as client:
        try:
            # Récupère la liste de tous les indexeurs
            indexers_res = await client.get(
                f"{RADARR_URL}/api/v3/indexer", headers=_radarr_headers()
            )
            indexers_res.raise_for_status()
            configured_indexers = indexers_res.json()

            # Teste la connectivité
            test_res = await client.post(
                f"{RADARR_URL}/api/v3/indexer/testall", headers=_radarr_headers()
            )
            test_res.raise_for_status()
            test_results = test_res.json()

            health_summary = []

            for test in test_results:
                indexer_id = test.get("id")
                matched_indexer = None

                # Recherche de l'indexeur correspondant dans la liste configurée
                for idx in configured_indexers:
                    if idx.get("id") == indexer_id:
                        matched_indexer = idx
                        break

                if matched_indexer is not None:
                    indexer_name = matched_indexer.get("name")
                    protocol = matched_indexer.get("protocol")
                    implementation = matched_indexer.get("implementationName")
                    enable_rss = matched_indexer.get("enableRss")
                    enable_search = matched_indexer.get("enableAutomaticSearch")
                else:
                    indexer_name = f"Indexeur #{indexer_id}"
                    protocol = "unknown"
                    implementation = "unknown"
                    enable_rss = False
                    enable_search = False

                item = {
                    "id": indexer_id,
                    "name": indexer_name,
                    "protocol": protocol,
                    "implementation": implementation,
                    "enableRss": enable_rss,
                    "enableAutomaticSearch": enable_search,
                    "isValid": test.get("isValid", False),
                    "validationFailures": test.get("validationFailures", []),
                }
                health_summary.append(item)

            return ApiResponse(
                success=True,
                message=f"Santé de {len(health_summary)} indexeur(s) récupérée avec succès",
                data=health_summary,
            )
        except httpx.HTTPStatusError as exc:
            clean_error = format_radarr_error(
                exc.response.text,
                "Erreur API Radarr lors du test de santé des indexeurs",
            )
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=clean_error,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Impossible de joindre Radarr: {exc!s}",
            )
