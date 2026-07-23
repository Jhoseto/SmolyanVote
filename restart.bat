@echo off
setlocal EnableDelayedExpansion
title SmolyanVote - Restart

rem ============================================================
rem  SmolyanVote - Local restart script
rem  Stops everything, then launches for Next-only manual testing:
rem    - Backend  (Spring API/WS; legacy HTML redirect to :3000) :2662
rem    - Frontend (SOLE UI - Next.js)                            :3000
rem  Isolation details: docs\CUTOVER.md
rem ============================================================

set "ROOT=%~dp0"
rem ROOTNS = project root without trailing backslash (safe for start /D "...")
set "ROOTNS=%ROOT:~0,-1%"
set "BACKEND_PORT=2662"
set "FRONTEND_PORT=3000"
set "BACKEND_WAIT_SEC=120"
set "FRONTEND_WAIT_SEC=60"

echo ============================================================
echo   SmolyanVote - Local restart (Next-only UI)
echo ============================================================
echo.

echo [1/5] Stopping running processes...

rem --- Stop Gradle daemons (frees the compiled backend) ---
if exist "%ROOT%gradlew.bat" (
  call "%ROOT%gradlew.bat" --stop >nul 2>&1
)

rem --- Free backend port (%BACKEND_PORT%) ---
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%BACKEND_PORT% " ^| findstr LISTENING') do (
  echo   - Stopping process on port %BACKEND_PORT%, PID %%p
  taskkill /F /PID %%p >nul 2>&1
)

rem --- Free frontend port (%FRONTEND_PORT%) ---
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%FRONTEND_PORT% " ^| findstr LISTENING') do (
  echo   - Stopping process on port %FRONTEND_PORT%, PID %%p
  taskkill /F /PID %%p >nul 2>&1
)

echo   Done.
echo.

rem --- Clear corrupted Next.js dev cache (fixes Turbopack / @swc/helpers errors) ---
if exist "%ROOT%frontend\.next" (
  echo   Clearing frontend\.next cache...
  rmdir /s /q "%ROOT%frontend\.next" 2>nul
)
timeout /t 2 /nobreak >nul
echo.

rem --- Local JVM truststore
if not exist "%ROOT%config\jvm\cacerts-with-avast" (
  echo [truststore] Creating local JVM truststore for AV HTTPS scanning...
  powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\setup-local-truststore.ps1"
  if errorlevel 1 (
    echo [truststore] WARNING: setup failed. OAuth may fail with PKIX until Avast HTTPS scan is off
    echo             or you re-run: powershell -File scripts\setup-local-truststore.ps1
  )
) else (
  echo [truststore] Using config\jvm\cacerts-with-avast
)
echo.

rem --- Ensure frontend dependencies are installed ---
echo [2/5] Checking frontend dependencies...
if not exist "%ROOT%frontend\node_modules" (
  echo   node_modules missing - installing, one-time...
  pushd "%ROOT%frontend"
  call npm install
  popd
) else (
  echo   node_modules present - skipping npm install.
)
echo.

rem --- Start backend first (frontend proxies API calls to :2662) ---
echo [3/5] Starting BACKEND on http://localhost:%BACKEND_PORT% ...
start "SmolyanVote BACKEND :%BACKEND_PORT%" /D "%ROOTNS%" cmd /k gradlew.bat bootRun

echo [4/5] Waiting for backend (port %BACKEND_PORT%, up to %BACKEND_WAIT_SEC%s)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$port=%BACKEND_PORT%; $timeout=%BACKEND_WAIT_SEC%; $deadline=(Get-Date).AddSeconds($timeout); while((Get-Date) -lt $deadline){ try { $c=New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1',$port); $c.Close(); exit 0 } catch { Start-Sleep -Seconds 2 } }; Write-Host '  WARNING: Backend did not start within' $timeout 'seconds.'; exit 1"
if errorlevel 1 (
  echo   Frontend will still start, but API proxy errors are expected until backend is up.
) else (
  echo   Backend is listening on port %BACKEND_PORT%.
)
echo.

rem --- Start frontend only after backend wait ---
echo [5/5] Starting FRONTEND on http://localhost:%FRONTEND_PORT% ...
start "SmolyanVote FRONTEND :%FRONTEND_PORT%" /D "%ROOTNS%\frontend" cmd /k npm run dev

echo   Waiting for frontend (port %FRONTEND_PORT%, up to %FRONTEND_WAIT_SEC%s)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$port=%FRONTEND_PORT%; $timeout=%FRONTEND_WAIT_SEC%; $deadline=(Get-Date).AddSeconds($timeout); while((Get-Date) -lt $deadline){ try { $c=New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1',$port); $c.Close(); exit 0 } catch { Start-Sleep -Seconds 1 } }; Write-Host '  WARNING: Frontend did not start within' $timeout 'seconds.'; exit 1"
if errorlevel 1 (
  echo   Open http://localhost:%FRONTEND_PORT%/ manually once Next shows Ready.
) else (
  echo   Frontend is listening on port %FRONTEND_PORT%.
  timeout /t 2 /nobreak >nul
  start http://localhost:%FRONTEND_PORT%/
)

echo.
echo ============================================================
echo   UI (test here) : http://localhost:%FRONTEND_PORT%
echo   API / WS       : http://localhost:%BACKEND_PORT%
echo ============================================================
echo   Two console windows opened - backend and frontend.
echo.
echo   Manual testing: use ONLY the FRONTEND URL above.
echo   Backend (:2662) is JSON API + OAuth + WebSocket only.
echo.
echo   Docs: docs\CUTOVER.md
echo   Order: backend first, then frontend after :%BACKEND_PORT% is up.
echo   Backend  ready when you see Started ... in the backend window.
echo   Frontend ready when you see Ready / Local on port %FRONTEND_PORT%.
echo   Browser opens after both servers are listening.
echo.
pause
