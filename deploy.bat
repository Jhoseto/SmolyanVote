@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

set "ENV_FILE=deploy.local.env"
if exist "NewServerConfig\deploy.local.env" set "ENV_FILE=NewServerConfig\deploy.local.env"

if not exist "%ENV_FILE%" (
  echo.
  echo [ERROR] Missing deploy config: %ENV_FILE%
  echo Copy deploy.local.env.example to deploy.local.env and set DO_HOST / DO_USER.
  echo.
  exit /b 1
)

for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%ENV_FILE%") do (
  if not "%%~A"=="" set "%%~A=%%~B"
)

if "%DO_HOST%"=="" (
  echo [ERROR] DO_HOST is not set in %ENV_FILE%
  exit /b 1
)
if "%DO_USER%"=="" set "DO_USER=root"
if "%REMOTE_DIR%"=="" set "REMOTE_DIR=/opt/smolyanvote/server"

set "SSH_TARGET=%DO_USER%@%DO_HOST%"
set "SSH_OPTS=-o StrictHostKeyChecking=accept-new -o ConnectTimeout=30 -o ServerAliveInterval=15 -o ServerAliveCountMax=20 -o TCPKeepAlive=yes"
if defined DO_SSH_KEY set "SSH_OPTS=%SSH_OPTS% -i "%DO_SSH_KEY%""
if not defined SCP_RETRY_COUNT set "SCP_RETRY_COUNT=3"

rem Server configs from tracked deploy/; secrets from NewServerConfig/.env only
set "DEPLOY_CONFIG=deploy"

set "SKIP_BUILD=0"
set "BUILD_BACKEND=1"
set "BUILD_FRONTEND=1"
:ParseArgs
if "%~1"=="" goto ArgsDone
if /i "%~1"=="--skip-build" set "SKIP_BUILD=1"
if /i "%~1"=="--backend-only" set "BUILD_FRONTEND=0"
if /i "%~1"=="--frontend-only" set "BUILD_BACKEND=0"
shift
goto ParseArgs
:ArgsDone

call :RequireTool java
call :RequireTool node
call :RequireTool npm
call :RequireTool ssh
call :RequireTool scp
call :RequireTool tar
if not exist "gradlew.bat" (
  echo [ERROR] gradlew.bat not found. Run deploy.bat from the repo root.
  exit /b 1
)
if not exist "%DEPLOY_CONFIG%\docker-compose.prod.yml" (
  echo [ERROR] Missing %DEPLOY_CONFIG%\docker-compose.prod.yml
  exit /b 1
)
if not exist "scraper\Dockerfile" (
  echo [ERROR] Missing scraper\Dockerfile — monitor sidecar required for production.
  exit /b 1
)
if not exist "scraper\package.json" (
  echo [ERROR] Missing scraper\package.json
  exit /b 1
)

echo.
echo === SmolyanVote deploy to %SSH_TARGET% ===
echo   Config source: %DEPLOY_CONFIG%\
echo   Local build: Gradle + npm ^(no Docker needed on this PC^)
if "%BUILD_BACKEND%"=="0" echo   Scope: frontend only
if "%BUILD_FRONTEND%"=="0" echo   Scope: backend only
echo.

if "%SKIP_BUILD%"=="0" (
  if "%BUILD_BACKEND%"=="1" (
    call :BuildBackend
    if errorlevel 1 exit /b 1
  )
  if "%BUILD_FRONTEND%"=="1" (
    call :BuildFrontend
    if errorlevel 1 exit /b 1
  )
) else (
  if "%BUILD_BACKEND%"=="1" if not exist ".deploy\artifacts\app.jar" (
    echo [ERROR] --skip-build but .deploy\artifacts\app.jar is missing.
    exit /b 1
  )
  if "%BUILD_FRONTEND%"=="1" if not exist ".deploy\artifacts\frontend\server.js" (
    echo [ERROR] --skip-build but .deploy\artifacts\frontend\server.js is missing.
    exit /b 1
  )
  echo [build] Skipping local build ^(--skip-build^).
)

echo.
echo [upload] Uploading configs from %DEPLOY_CONFIG%...
scp %SSH_OPTS% "%DEPLOY_CONFIG%\docker-compose.prod.yml" "%DEPLOY_CONFIG%\post-deploy.sh" "%DEPLOY_CONFIG%\Caddyfile" "%SSH_TARGET%:%REMOTE_DIR%/"
if errorlevel 1 exit /b 1

if exist "NewServerConfig\.env" (
  echo [upload] Server .env ^(secrets — GEMINI_API_KEY, DB, etc.^)...
  call :ScpWithRetry "NewServerConfig\.env" "%SSH_TARGET%:%REMOTE_DIR%/.env.part"
  if errorlevel 1 exit /b 1
  ssh %SSH_OPTS% %SSH_TARGET% "mv -f %REMOTE_DIR%/.env.part %REMOTE_DIR%/.env && chmod 600 %REMOTE_DIR%/.env"
  if errorlevel 1 exit /b 1
) else (
  echo [WARN] NewServerConfig\.env not found — server keeps existing .env
)

if exist "NewServerConfig\firebase-service-account.json" (
  echo [upload] Firebase service account...
  call :ScpWithRetry "NewServerConfig\firebase-service-account.json" "%SSH_TARGET%:%REMOTE_DIR%/firebase-service-account.json.part"
  if errorlevel 1 exit /b 1
  ssh %SSH_OPTS% %SSH_TARGET% "mv -f %REMOTE_DIR%/firebase-service-account.json.part %REMOTE_DIR%/firebase-service-account.json && chmod 600 %REMOTE_DIR%/firebase-service-account.json"
  if errorlevel 1 exit /b 1
) else if exist "firebase-service-account.json" (
  echo [upload] Firebase service account ^(repo root^)...
  call :ScpWithRetry "firebase-service-account.json" "%SSH_TARGET%:%REMOTE_DIR%/firebase-service-account.json.part"
  if errorlevel 1 exit /b 1
  ssh %SSH_OPTS% %SSH_TARGET% "mv -f %REMOTE_DIR%/firebase-service-account.json.part %REMOTE_DIR%/firebase-service-account.json && chmod 600 %REMOTE_DIR%/firebase-service-account.json"
  if errorlevel 1 exit /b 1
) else (
  echo [WARN] firebase-service-account.json not found — push notifications may not work until uploaded
)

echo [upload] Monitor scraper sidecar...
if not exist ".deploy" mkdir ".deploy"
if exist ".deploy\scraper.tar.gz" del /f /q ".deploy\scraper.tar.gz"
tar -czf ".deploy\scraper.tar.gz" -C scraper --exclude=node_modules .
if errorlevel 1 (
  echo [ERROR] Failed to create scraper archive
  exit /b 1
)
call :ScpWithRetry ".deploy\scraper.tar.gz" "%SSH_TARGET%:%REMOTE_DIR%/scraper.tar.gz.part"
if errorlevel 1 exit /b 1
ssh %SSH_OPTS% %SSH_TARGET% "mkdir -p %REMOTE_DIR%/scraper && rm -rf %REMOTE_DIR%/scraper/* && tar -xzf %REMOTE_DIR%/scraper.tar.gz.part -C %REMOTE_DIR%/scraper && mv -f %REMOTE_DIR%/scraper.tar.gz.part %REMOTE_DIR%/scraper.tar.gz && rm -f %REMOTE_DIR%/scraper.tar.gz"
if errorlevel 1 exit /b 1

if exist "scraper\storage-state.json" (
  echo [upload] smolyan.bg Cloudflare session ^(storage-state.json^)...
  call :ScpWithRetry "scraper\storage-state.json" "%SSH_TARGET%:%REMOTE_DIR%/scraper/storage-state.json.part"
  if errorlevel 1 exit /b 1
  ssh %SSH_OPTS% %SSH_TARGET% "mv -f %REMOTE_DIR%/scraper/storage-state.json.part %REMOTE_DIR%/scraper/storage-state.json && chmod 600 %REMOTE_DIR%/scraper/storage-state.json"
  if errorlevel 1 exit /b 1
) else (
  echo [WARN] scraper\storage-state.json missing — run setup-session.bat before smolyan.bg scrape works
)

ssh %SSH_OPTS% %SSH_TARGET% "sed -i 's/\r$//' %REMOTE_DIR%/post-deploy.sh && chmod +x %REMOTE_DIR%/post-deploy.sh && mkdir -p %REMOTE_DIR%/artifacts/frontend && rm -f %REMOTE_DIR%/artifacts/app.jar.part %REMOTE_DIR%/artifacts/frontend.tar.gz.part"
if errorlevel 1 exit /b 1

if "%BUILD_BACKEND%"=="1" (
  echo [upload] Backend JAR ^(~167 MB — keep connection open; retries on drop^)...
  call :ScpWithRetry ".deploy\artifacts\app.jar" "%SSH_TARGET%:%REMOTE_DIR%/artifacts/app.jar.part"
  if errorlevel 1 exit /b 1
  ssh %SSH_OPTS% %SSH_TARGET% "mv -f %REMOTE_DIR%/artifacts/app.jar.part %REMOTE_DIR%/artifacts/app.jar"
  if errorlevel 1 exit /b 1
)

if "%BUILD_FRONTEND%"=="1" (
  echo [upload] Frontend archive ^(tar.gz — much faster than thousands of small files^)...
  if not exist ".deploy\artifacts\frontend\server.js" (
    echo [ERROR] Missing .deploy\artifacts\frontend\server.js — run a full build first.
    exit /b 1
  )
  if not exist ".deploy" mkdir ".deploy"
  if exist ".deploy\frontend.tar.gz" del /f /q ".deploy\frontend.tar.gz"
  tar -czf ".deploy\frontend.tar.gz" -C ".deploy\artifacts\frontend" .
  if errorlevel 1 (
    echo [ERROR] Failed to create .deploy\frontend.tar.gz
    exit /b 1
  )
  call :ScpWithRetry ".deploy\frontend.tar.gz" "%SSH_TARGET%:%REMOTE_DIR%/artifacts/frontend.tar.gz.part"
  if errorlevel 1 exit /b 1
  ssh %SSH_OPTS% %SSH_TARGET% "mv -f %REMOTE_DIR%/artifacts/frontend.tar.gz.part %REMOTE_DIR%/artifacts/frontend.tar.gz"
  if errorlevel 1 exit /b 1
  ssh %SSH_OPTS% %SSH_TARGET% "rm -rf %REMOTE_DIR%/artifacts/frontend && mkdir -p %REMOTE_DIR%/artifacts/frontend && tar -xzf %REMOTE_DIR%/artifacts/frontend.tar.gz -C %REMOTE_DIR%/artifacts/frontend && rm -f %REMOTE_DIR%/artifacts/frontend.tar.gz"
  if errorlevel 1 (
    echo [ERROR] Failed to extract frontend archive on server.
    exit /b 1
  )
)

echo.
echo [restart] Restarting stack on server...
ssh %SSH_OPTS% %SSH_TARGET% "bash %REMOTE_DIR%/post-deploy.sh"
if errorlevel 1 exit /b 1

echo.
echo Deploy complete: http://%DO_HOST%/
echo   Monitor: http://%DO_HOST%/monitor
echo   After first deploy: Admin -^> Monitor -^> Ingestion -^> run SIGMA import (~5 min)
echo.
echo Tips for faster deploys:
echo   deploy.bat --backend-only    ^(Java changes only, ~30s build + upload^)
echo   deploy.bat --frontend-only   ^(UI changes only, ~2-4 min build + upload^)
echo   deploy.bat --skip-build      ^(re-upload last build, no compile^)
echo.
echo If a large upload drops mid-transfer, re-run with --skip-build ^(build already done^).
echo.
exit /b 0

goto :EOF

:RequireTool
where %~1 >nul 2>&1
if errorlevel 1 (
  echo [ERROR] %~1 is not installed or not in PATH.
  exit /b 1
)
exit /b 0

:BuildBackend
echo [build] Backend JAR ^(Gradle, incremental — no clean^)...
if not exist ".deploy\artifacts" mkdir ".deploy\artifacts"
call gradlew.bat bootJar -x test
if errorlevel 1 exit /b 1

set "JAR="
for %%F in (build\libs\*.jar) do (
  echo %%~nxF | findstr /i /c:"-plain.jar" >nul
  if errorlevel 1 set "JAR=%%F"
)
if not defined JAR (
  echo [ERROR] Could not find boot JAR in build\libs\
  exit /b 1
)

copy /y "%JAR%" ".deploy\artifacts\app.jar" >nul
echo       ^> %JAR%
exit /b 0

:BuildFrontend
echo.
echo [build] Frontend ^(Next.js standalone^)...
pushd frontend

if not exist "node_modules" (
  echo       npm ci ^(first time only^)...
  call npm ci
  if errorlevel 1 (
    popd
    exit /b 1
  )
)

rem API_INTERNAL_URL = Docker network (Next server rewrites only).
rem NEXT_PUBLIC_BACKEND_ORIGIN = public HTTPS origin for browser OAuth
rem (must NOT be http://backend:2662 — browsers cannot resolve that hostname).
set "API_INTERNAL_URL=http://backend:2662"
if not defined NEXT_PUBLIC_BACKEND_ORIGIN set "NEXT_PUBLIC_BACKEND_ORIGIN=https://smolyanvote.com"
set "NEXT_PUBLIC_API_URL="
set "NEXT_PUBLIC_WS_URL=/ws-svmessenger"
if not defined NODE_MAX_OLD_SPACE_SIZE set "NODE_MAX_OLD_SPACE_SIZE=4096"
set "NODE_OPTIONS=--max-old-space-size=%NODE_MAX_OLD_SPACE_SIZE%"
set "NEXT_TELEMETRY_DISABLED=1"

echo       Node heap: %NODE_MAX_OLD_SPACE_SIZE% MB
call npm run build -- --webpack
if errorlevel 1 (
  popd
  exit /b 1
)

if not exist ".next\standalone\server.js" (
  echo [ERROR] Missing frontend\.next\standalone\server.js after build.
  popd
  exit /b 1
)

popd

if not exist ".deploy" mkdir ".deploy"
if not exist ".deploy\artifacts" mkdir ".deploy\artifacts"
if exist ".deploy\artifacts\frontend" rmdir /s /q ".deploy\artifacts\frontend"
mkdir ".deploy\artifacts\frontend"
mkdir ".deploy\artifacts\frontend\.next" 2>nul

robocopy "frontend\.next\standalone" ".deploy\artifacts\frontend" /E /NFL /NDL /NJH /NJS /nc /ns /np >nul
if errorlevel 8 exit /b 1

robocopy "frontend\.next\static" ".deploy\artifacts\frontend\.next\static" /E /NFL /NDL /NJH /NJS /nc /ns /np >nul
if errorlevel 8 exit /b 1

robocopy "frontend\public" ".deploy\artifacts\frontend\public" /E /NFL /NDL /NJH /NJS /nc /ns /np >nul
if errorlevel 8 exit /b 1

echo       ^> .deploy\artifacts\frontend\
exit /b 0

:ScpWithRetry
rem Usage: call :ScpWithRetry "local\path" "user@host:remote/path"
set "SCP_LOCAL=%~1"
set "SCP_REMOTE=%~2"
set "SCP_TRY=0"
:ScpWithRetryAttempt
set /a SCP_TRY+=1
echo       attempt !SCP_TRY!/%SCP_RETRY_COUNT%...
scp %SSH_OPTS% -C "%SCP_LOCAL%" "%SCP_REMOTE%"
if not errorlevel 1 exit /b 0
if !SCP_TRY! lss %SCP_RETRY_COUNT% (
  echo [upload] Transfer interrupted — retrying in 8s...
  timeout /t 8 /nobreak >nul
  goto ScpWithRetryAttempt
)
echo [ERROR] Upload failed after %SCP_RETRY_COUNT% attempts: %SCP_LOCAL%
exit /b 1
