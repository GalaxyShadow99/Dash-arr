#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Arret de Dasharr..."

# Arret du backend via PID si existant
if [ -f .backend.pid ]; then
  PID=$(cat .backend.pid)
  if kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null || true
  fi
  rm -f .backend.pid
fi

# Arret du frontend via PID si existant
if [ -f .frontend.pid ]; then
  PID=$(cat .frontend.pid)
  if kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null || true
  fi
  rm -f .frontend.pid
fi

# Nettoyage des processus orphelins eventuels sur les ports
fuser -k 8000/tcp >/dev/null 2>&1 || true
fuser -k 5173/tcp >/dev/null 2>&1 || true

echo "Dasharr arrete."