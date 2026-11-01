import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# Charge le .env situé à la racine du projet
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

REQUIRED_ENV_VARS = [
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "JWT_SECRET",
    "JWT_ALGORITHM",
    "JWT_EXPIRATION_MINUTES",
    "RADARR_URL",
    "RADARR_API_KEY",
    "SONARR_URL",
    "SONARR_API_KEY",
]

missing_vars = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]

if missing_vars:
    sys.exit(
        f"[FATAL ERROR] Variables d'environnement obligatoires manquantes dans le .env : "
        f"{', '.join(missing_vars)}. Arrêt immédiat de l'application."
    )

ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.environ["JWT_ALGORITHM"]
JWT_EXPIRATION_MINUTES = os.environ["JWT_EXPIRATION_MINUTES"]

RADARR_URL = os.environ["RADARR_URL"].rstrip("/")
RADARR_API_KEY = os.environ["RADARR_API_KEY"]

SONARR_URL = os.environ["SONARR_URL"].rstrip("/")
SONARR_API_KEY = os.environ["SONARR_API_KEY"]
