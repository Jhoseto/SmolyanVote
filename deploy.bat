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
set "SSH_OPTS=-o StrictHostKeyChecking=accept-new -o ConnectTimeout=15"
if defined DO_SSH_KEY set "SSH_OPTS=%SSH_OPTS% -i "%DO_SSH_KEY%""

set "SKIP_BUILD=0"
if /i "%~1"=="--skip-build" set "SKIP_BUILD=1"

where docker >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker is not installed or not in PATH.
  exit /b 1
)
where ssh >nul 2>&1
if errorlevel 1 (
  echo [ERROR] OpenSSH client is not installed or not in PATH.
  exit /b 1
)

echo.
echo === SmolyanVote deploy to %SSH_TARGET% ===
echo.

if "%SKIP_BUILD%"=="0" (
  echo [1/4] Building backend image locally...
  docker build -t smolyanvote-backend:latest -f Dockerfile .
  if errorlevel 1 exit /b 1

  echo.
  echo [2/4] Building frontend image locally...
  docker build -t smolyanvote-frontend:latest --build-arg API_INTERNAL_URL=http://backend:2662 -f frontend\Dockerfile frontend
  if errorlevel 1 exit /b 1
) else (
  echo [1-2/4] Skipping local build ^(--skip-build^).
)

echo.
echo [3/4] Uploading configs and Docker images...
scp %SSH_OPTS% "NewServerConfig\docker-compose.prod.yml" "NewServerConfig\post-deploy.sh" "NewServerConfig\Caddyfile" "%SSH_TARGET%:%REMOTE_DIR%/"
if errorlevel 1 exit /b 1

ssh %SSH_OPTS% %SSH_TARGET% "sed -i 's/\r$//' %REMOTE_DIR%/post-deploy.sh && chmod +x %REMOTE_DIR%/post-deploy.sh"
if errorlevel 1 exit /b 1

docker save smolyanvote-backend:latest smolyanvote-frontend:latest | ssh %SSH_OPTS% %SSH_TARGET% "docker load"
if errorlevel 1 exit /b 1

echo.
echo [4/4] Restarting stack on server ^(no build on Droplet^)...
ssh %SSH_OPTS% %SSH_TARGET% "bash %REMOTE_DIR%/post-deploy.sh"
if errorlevel 1 exit /b 1

echo.
echo Deploy complete: http://%DO_HOST%/
echo.
exit /b 0
