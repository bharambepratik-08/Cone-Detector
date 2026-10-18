@echo off
title Cone Detection System Launcher
echo ========================================================
echo Starting Cone Detection System (Backend + Frontend)...
echo ========================================================

echo [1/3] Starting FastAPI Backend on port 8000...
start "Cone Detection - Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo [2/3] Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo [3/3] Starting React Frontend on port 5173...
start "Cone Detection - Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 2 /nobreak >nul

echo Opening browser at http://127.0.0.1:5173 ...
start http://127.0.0.1:5173

echo ========================================================
echo Website is now running!
echo - Keep the two opened command windows running.
echo - When finished, simply close both command windows.
echo ========================================================
pause
