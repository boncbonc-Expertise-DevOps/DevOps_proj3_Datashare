#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${ENV_FILE:-.env.demo.example}"
PROJECT_NAME="${PROJECT_NAME:-datashare_db_demo}"

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
env_path="$repo_root/$ENV_FILE"
migration="$repo_root/backend/migrations/001_init.sql"

get_env() {
  local key="$1"
  if [[ -f "$env_path" ]]; then
    grep -E "^${key}=" "$env_path" \
      | tail -n 1 \
      | sed -E "s/^${key}=//" \
      | sed -E 's/^"(.*)"$/\1/' \
      | sed -E "s/^'(.*)'$/\1/"
  fi
}

DB_USER="$(get_env DB_USER || true)"
DB_NAME="$(get_env DB_NAME || true)"
DB_USER="${DB_USER:-demo}"
DB_NAME="${DB_NAME:-datashare_db_demo}"

command -v docker >/dev/null 2>&1 || { echo "docker introuvable" >&2; exit 1; }
[[ -f "$env_path" ]] || { echo "Fichier d'env introuvable: $env_path" >&2; exit 1; }
[[ -f "$migration" ]] || { echo "Migration introuvable: $migration" >&2; exit 1; }

echo "[demo] Checking compose service 'db' is running..."
(
  cd "$repo_root"
  if ! docker compose -p "$PROJECT_NAME" ps --status running --services | grep -qx "db"; then
    echo "Le service 'db' n'est pas en cours. Lance d'abord ./scripts/demo/docker-up.sh" >&2
    exit 1
  fi

  echo "[demo] Applying migration backend/migrations/001_init.sql (compose service: db)..."
  docker compose -p "$PROJECT_NAME" --env-file "$env_path" exec -T db psql -U "$DB_USER" -d "$DB_NAME" < "$migration"

  echo "[demo] Verifying tables exist..."
  docker compose -p "$PROJECT_NAME" --env-file "$env_path" exec -T db psql -U "$DB_USER" -d "$DB_NAME" -t -A -c "SELECT to_regclass('public.users') AS users, to_regclass('public.files') AS files;"

  echo "[demo] Done."
)
