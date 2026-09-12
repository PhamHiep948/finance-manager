#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

docker compose up -d postgres

echo "Waiting for PostgreSQL healthcheck..."
for _ in $(seq 1 40); do
  status="$(docker compose ps --format json postgres 2>/dev/null | head -n 1 || true)"
  if docker compose exec -T postgres pg_isready -U postgres -d handmade_finance >/dev/null 2>&1; then
    echo "PostgreSQL is ready."
    docker compose ps postgres
    exit 0
  fi
  sleep 2
done

echo "PostgreSQL did not become ready in time." >&2
docker compose ps postgres || true
docker compose logs --tail 50 postgres || true
exit 1
