#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

docker compose exec -T postgres pg_isready -U postgres -d handmade_finance

docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d handmade_finance \
  < "$ROOT/database/verify/check.sql"

echo "Database check PASS"
