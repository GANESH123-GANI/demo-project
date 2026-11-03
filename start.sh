#!/usr/bin/env bash
set -e

echo "========================================================"
echo " ProcureFlow Enterprise S2P Platform Launcher"
echo " React Frontend + Python Backend (FastAPI / SQLite)"
echo "========================================================"

echo "[1/2] Running automated test suite..."
python3 backend/test_backend.py

echo "[2/2] Starting ProcureFlow Universal Server on http://localhost:8000 ..."
python3 backend/run.py

