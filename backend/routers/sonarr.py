import logging
import re

import httpx
from fastapi import APIRouter, Depends, HTTPException, status

logger = logging.getLogger(__name__)

import auth
from config import SONARR_API_KEY, SONARR_URL
from schemas.response import ApiResponse
from utils import format_sonarr_error

router = APIRouter(
    prefix="/api/sonarr",
    tags=["Sonarr"],
    dependencies=[Depends(auth.verify_jwt_token)],  # type: ignore
)

# Profil et dossier par défaut pour les séries
DEFAULT_QUALITY_PROFILE_ID = 4  # "HD-1080p"
DEFAULT_ROOT_FOLDER = "/tv"


def _get_headers() -> dict:
    return {
        "Content-Type": "application/json",
        "accept": "application/json",
        "X-Api-Key": SONARR_API_KEY,
        "Acess-Control-Allow-Origin": "*",
    }


def _sanitize_folder_name(title: str, year: int | None = None) -> str:
    """Nettoie le titre pour générer un nom de dossier valide (ex: /tv/Titre (Annee))."""
    safe_title = re.sub(r'[\\/*?:"<>|]', "", title).strip()
    if year:
        return f"{safe_title} ({year})"
    return safe_title


# --- READ ALL (Liste de toutes les séries surveillées) ---
@router.get("/series", response_model=ApiResponse)
async def get_series():
    """Liste toutes les séries surveillées par Sonarr v3."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(
                f"{SONARR_URL}/api/v3/series", headers=_get_headers()
            )
            response.raise_for_status()
            return ApiResponse(
                success=True,
                message="Séries récupérées avec succès",
                data=response.json(),
            )
        except httpx.HTTPStatusError as exc:
            clean_error = format_sonarr_error(exc.response.text, "Erreur API Sonarr")
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=clean_error,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Impossible de joindre Sonarr: {exc!s}",
            )


# --- READ ONE (Détails d'une série par son ID Sonarr) ---
@router.get("/series/{series_id}", response_model=ApiResponse)
async def get_single_series(series_id: int):
    """Récupère les détails d'une série existante par son ID Sonarr."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(
                f"{SONARR_URL}/api/v3/series/{series_id}", headers=_get_headers()
            )
            response.raise_for_status()
            return ApiResponse(
                success=True,
                message="Série récupérée avec succès",
                data=response.json(),
            )
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Série introuvable sur Sonarr.",
                )
            clean_error = format_sonarr_error(exc.response.text, "Erreur API Sonarr")
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=clean_error,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Impossible de joindre Sonarr: {exc!s}",
            )


# --- SEARCH / LOOKUP (Recherche via Sonarr /api/v3/series/lookup) ---
@router.get("/lookup", response_model=ApiResponse)
async def lookup_series(term: str, limit: int = 25):
    """Recherche une série via Sonarr v3 (TVDB/TheTVDB)."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(
                f"{SONARR_URL}/api/v3/series/lookup",
                headers=_get_headers(),
                params={"term": term},
            )
            response.raise_for_status()
            raw_results = response.json()

            results = []
            for count, item in enumerate(raw_results):
                if count >= limit:
                    break
                results.append(item)

            return ApiResponse(
                success=True,
                message=f"{len(results)} série(s) trouvée(s)",
                data=results,
            )
        except httpx.HTTPStatusError as exc:
            clean_error = format_sonarr_error(
                exc.response.text, "Erreur lors de la recherche Sonarr"
            )
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=clean_error,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Impossible de joindre Sonarr: {exc}",
            )


async def get_serie_details_by_tvdbID(tvdb_id: int):
    """Recherche une série via Sonarr v3 par son TVDB ID."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(
                f"{SONARR_URL}/api/v3/series/lookup",
                headers=_get_headers(),
                params={"term": f"tvdb:{tvdb_id}"},
            )
            response.raise_for_status()
            results = response.json()
            if results:
                return results[0]
            return None
        except httpx.HTTPStatusError as exc:
            clean_error = format_sonarr_error(
                exc.response.text, "Erreur lors de la recherche Sonarr"
            )
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=clean_error,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Impossible de joindre Sonarr: {exc!s}",
            )


# --- CREATE (Ajouter une série soit par son TVDB ID, soit par payload complet) ---
@router.post("/series/{tvdbId}", response_model=ApiResponse)
async def add_series(tvdbId: int):
    """Ajoute une série à Sonarr v3 à partir d'un payload ou d'un résultat lookup."""
    tvdb_id = int(tvdbId)

    if tvdb_id:
        serie_details = await get_serie_details_by_tvdbID(tvdb_id)
        if not serie_details:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Série avec TVDB ID {tvdb_id} introuvable via Sonarr lookup.",
            )
        series_payload = serie_details

    # Injection des valeurs par défaut pour Sonarr v3
    if not series_payload.get("qualityProfileId"):
        series_payload["qualityProfileId"] = DEFAULT_QUALITY_PROFILE_ID

    root_folder = series_payload.get("rootFolderPath") or DEFAULT_ROOT_FOLDER
    series_payload["rootFolderPath"] = root_folder

    title = series_payload.get("title", f"Series_{tvdb_id or 'unknown'}")
    year = series_payload.get("year")
    folder_name = _sanitize_folder_name(title, year)

    if not series_payload.get("path"):
        series_payload["path"] = f"{root_folder}/{folder_name}"

    series_payload["monitored"] = series_payload.get("monitored", True)
    series_payload["seasonFolder"] = series_payload.get("seasonFolder", True)

    series_payload.setdefault(
        "addOptions",
        {
            "monitor": "all",
            "searchForMissingEpisodes": True,
            "searchForCutoffUnmetEpisodes": False,
        },
    )

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.post(
                f"{SONARR_URL}/api/v3/series",
                headers=_get_headers(),
                json=series_payload,
            )
            response.raise_for_status()
            return ApiResponse(
                success=True,
                message="Série ajoutée avec succès",
                data=response.json(),
            )
        except httpx.HTTPStatusError as exc:
            clean_error = format_sonarr_error(
                exc.response.text, "Erreur API Sonarr lors de l'ajout"
            )
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=clean_error,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Impossible de joindre Sonarr: {exc!s}",
            )


# --- UPDATE (Mettre à jour une série existante) ---
@router.put("/series/{series_id}", response_model=ApiResponse)
async def update_series(series_id: int, payload: dict | None = None):
    """Met à jour une série sur Sonarr v3."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        # 1. Récupération de la série existante
        try:
            current_res = await client.get(
                f"{SONARR_URL}/api/v3/series/{series_id}", headers=_get_headers()
            )
            current_res.raise_for_status()
            existing_series = current_res.json()
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Série introuvable sur Sonarr.",
                )
            clean_error = format_sonarr_error(
                exc.response.text, "Série introuvable sur Sonarr"
            )
            raise HTTPException(
                status_code=exc.response.status_code, detail=clean_error
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Impossible de joindre Sonarr: {exc!s}",
            )

        # 2. Fusion
        if not payload:
            tvdb_id = existing_series.get("tvdbId")
            if tvdb_id:
                details = await get_serie_details_by_tvdbID(tvdb_id)
                if details:
                    existing_series.update(details)
        else:
            existing_series.update(payload)

        if (
            not existing_series.get("qualityProfileId")
            or existing_series.get("qualityProfileId") <= 0
        ):
            existing_series["qualityProfileId"] = DEFAULT_QUALITY_PROFILE_ID

        try:
            response = await client.put(
                f"{SONARR_URL}/api/v3/series/{series_id}",
                headers=_get_headers(),
                json=existing_series,
            )
            response.raise_for_status()
            return ApiResponse(
                success=True,
                message="Série mise à jour avec succès",
                data=response.json(),
            )
        except httpx.HTTPStatusError as exc:
            clean_error = format_sonarr_error(
                exc.response.text, "Erreur API Sonarr lors de la mise à jour"
            )
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=clean_error,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Impossible de joindre Sonarr: {exc!s}",
            )


# --- DELETE (Supprimer une série) ---
@router.delete("/series/{series_id}", response_model=ApiResponse)
async def delete_series(series_id: int, delete_files: bool = False):
    """Supprime une série de Sonarr v3 (avec ou sans les fichiers sur le disque)."""
    params = {"deleteFiles": str(delete_files).lower()}
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.delete(
                f"{SONARR_URL}/api/v3/series/{series_id}",
                headers=_get_headers(),
                params=params,
            )
            response.raise_for_status()
            return ApiResponse(
                success=True,
                message="Série supprimée avec succès",
                data=None,
            )
        except httpx.HTTPStatusError as exc:
            clean_error = format_sonarr_error(
                exc.response.text, "Erreur API Sonarr lors de la suppression"
            )
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=clean_error,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Impossible de joindre Sonarr: {exc!s}",
            )


# --- RELEASES / TRACKERS CHECK ---
@router.get("/releases/check", response_model=ApiResponse)
async def check_series_releases(
    series_id: int | None = None,
    tvdb_id: int | None = None,
    season_number: int | None = None,
):
    """Vérifie la disponibilité des releases pour une série sur Sonarr v3."""
    if series_id is None and tvdb_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Veuillez fournir soit series_id (série dans Sonarr) soit tvdb_id.",
        )

    target_series_id = series_id

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Si on n'a que tvdb_id, vérifier si la série est déjà présente dans Sonarr
        if target_series_id is None and tvdb_id is not None:
            try:
                series_res = await client.get(
                    f"{SONARR_URL}/api/v3/series",
                    headers=_get_headers(),
                    params={"tvdbId": tvdb_id},
                )
                if series_res.status_code == 200:
                    matching = series_res.json()
                    if matching and len(matching) > 0:
                        target_series_id = matching[0].get("id")
            except Exception:
                target_series_id = None

        if target_series_id is None:
            return ApiResponse(
                success=True,
                message="Série non ajoutée dans Sonarr, recherche release restreinte",
                data={
                    "hasReleases": False,
                    "totalReleases": 0,
                    "activeReleasesCount": 0,
                    "trackers": [],
                    "seriesId": None,
                    "tvdbId": tvdb_id,
                },
            )

        params = {"seriesId": target_series_id}
        if season_number is not None:
            params["seasonNumber"] = season_number

        try:
            response = await client.get(
                f"{SONARR_URL}/api/v3/release",
                headers=_get_headers(),
                params=params,
            )
            response.raise_for_status()
            releases_data = response.json()
        except httpx.HTTPStatusError as exc:
            clean_error = format_sonarr_error(
                exc.response.text, "Erreur lors de la vérification des releases Sonarr"
            )
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=clean_error,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Impossible de joindre Sonarr: {exc!s}",
            )

        total_found = len(releases_data)
        active_releases = []
        trackers_set = set()

        for rel in releases_data:
            rejections = rel.get("rejections", [])
            is_unknown = False
            for rej in rejections:
                if "Unable to match" in str(rej) or "Unknown Series" in str(rej):
                    is_unknown = True
                    break

            if is_unknown:
                continue

            indexer_name = rel.get("indexer", "Inconnu")
            trackers_set.add(indexer_name)

            seeders = rel.get("seeders", 0)
            if seeders > 0:
                active_releases.append(rel)

        has_available = len(active_releases) > 0 or len(releases_data) > 0

        data = {
            "hasReleases": has_available,
            "totalReleases": total_found,
            "activeReleasesCount": len(active_releases),
            "trackers": list(trackers_set),
            "seriesId": target_series_id,
            "tvdbId": tvdb_id,
        }

        return ApiResponse(
            success=True,
            message="Vérification des releases Sonarr effectuée",
            data=data,
        )


@router.get("/releases", response_model=ApiResponse)
async def get_series_releases(series_id: int, season_number: int | None = None):
    """Retourne la liste complète et précise des releases disponibles pour une série donnée."""
    if not series_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le paramètre series_id est obligatoire.",
        )

    params = {"seriesId": series_id}
    if season_number is not None:
        params["seasonNumber"] = season_number
    releases = []

    async with httpx.AsyncClient(timeout=45.0) as client:
        try:
            response = await client.get(
                f"{SONARR_URL}/api/v3/release",
                headers=_get_headers(),
                params=params,
            )
            response.raise_for_status()
            releases = response.json()
        except httpx.HTTPStatusError as exc:
            clean_error = format_sonarr_error(
                exc.response.text, "Erreur lors de la récupération des releases Sonarr"
            )
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=clean_error,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Impossible de joindre Sonarr: {exc!s}",
            )

    return ApiResponse(
        success=True,
        message=f"{len(releases)} release(s) trouvée(s)",
        data=releases,
    )
