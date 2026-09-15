#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/app"
echo "HandmadeFinance (React mock)"
echo "http://127.0.0.1:5173/"
echo "Database is not connected. Data is MOCK data."
npm run dev
