@echo off
chcp 65001 >nul
cd /d "%~dp0"

where py >nul 2>&1
if errorlevel 1 (
  echo 未找到 Python，无法启动本地网页服务器。
  echo 请先安装 Python，或把此窗口截图发给我。
  pause
  exit /b 1
)

set "UMBRELLA_PORT=8765"
set "UMBRELLA_URL=http://127.0.0.1:%UMBRELLA_PORT%/index.html?v=20260827-local-three"

rem 如果服务器已经在运行，直接打开页面，避免重复占用端口。
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 '%UMBRELLA_URL%'; if ($r.Content -match '古伞文化馆') { exit 0 } } catch {}; exit 1" >nul 2>&1
if not errorlevel 1 (
  start "" "%UMBRELLA_URL%"
  exit /b 0
)

echo 正在启动古伞文化馆……
echo 浏览器打开后，请保持此窗口开启。
echo 使用结束后，可关闭此窗口停止服务器。

start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Milliseconds 900; Start-Process '%UMBRELLA_URL%'"
py -m http.server %UMBRELLA_PORT% --bind 127.0.0.1

if errorlevel 1 (
  echo.
  echo 启动失败，端口 %UMBRELLA_PORT% 可能已被占用。
  pause
)
