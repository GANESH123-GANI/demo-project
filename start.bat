@echo off
echo ========================================================
echo  ProcureFlow Enterprise S2P Platform Launcher
echo  React Frontend + Python Backend (FastAPI / SQLite)
echo ========================================================

set PYTHON_CMD=python
where python >nul 2>&1
if %errorlevel% neq 0 (
  if exist "C:\Users\hp\AppData\Local\Programs\Python\Python312\python.exe" (
    set PYTHON_CMD="C:\Users\hp\AppData\Local\Programs\Python\Python312\python.exe"
  )
)

echo [1/2] Running automated test suite...
%PYTHON_CMD% backend/test_backend.py
if %errorlevel% neq 0 (
  echo [ERROR] Test suite failed.
  pause
  exit /b 1
)

echo [2/2] Starting ProcureFlow Universal Server on http://localhost:8000 ...
echo Workspaces: 7 Enterprise Workspaces / 13 Modules Ready
%PYTHON_CMD% backend/run.py
pause

