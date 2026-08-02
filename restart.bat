@echo off
setlocal EnableDelayedExpansion
title SmolyanVote - Restart

rem ============================================================
rem  Restart backend :2662 + frontend :3000
rem  Scraper :3099 — manually: start-scraper.bat
rem  Open in browser: http://localhost:3000
rem ============================================================

set "ROOT=%~dp0"
set "ROOTNS=%ROOT:~0,-1%"
set "PORTS=2662,3000"
set "BACKEND_PORT=2662"
set "FRONTEND_PORT=3000"
set "BACKEND_WAIT_SEC=120"
set "FRONTEND_WAIT_SEC=120"

echo ============================================================
echo   SmolyanVote - Restart (backend + frontend)
echo ============================================================
echo.

echo [1/5] Stopping processes on ports %PORTS% ...
if exist "%ROOT%gradlew.bat" call "%ROOT%gradlew.bat" --stop >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\dev-stop.ps1" -PortList "%PORTS%"
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\dev-wait-ports-free.ps1" -PortList "%PORTS%" -TimeoutSec 20 >nul 2>&1
echo   Done.
echo.

if /I "%CLEAN_NEXT%"=="1" (
  if exist "%ROOT%frontend\.next" (
    echo   Clearing frontend\.next ...
    rmdir /s /q "%ROOT%frontend\.next" 2>nul
  )
)
timeout /t 1 /nobreak >nul

if not exist "%ROOT%config\jvm\cacerts-with-avast" (
  echo [truststore] Creating truststore...
  powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\setup-local-truststore.ps1"
) else (
  echo [truststore] OK
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\setup-local-truststore.ps1" >nul 2>&1
echo.

echo [2/5] Frontend dependencies ...
if not exist "%ROOT%frontend\node_modules" (
  pushd "%ROOT%frontend"
  call npm install
  popd
) else (
  echo   node_modules OK
)
echo.

echo [3/5] Starting BACKEND :%BACKEND_PORT% ...
start "SmolyanVote BACKEND :%BACKEND_PORT%" /D "%ROOTNS%" cmd /k gradlew.bat bootRun

echo [4/5] Waiting for backend health - max %BACKEND_WAIT_SEC%s ...
set "BACKEND_OK=0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\dev-wait-http.ps1" -Url "http://127.0.0.1:%BACKEND_PORT%/actuator/health" -TimeoutSec %BACKEND_WAIT_SEC%
if not errorlevel 1 set "BACKEND_OK=1"
if "%BACKEND_OK%"=="1" (
  echo   Backend health OK
) else (
  echo   WARNING: Backend health timeout - frontend will still start
  echo   Check BACKEND window if API calls fail
)
echo.

echo [5/5] Starting FRONTEND :%FRONTEND_PORT% ...
start "SmolyanVote FRONTEND :%FRONTEND_PORT%" /D "%ROOTNS%\frontend" cmd /k npm run dev

powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\dev-wait-port.ps1" -Port %FRONTEND_PORT% -TimeoutSec %FRONTEND_WAIT_SEC%
if not errorlevel 1 (
  echo   Frontend port %FRONTEND_PORT% OK
) else (
  echo   WARNING: Frontend still compiling - wait for Ready in FRONTEND window
)
echo.

timeout /t 2 /nobreak >nul
start http://localhost:%FRONTEND_PORT%/

echo ============================================================
echo   UI     http://localhost:%FRONTEND_PORT%
echo   API    http://localhost:%BACKEND_PORT%
echo ============================================================
echo   Scraper: start manually when needed - start-scraper.bat
echo   CLEAN_NEXT=1 to wipe .next cache
echo.
pause
