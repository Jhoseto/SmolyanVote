# ============================================
# SVMessenger Mobile - Start Metro Script
# Starts Metro Bundler
# ============================================

Write-Host "Starting Metro Bundler..." -ForegroundColor Green
Write-Host ""

Set-Location $PSScriptRoot

# Check if Metro already running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/status" -TimeoutSec 1 -ErrorAction Stop
    Write-Host "Metro already running on port 8081" -ForegroundColor Yellow
    Write-Host "Use stop-metro.ps1 if you want to restart it" -ForegroundColor Gray
    exit
} catch {
    # Metro not running, continue
}

# Start Metro
Write-Host "Starting Metro with reset cache..." -ForegroundColor Cyan
npm start -- --reset-cache
