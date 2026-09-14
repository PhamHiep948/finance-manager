#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-8766}"

cd "$ROOT/frontend"
echo "HandmadeFinance (mock frontend)"
echo "http://127.0.0.1:${PORT}/"
echo "Database is not connected. Data is MOCK data in js/data.js"
python -m http.server "$PORT"
