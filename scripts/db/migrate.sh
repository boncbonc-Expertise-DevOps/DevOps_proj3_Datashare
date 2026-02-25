#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-datashare-db-demo}"

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
env_file="$repo_root/backend/.env"
migration="$repo_root/backend/migrations/001_init.sql"

get_env() {
  local key="$1"
  if [[ -f "$env_file" ]]; then
    # shellcheck disable=SC2002
    cat "$env_file" \
      | grep -E "^${key}=" \
      | tail -n 1 \
      | sed -E "s/^${key}=//" \
      | sed -E "s/^\"(.*)\"$/\1/" \
      | sed -E "s/^'(.*)'$/\1/"
  fi
}

DB_USER="$(get_env DB_USER || true)"
DB_NAME="$(get_env DB_NAME || true)"
DB_USER="${DB_USER:-demo}"
DB_NAME="${DB_NAME:-datashare_db_demo}"

command -v docker >/dev/null 2>&1 || { echo "docker introuvable"; exit 1; }
[[ -f "$migration" ]] || { echo "Migration introuvable: $migration"; exit 1; }

docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME" || {
  echo "Le container '$CONTAINER_NAME' n'est pas démarré. Lance d'abord ./scripts/db/docker-up.sh" >&2
  exit 1
}

echo "[db] Applying migration backend/migrations/001_init.sql..."
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$migration"

echo "[db] Verifying tables exist..."
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -A -c "SELECT to_regclass('public.users') AS users, to_regclass('public.files') AS files;"

echo "[db] Done."
