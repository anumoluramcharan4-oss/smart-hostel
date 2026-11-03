#!/bin/bash
# HostelOS Single-Command Startup Script
# Starts FastAPI backend (port 8000) and Next.js frontend (port 3000) concurrently

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=================================================="
echo " Starting HostelOS (Smart Hostel Management)"
echo "=================================================="

# Determine Python / Uvicorn executable
if [ -f "$DIR/venv/bin/uvicorn" ]; then
    UVICORN_CMD="$DIR/venv/bin/uvicorn"
elif [ -f "$HOME/.venv/bin/uvicorn" ]; then
    UVICORN_CMD="$HOME/.venv/bin/uvicorn"
elif command -v uvicorn >/dev/null 2>&1; then
    UVICORN_CMD="uvicorn"
else
    UVICORN_CMD="python3 -m uvicorn"
fi

echo "[1/2] Launching FastAPI backend on http://127.0.0.1:8000..."
$UVICORN_CMD backend.app.main:app --reload --host 0.0.0.0 --port 8000 2>&1 | sed -e 's/^/[BACKEND] /' &
BACKEND_PID=$!

echo "[2/2] Launching Next.js frontend on http://localhost:3000..."
(cd "$DIR/frontend" && npm run dev) 2>&1 | sed -e 's/^/[FRONTEND] /' &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo "Stopping HostelOS services..."
    kill "$BACKEND_PID" 2>/dev/null || true
    kill "$FRONTEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
    wait "$FRONTEND_PID" 2>/dev/null || true
    echo "HostelOS services stopped cleanly."
    exit 0
}

trap cleanup INT TERM EXIT

echo "=================================================="
echo " HostelOS is running!"
echo " Backend:  http://localhost:8000 (API & /docs)"
echo " Frontend: http://localhost:3000"
echo " Press Ctrl+C to shut down all services."
echo "=================================================="

wait

