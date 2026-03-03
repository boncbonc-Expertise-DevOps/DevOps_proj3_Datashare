#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${ENV_FILE:-.env.demo.example}"
PROJECT_NAME="${PROJECT_NAME:-datashare_db_demo}"

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
env_path="$repo_root/$ENV_FILE"

command -v docker >/dev/null 2>&1 || { echo "docker introuvable" >&2; exit 1; }
[[ -f "$env_path" ]] || { echo "Fichier d'env introuvable: $env_path" >&2; exit 1; }

echo "[demo] Starting db + backend with docker compose (env: $ENV_FILE)..."
(
  cd "$repo_root"
  docker compose -p "$PROJECT_NAME" --env-file "$env_path" up -d --build
)

echo "[demo] Stack started. Useful URLs:"
echo "[demo] - Backend health: http://localhost:3000/health"
echo "[demo] - Swagger:       http://localhost:3000/api-docs"
echo "[demo] Next: run ./scripts/demo/migrate.sh"
