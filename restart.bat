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

echo ============================================================
echo   SmolyanVote - Local restart (Next-only UI)
echo ============================================================
echo.

echo [1/4] Stopping running processes...

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

rem --- Local JVM truststore (Avast/AVG HTTPS scan breaks Google/Facebook OAuth) ---
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
echo [2/4] Checking frontend dependencies...
if not exist "%ROOT%frontend\node_modules" (
  echo   node_modules missing - installing, one-time...
  pushd "%ROOT%frontend"
  call npm install
  popd
) else (
  echo   node_modules present - skipping npm install.
)
echo.

rem --- Start backend in its own window ---
echo [3/4] Starting BACKEND on http://localhost:%BACKEND_PORT% ...
start "SmolyanVote BACKEND :%BACKEND_PORT%" /D "%ROOTNS%" cmd /k gradlew.bat bootRun

rem --- Start frontend in its own window ---
echo [4/4] Starting FRONTEND on http://localhost:%FRONTEND_PORT% ...
start "SmolyanVote FRONTEND :%FRONTEND_PORT%" /D "%ROOTNS%\frontend" cmd /k npm run dev

rem --- Open the Next UI once the stack is likely up (does not block this window) ---
start "" cmd /c "timeout /t 18 /nobreak >nul & start http://localhost:%FRONTEND_PORT%/"

echo.
echo ============================================================
echo   UI (test here) : http://localhost:%FRONTEND_PORT%
echo   API / WS       : http://localhost:%BACKEND_PORT%
echo ============================================================
echo   Two console windows opened - backend and frontend.
echo.
echo   Manual testing: use ONLY the FRONTEND URL above.
echo   Browser hits to http://localhost:%BACKEND_PORT% HTML pages
echo   are redirected to Next - legacy Thymeleaf is isolated.
echo   Toggle off: set SMOLYANVOTE_LEGACY_REDIRECT=false on the backend.
echo.
echo   Docs: docs\CUTOVER.md
echo   Frontend ready when you see Ready / Local on port %FRONTEND_PORT%.
echo   Backend  ready when you see Started ... in X seconds.
echo   Browser opens :%FRONTEND_PORT% automatically after about 18s.
echo.
pause
