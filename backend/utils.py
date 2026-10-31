import json
import logging

logger = logging.getLogger(__name__)


def format_radarr_error(error_text: str, default_msg: str = "Erreur Radarr") -> str:
    """Extrait un message d'erreur propre et lisible depuis les retours d'erreurs de Radarr.

    Gère:
    1. Les erreurs de validation FluentValidation de Radarr (liste d'objets avec errorMessage).
    2. Les objets d'erreur simples {"message": "..."} ou {"description": "..."}.
    3. Les chaînes brutes en coupant les stacktraces éventuelles.
    """
    if not error_text:
        return default_msg

    try:
        data = json.loads(error_text)

        # Cas 1 : Liste d'erreurs de validation FluentValidation (ex: QualityProfileId, Path, etc.)
        if isinstance(data, list) and len(data) > 0:
            messages = [
                item.get("errorMessage")
                for item in data
                if isinstance(item, dict) and item.get("errorMessage")
            ]
            if messages:
                return "; ".join(messages)

        # Cas 2 : Objet d'erreur standard {"message": "...", "description": "..."}
        if isinstance(data, dict):
            msg = data.get("message") or data.get("description")
            if msg:
                return msg.split("\n")[0]
    except Exception as exc:
        logger.debug("Échec du parsing JSON de l'erreur Radarr: %s", exc)

    # Cas 3 : Texte brut
    return error_text.split("\n")[0][:250]


def format_sonarr_error(error_text: str, default_msg: str = "Erreur Sonarr") -> str:
    """Extrait un message d'erreur propre et lisible depuis les retours d'erreurs de Sonarr v5.

    Gère:
    1. Les listes d'erreurs de validation FluentValidation (errorMessage).
    2. Les dictionnaires d'erreur simples {"message": "..."} ou {"description": "..."}.
    3. Les chaînes brutes en coupant les stacktraces éventuelles.
    """
    if not error_text:
        return default_msg

    try:
        data = json.loads(error_text)

        if isinstance(data, list) and len(data) > 0:
            messages = [
                item.get("errorMessage")
                for item in data
                if isinstance(item, dict) and item.get("errorMessage")
            ]
            if messages:
                return "; ".join(messages)

        if isinstance(data, dict):
            msg = (
                data.get("message")
                or data.get("detail")
                or data.get("title")
                or data.get("description")
            )
            if msg:
                return str(msg).split("\n")[0]
    except Exception as exc:
        logger.debug("Échec du parsing JSON de l'erreur Sonarr: %s", exc)

    stripped = error_text.strip()
    if stripped.startswith(("{", "[")):
        return default_msg
    return stripped.split("\n")[0][:250]


# Alias tolérant pour les imports
format_Sonarr_error = format_sonarr_error
