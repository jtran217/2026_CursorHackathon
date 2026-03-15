#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Activate venv if present
if [ -f "$ROOT_DIR/.venv/bin/activate" ]; then
  source "$ROOT_DIR/.venv/bin/activate"
fi

cd "$ROOT_DIR/backend"

python -m PyInstaller \
  --onefile \
  --name restore-backend \
  --distpath "$ROOT_DIR/backend-dist" \
  --workpath "$ROOT_DIR/build/pyinstaller" \
  --specpath "$ROOT_DIR/build" \
  --hidden-import=db \
  --hidden-import=models \
  app.py
