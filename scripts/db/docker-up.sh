#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-datashare-db-demo}"
IMAGE="${IMAGE:-postgres:16}"
PORT="${PORT:-5432}"

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
env_file="$repo_root/backend/.env"

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
DB_PASSWORD="$(get_env DB_PASSWORD || true)"
DB_NAME="$(get_env DB_NAME || true)"

DB_USER="${DB_USER:-demo}"
DB_PASSWORD="${DB_PASSWORD:-demo}"
DB_NAME="${DB_NAME:-datashare_db_demo}"

command -v docker >/dev/null 2>&1 || { echo "docker introuvable"; exit 1; }

if ! docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  echo "[db] Creating container '$CONTAINER_NAME' ($IMAGE) on port $PORT..."
  docker run --name "$CONTAINER_NAME" \
    -e POSTGRES_USER="$DB_USER" \
    -e POSTGRES_PASSWORD="$DB_PASSWORD" \
    -e POSTGRES_DB="$DB_NAME" \
    -p "${PORT}:5432" \
    -d "$IMAGE" >/dev/null
else
  if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
    echo "[db] Starting existing container '$CONTAINER_NAME'..."
    docker start "$CONTAINER_NAME" >/dev/null
  else
    echo "[db] Container '$CONTAINER_NAME' already running."
  fi
fi

echo "[db] Waiting for PostgreSQL to be ready..."
for _ in $(seq 1 60); do
  if docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    echo "[db] PostgreSQL is ready."
    echo "[db] Next: ./scripts/db/migrate.sh"
    exit 0
  fi
  sleep 1
done

echo "PostgreSQL n'est pas prêt après 60s. Vérifie: docker logs $CONTAINER_NAME" >&2
exit 1
