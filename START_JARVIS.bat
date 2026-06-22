@echo off
chcp 65001 > nul
title JARVIS AI System
color 0B

echo.
echo  ============================================
echo    JARVIS AI OPERATING SYSTEM v2.0
echo  ============================================
echo.

:: Kill any existing server on port 8000
echo  [0/2] Clearing old server...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)
timeout /t 2 /nobreak > nul

cd /d "%~dp0"
call .venv\Scripts\activate.bat

set PYTHONUTF8=1
echo  [1/2] Starting JARVIS AI Backend...
echo  [2/2] Electron will open automatically in 3 seconds...
echo.
echo  If voice does not work, allow microphone in the popup.
echo.

python jarvis_api.py

pause
