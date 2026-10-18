@echo off
title Cone Detection - Backend (FastAPI)
echo ========================================================
echo Starting Cone Detection Backend on Port 8000...
echo ========================================================
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
pause
