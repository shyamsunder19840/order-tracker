@echo off
title Sales Order Tracker - Stop
color 0C

echo.
echo  ============================================
echo    Stopping Sales Order Tracker...
echo  ============================================
echo.

REM ── Kill process on port 8001 (Django) ─────────
echo  Stopping Backend  (port 8001)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8001 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
    echo    Stopped PID %%a
)

REM ── Kill process on port 3001 (Vite) ───────────
echo  Stopping Frontend (port 3001)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
    echo    Stopped PID %%a
)

echo.
echo  Both servers stopped.
echo  ============================================
echo.
pause
