import re

import httpx
from fastapi import APIRouter, Depends, HTTPException, status

import auth
from config import RADARR_API_KEY, RADARR_URL
from schemas.response import ApiResponse
from tmdb import get_tmdb_movie_details, search_tmdb
from utils import format_radarr_error

router = APIRouter(
    prefix="/api/radarr",
    tags=["Radarr"],
    dependencies=[Depends(auth.verify_jwt_token)],  # type: ignore
)

# Profil de qualité forcé par défaut : ID 4 = "HD-1080p"
DEFAULT_QUALITY_PROFILE_ID = 4
DEFAULT_ROOT_FOLDER = "/movies"


def _get_headers() -> dict:
    return {
        "Content-Type": "application/json",
        "accept": "application/json",
        "X-Api-Key": RADARR_API_KEY,
    }


def _sanitize_folder_name(title: str, year: int | None = None) -> str:
    """Nettoie le titre pour générer un nom de dossier valide (ex: /movies/Titre (Annee))."""
    safe_title = re.sub(r'[\\/*?:"<>|]', "", title).strip()
    if year:
        return f"{safe_title} ({year})"
    return safe_title


# --- READ ALL (Liste des films) ---
@router.get("/movies", response_model=ApiResponse)
async def get_movies():
    """Liste tous les films surveillés par Radarr."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(
                f"{RADARR_URL}/api/v3/movie", headers=_get_headers()
            )
            response.raise_for_status()
            return ApiResponse(
                success=True,
                message="Films récupérés avec succès",
                data=response.json(),
            )
        except httpx.HTTPStatusError as exc:
            clean_error = format_radarr_error(exc.response.text, "Erreur API Radarr")
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=clean_error,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Impossible de joindre Radarr: {exc!s}",
            )


# --- READ ONE (Détails d'un film) ---
@router.get("/movie/{movie_id}", response_model=ApiResponse)
async def get_movie(movie_id: int):
    """Récupère les détails d'un film existant par son ID Radarr."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(
                f"{RADARR_URL}/api/v3/movie/{movie_id}", headers=_get_headers()
            )
            response.raise_for_status()
            return ApiResponse(
                success=True,
                message="Film récupéré avec succès",
                data=response.json(),
            )
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Film introuvable sur Radarr.",
                )
            clean_error = format_radarr_error(exc.response.text, "Erreur API Radarr")
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=clean_error,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Impossible de joindre Radarr: {exc!s}",
            )


# --- CREATE (Ajouter un film via son ID TMDB) ---
@router.post("/movie/{tmdb_id}", response_model=ApiResponse)
async def add_movie(tmdb_id: int):
    """Ajoute un film à Radarr à partir de son TMDB ID sans paramètre supplémentaire requis."""
    movie_payload = get_tmdb_movie_details(tmdb_id)
    if not movie_payload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Film introuvable sur TMDB.",
        )

    # Injection automatique des valeurs par défaut requises par Radarr
    if (
        not movie_payload.get("qualityProfileId")
        or movie_payload.get("qualityProfileId") <= 0
    ):
        movie_payload["qualityProfileId"] = DEFAULT_QUALITY_PROFILE_ID

    root_folder = DEFAULT_ROOT_FOLDER
    movie_payload["rootFolderPath"] = root_folder
    folder_name = _sanitize_folder_name(
        movie_payload.get("title", f"Movie_{tmdb_id}"), movie_payload.get("year")
    )
    movie_payload["path"] = f"{root_folder}/{folder_name}"

    movie_payload["monitored"] = True
    movie_payload.setdefault(
        "addOptions",
        {
            "searchForMovie": True,
            "monitor": "movieOnly",
        },
    )

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(
                f"{RADARR_URL}/api/v3/movie", headers=_get_headers(), json=movie_payload
            )
            response.raise_for_status()
            return ApiResponse(
                success=True,
                message="Film ajouté avec succès",
                data=response.json(),
            )
        except httpx.HTTPStatusError as exc:
            clean_error = format_radarr_error(
                exc.response.text, "Erreur API Radarr lors de l'ajout"
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


# --- UPDATE (Mettre à jour un film existant : recharge l'existant, fusionne et renvoie à Radarr) ---
@router.put("/movie/{movie_id}", response_model=ApiResponse)
async def update_movie(movie_id: int, payload: dict | None = None):
    """Met à jour un film sur Radarr. Conserve systématiquement l'ancien Path et les réglages existants."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. On récupère TOUJOURS le film existant complet depuis Radarr
        try:
            current_res = await client.get(
                f"{RADARR_URL}/api/v3/movie/{movie_id}", headers=_get_headers()
            )
            current_res.raise_for_status()
            existing_movie = current_res.json()
        except httpx.HTTPStatusError as exc:
            clean_error = format_radarr_error(
                exc.response.text, "Film introuvable sur Radarr"
            )
            raise HTTPException(
                status_code=exc.response.status_code, detail=clean_error
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Impossible de joindre Radarr: {exc!s}",
            )

        if not payload:
            tmdb_id = existing_movie.get("tmdbId")
            if not tmdb_id:
                raise HTTPException(
                    status_code=400,
                    detail="Ce film ne possède pas de TMDB ID associé.",
                )

            tmdb_details = get_tmdb_movie_details(tmdb_id)
            existing_movie.update(
                {
                    "title": tmdb_details.get("title", existing_movie.get("title")),
                    "overview": tmdb_details.get(
                        "overview", existing_movie.get("overview")
                    ),
                    "images": tmdb_details.get("images", existing_movie.get("images")),
                    "year": tmdb_details.get("year", existing_movie.get("year")),
                    "genres": tmdb_details.get("genres", existing_movie.get("genres")),
                }
            )
            final_payload = existing_movie
        else:
            existing_movie.update(payload)
            final_payload = existing_movie

        if (
            not final_payload.get("qualityProfileId")
            or final_payload.get("qualityProfileId") <= 0
        ):
            final_payload["qualityProfileId"] = DEFAULT_QUALITY_PROFILE_ID

        if not final_payload.get("path"):
            root = final_payload.get("rootFolderPath") or DEFAULT_ROOT_FOLDER
            folder = _sanitize_folder_name(
                final_payload.get("title", f"Movie_{movie_id}"),
                final_payload.get("year"),
            )
            final_payload["path"] = f"{root}/{folder}"

        try:
            response = await client.put(
                f"{RADARR_URL}/api/v3/movie/{movie_id}",
                headers=_get_headers(),
                json=final_payload,
            )
            response.raise_for_status()
            return ApiResponse(
                success=True,
                message="Film mis à jour avec succès",
                data=response.json(),
            )
        except httpx.HTTPStatusError as exc:
            clean_error = format_radarr_error(
                exc.response.text, "Erreur API Radarr lors de la mise à jour"
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


# --- DELETE (Supprimer un film) ---
@router.delete("/movie/{movie_id}", response_model=ApiResponse)
async def delete_movie(movie_id: int, delete_files: bool = False):
    """Supprime un film de Radarr (avec ou sans les fichiers sur le disque)."""
    params = {"deleteFiles": str(delete_files).lower()}
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.delete(
                f"{RADARR_URL}/api/v3/movie/{movie_id}",
                headers=_get_headers(),
                params=params,
            )
            response.raise_for_status()
            return ApiResponse(
                success=True,
                message="Film supprimé avec succès",
                data=None,
            )
        except httpx.HTTPStatusError as exc:
            clean_error = format_radarr_error(
                exc.response.text, "Erreur API Radarr lors de la suppression"
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


# --- SEARCH / LOOKUP ---
@router.get("/lookup", response_model=ApiResponse)
async def lookup_movie(query: str, limit: int = 10):
    """Recherche un film par mot-clé pour trouver son TMDB ID (limité à 10 par défaut)."""
    raw_results = search_tmdb(query)

    # Limiter les résultats simplement
    results = []
    for count, movie in enumerate(raw_results):
        if count >= limit:
            break
        results.append(movie)

    return ApiResponse(
        success=True,
        message=f"{len(results)} résultat(s) trouvé(s)",
        data=results,
    )


# --- RELEASES / TRACKERS CHECK ---
@router.get("/releases/check", response_model=ApiResponse)
async def check_movie_releases(movie_id: int | None = None, tmdb_id: int | None = None):
    """Vérifie la disponibilité réelle d'un film sur vos trackers Torznab / Radarr."""
    if movie_id is None and tmdb_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Veuillez fournir soit movie_id (film dans Radarr) soit tmdb_id (nouveau film).",
        )

    # Si on a seulement tmdb_id, on vérifie si le film existe déjà dans Radarr
    target_movie_id = movie_id

    async with httpx.AsyncClient(timeout=30.0) as client:
        if target_movie_id is None and tmdb_id is not None:
            try:
                movies_res = await client.get(
                    f"{RADARR_URL}/api/v3/movie", headers=_get_headers()
                )
                if movies_res.status_code == 200:
                    for m in movies_res.json():
                        if m.get("tmdbId") == tmdb_id:
                            target_movie_id = m.get("id")
                            break
            except Exception:
                target_movie_id = None

        # Si le film existe dans Radarr, interroger par movieId
        if target_movie_id is not None:
            url = f"{RADARR_URL}/api/v3/release?movieId={target_movie_id}"
        else:
            url = f"{RADARR_URL}/api/v3/release?movieMetadataId={tmdb_id}"

        try:
            response = await client.get(url, headers=_get_headers())
            response.raise_for_status()
            releases_data = response.json()
        except httpx.HTTPStatusError as exc:
            clean_error = format_radarr_error(
                exc.response.text, "Erreur lors de la vérification des releases"
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

        # Filtrer et compter les releases pertinentes avec des boucles simples
        total_found = len(releases_data)
        active_releases = []
        trackers_set = set()

        for rel in releases_data:
            # Vérifier si ce n'est pas un résultat non concordant
            rejections = rel.get("rejections", [])
            is_unknown = False
            for rej in rejections:
                if "Unable to match" in str(rej) or "Unknown Movie" in str(rej):
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

        # Si le film n'était pas dans la biblio et a renvoyé des rejets 'Unknown Movie',
        # on s'assure qu'on a bien des releases actives valides
        if target_movie_id is None and len(active_releases) == 0:
            has_available = False

        data = {
            "hasReleases": has_available,
            "totalReleases": total_found,
            "activeReleasesCount": len(active_releases),
            "trackers": list(trackers_set),
            "movieId": target_movie_id,
            "tmdbId": tmdb_id,
        }

        return ApiResponse(
            success=True,
            message="Vérification des releases effectuée",
            data=data,
        )


@router.get("/releases", response_model=ApiResponse)
async def get_movie_releases(movie_id: int):
    """Retourne la liste complète et précise des releases disponibles pour un film donné."""
    if not movie_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le paramètre movie_id est obligatoire.",
        )

    async with httpx.AsyncClient(timeout=45.0) as client:
        try:
            response = await client.get(
                f"{RADARR_URL}/api/v3/release?movieId={movie_id}",
                headers=_get_headers(),
            )
            response.raise_for_status()
            releases = response.json()
        except httpx.HTTPStatusError as exc:
            clean_error = format_radarr_error(
                exc.response.text, "Erreur lors de la récupération des releases Radarr"
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

    return ApiResponse(
        success=True,
        message=f"{len(releases)} release(s) trouvée(s)",
        data=releases,
    )
