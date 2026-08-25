@echo off
cd /d "%~dp0"

where py >nul 2>&1
if errorlevel 1 (
  echo Python was not found.
  echo Please send a screenshot of this window.
  pause
  exit /b 1
)

echo Starting the umbrella lab...
echo Keep this window open while using the lab.
echo Press Ctrl+C here when you are finished.

start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Milliseconds 900; Start-Process 'http://127.0.0.1:8000/lab.html'"
py -m http.server 8000 --bind 127.0.0.1

if errorlevel 1 (
  echo.
  echo Startup failed. Port 8000 may already be in use.
  pause
)
