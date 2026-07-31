@echo off
setlocal EnableDelayedExpansion
title SmolyanVote - smolyan.bg Scraper (:3099)

set "ROOT=%~dp0"
set "SCRAPER=%ROOT%scraper"

echo ============================================================
echo   smolyan.bg scraper sidecar (port 3099)
echo   Needed for: ObS documents, consultations, councilors
echo ============================================================
echo.

if not exist "%SCRAPER%\package.json" (
  echo ERROR: scraper folder not found at %SCRAPER%
  pause
  exit /b 1
)

cd /d "%SCRAPER%"

rem Avast/AVG HTTPS scanning breaks npm unless Node uses the Windows trust store.
set "NODE_OPTIONS=--use-system-ca"
rem Real Chrome via CDP — headless storage-state is blocked by Cloudflare
set "MONITOR_SCRAPER_CDP=1"
rem Fast parallel scrape (~5 min full site)
set "MONITOR_SCRAPER_FAST=1"
set "MONITOR_SCRAPER_CONCURRENCY=5"
set "MONITOR_SCRAPER_LISTING_CONCURRENCY=2"
set "MONITOR_SCRAPER_DELAY_MS=300"
set "SMOLYAN_MAX_PAGES=40"
set "SMOLYAN_MAX_SCRAPE=2000"

if not exist "node_modules" (
  echo [1/2] Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed. If you see SSL errors ^(Avast/AVG^):
    echo   1. Temporarily disable HTTPS scanning in Avast, OR
    echo   2. Ensure NODE_OPTIONS=--use-system-ca is set ^(this script does that^)
    echo.
    pause
    exit /b 1
  )
  echo.
  echo [2/2] Installing Playwright Chromium...
  call npx playwright install chromium
  if errorlevel 1 (
    echo playwright install failed — check network / SSL
    pause
    exit /b 1
  )
) else (
  echo node_modules present — skipping npm install.
)

if not exist "storage-state.json" if not exist ".chrome-profile" (
  echo.
  echo [WARN] No Cloudflare session — run setup-session.bat first.
  echo.
) else (
  echo Chrome profile / session OK — CDP mode enabled.
)

rem Stop previous sidecar on :3099 so code updates take effect
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3099" ^| findstr LISTENING') do (
  echo Stopping old scraper PID %%a...
  taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Starting scraper on http://localhost:3099
echo   GET  /health
echo   GET  /session-status   ^(probe Cloudflare^)
echo   POST /scrape?maxPerSection=40
echo   POST /scrape-council
echo.
echo Verify session:  cd scraper ^&^& npm run probe
echo.
echo Chrome may open briefly for scraping (CDP). Close setup-session Chrome first.
echo Leave this window open while testing the monitor scraper.
echo.

npm start
