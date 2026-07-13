@echo off
title Sales Order Tracker
color 0A
cls

echo.
echo  =========================================
echo    SALES ORDER TRACKER
echo  =========================================
echo.
echo  Starting servers, please wait...
echo.

REM ── Kill anything already running on these ports ──────────────────────────
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8001 ^| findstr LISTENING 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

REM ── Start Django backend ──────────────────────────────────────────────────
echo  [1/2]  Starting Backend  (Django - Port 8001)...
start "Backend Server - DO NOT CLOSE" cmd /k "color 0E && title Backend Server (Django 8001) && cd /d D:\Cloude-Projects\order-tracker\backend && python manage.py runserver 8001"

REM ── Wait for Django to boot ───────────────────────────────────────────────
timeout /t 4 /nobreak >nul

REM ── Start Vite frontend ───────────────────────────────────────────────────
echo  [2/2]  Starting Frontend (Vite   - Port 3001)...
start "Frontend Server - DO NOT CLOSE" cmd /k "color 0B && title Frontend Server (Vite 3001) && cd /d D:\Cloude-Projects\order-tracker\frontend && npm run dev -- --port 3001"

REM ── Wait for Vite to boot ─────────────────────────────────────────────────
timeout /t 6 /nobreak >nul

REM ── Open browser ─────────────────────────────────────────────────────────
echo.
echo  Opening browser...
start "" http://localhost:3001

echo.
echo  =========================================
echo   App is running at http://localhost:3001
echo.
echo   Two server windows are open:
echo    - Backend Server  (yellow window)
echo    - Frontend Server (blue window)
echo.
echo   DO NOT close those two windows.
echo   Close them only when done using the app.
echo  =========================================
echo.
pause
