#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SCHEMA_FILE="$ROOT/database/shop_finance.sql"

if [[ ! -f "$SCHEMA_FILE" ]]; then
  echo "Schema file not found: $SCHEMA_FILE" >&2
  exit 1
fi

"$ROOT/scripts/db-start.sh"

echo "Resetting shop_finance schema for a clean apply..."
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d handmade_finance \
  -c "DROP SCHEMA IF EXISTS shop_finance CASCADE;"

echo "Applying $SCHEMA_FILE ..."
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d handmade_finance \
  < "$SCHEMA_FILE"

echo "Schema SQL applied successfully."
