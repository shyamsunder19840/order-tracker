@echo off
title Sales Order Tracker — Build Executable
color 0B
setlocal

set ROOT=D:\Cloude-Projects\order-tracker
set FRONTEND=%ROOT%\frontend
set BACKEND=%ROOT%\backend
set DIST_SRC=%FRONTEND%\dist
set DIST_DST=%BACKEND%\frontend_dist
set OUTPUT=%ROOT%\dist\OrderTracker

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║   Sales Order Tracker — Build Executable         ║
echo  ╚══════════════════════════════════════════════════╝
echo.

REM ── Pre-flight checks ─────────────────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found. Install Python 3.10+ and try again.
    goto :fail
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js/npm not found. Install Node.js and try again.
    goto :fail
)

echo  Python and Node.js found. Starting build...
echo.

REM ── Step 1: Install Python dependencies ───────────────────────────────────
echo  [1/5] Installing Python dependencies (whitenoise, pyinstaller)...
pip install -r "%BACKEND%\requirements.txt" -q
pip install pyinstaller -q
if errorlevel 1 ( echo  [ERROR] pip install failed. & goto :fail )
echo        Done.

REM ── Step 2: Install frontend npm packages ─────────────────────────────────
echo  [2/5] Installing Node packages...
cd /d "%FRONTEND%"
call npm install --silent
if errorlevel 1 ( echo  [ERROR] npm install failed. & goto :fail )
echo        Done.

REM ── Step 3: Build React frontend ──────────────────────────────────────────
echo  [3/5] Building React frontend (npm run build)...
call npm run build
if errorlevel 1 ( echo  [ERROR] React build failed. & goto :fail )
echo        Done.

REM ── Step 4: Copy React dist → backend/frontend_dist ───────────────────────
echo  [4/5] Copying frontend build into backend...
if exist "%DIST_DST%" rmdir /s /q "%DIST_DST%"
xcopy /e /i /q "%DIST_SRC%" "%DIST_DST%"
if errorlevel 1 ( echo  [ERROR] xcopy failed. & goto :fail )
echo        Copied to backend\frontend_dist\

REM ── Step 5: Run PyInstaller ────────────────────────────────────────────────
echo  [5/5] Running PyInstaller (this may take 2-5 minutes)...
cd /d "%ROOT%"
pyinstaller OrderTracker.spec --noconfirm --clean
if errorlevel 1 ( echo  [ERROR] PyInstaller failed. See output above. & goto :fail )

REM ── Copy bc_config.json template next to the exe if it exists ─────────────
if exist "%BACKEND%\bc_config.json" (
    copy /y "%BACKEND%\bc_config.json" "%OUTPUT%\bc_config.json" >nul
)

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║   BUILD COMPLETE!                                ║
echo  ║                                                  ║
echo  ║   Executable folder:                             ║
echo  ║   dist\OrderTracker\                             ║
echo  ║                                                  ║
echo  ║   To run: double-click OrderTracker.exe          ║
echo  ║   To share: zip the entire OrderTracker\ folder  ║
echo  ╚══════════════════════════════════════════════════╝
echo.

REM ── Ask to open output folder ─────────────────────────────────────────────
set /p OPEN="Open the output folder now? (y/n): "
if /i "%OPEN%"=="y" explorer "%OUTPUT%"

goto :end

:fail
echo.
echo  Build failed. Check the errors above.
echo.

:end
pause
endlocal
