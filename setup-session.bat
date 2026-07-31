@echo off
setlocal
title SmolyanVote - smolyan.bg Cloudflare session setup

set "ROOT=%~dp0"
cd /d "%ROOT%scraper"
set "NODE_OPTIONS=--use-system-ca"

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)

echo.
echo ============================================================
echo   smolyan.bg Cloudflare - REAL Chrome (not Playwright bot)
echo ============================================================
echo.
echo Cloudflare blocks Playwright even when you tick the box.
echo This opens normal Google Chrome - pass Cloudflare there.
echo.
echo Steps:
echo   1. Tick Cloudflare in the Chrome window
echo   2. Wait for ObS decisions list (document links)
echo   3. If "Just a moment" returns - wait 15s and press F5
echo   4. Press Enter in THIS window when you see documents
echo.
echo Saves: scraper\storage-state.json
echo Verify: cd scraper ^&^& npm run probe
echo.
call npm run setup-session
pause
