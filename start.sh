#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "liste des choix possibles :"
echo "  1: lancer le backend seul"
echo "  2: lancer le frontend seul"
echo "  3: linter le projet"
echo "  4: lancer les tests & builds (local CI)"
read -p "Choisissez une option (1/2/3/4) : " choice
if [[ "$choice" != "1" && "$choice" != "2" && "$choice" != "3" && "$choice" != "4" ]]; then
  echo "Choix invalide."
  exit 1
fi

if [ ! -f .env ]; then
  echo "Erreur : fichier .env introuvable."
  exit 1
fi

# 1. Lancer le backend seul
if [ "$choice" = "1" ]; then
  cd "$SCRIPT_DIR/backend"
  echo "Lancement du backend..."
  exec uv run fastapi dev
fi

# 2. Lancer le frontend seul
if [ "$choice" = "2" ]; then
  cd "$SCRIPT_DIR/frontend"
  echo "Lancement du frontend..."
  exec npm run dev -- --port 5173
fi

# 3. Linter le projet
if [ "$choice" = "3" ]; then
  echo "Lint backend..."
  cd "$SCRIPT_DIR/backend"
  uv run ruff check . --fix
  uv run ruff format .

  echo "Lint frontend..."
  cd "$SCRIPT_DIR/frontend"
  npm run lint -- --fix

  echo "Lint termine."
  exit 0
fi

# 4. Lancer les tests et verifications (CI locale)
if [ "$choice" = "4" ]; then
  echo "=== 1/4 Linter backend (Ruff avec autofix) ==="
  (cd "$SCRIPT_DIR/backend" && uv run ruff check . --fix && uv run ruff format .)

  echo "=== 2/4 Tests backend (Pytest) ==="
  (cd "$SCRIPT_DIR/backend" && uv run pytest -v)

  echo "=== 3/4 Linter frontend (oxlint avec autofix) ==="
  (cd "$SCRIPT_DIR/frontend" && npm run lint -- --fix)

  echo "=== 4/4 Build frontend (Vite) ==="
  (cd "$SCRIPT_DIR/frontend" && npm run build)

  echo "Tous les tests et builds sont valides avec succes."
  exit 0
fi
