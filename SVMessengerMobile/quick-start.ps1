# ============================================
# SVMessenger Mobile - ULTRA FAST START
# Optimized script for fast startup
# ============================================

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "ULTRA FAST START - SVMessenger Mobile" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Metro (fast)
Write-Host "Checking Metro..." -ForegroundColor Yellow -NoNewline
try {
    $null = Invoke-WebRequest -Uri "http://localhost:8081/status" -TimeoutSec 1 -ErrorAction Stop
    Write-Host " Already running!" -ForegroundColor Green
    $metroRunning = $true
} catch {
    Write-Host " Not running" -ForegroundColor Red
    $metroRunning = $false
}

# Step 2: Start Metro (if not running)
if (-not $metroRunning) {
    Write-Host ""
    Write-Host "Starting Metro Bundler..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm start" -WindowStyle Minimized
    Write-Host "   Waiting 3 seconds..." -ForegroundColor Gray
    Start-Sleep -Seconds 3
}

# Step 3: Check device/emulator
Write-Host ""
Write-Host "Checking Android device..." -ForegroundColor Yellow -NoNewline
$adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adbPath)) {
    $adbPath = "$env:ANDROID_HOME\platform-tools\adb.exe"
}

if (Test-Path $adbPath) {
    $devices = & $adbPath devices 2>&1 | Select-String "device$"
    if ($devices) {
        Write-Host " Device found!" -ForegroundColor Green
    } else {
        Write-Host " No device connected" -ForegroundColor Yellow
        Write-Host "   Start emulator or connect phone!" -ForegroundColor Gray
    }
} else {
    Write-Host " ADB not found" -ForegroundColor Yellow
}

# Step 4: Fast start Android app
Write-Host ""
Write-Host "Starting Android app..." -ForegroundColor Cyan
Write-Host "   (This may take 30-60 seconds on first run)" -ForegroundColor Gray
Write-Host ""

# Use react-native run-android directly with optimizations
$env:REACT_NATIVE_PACKAGER_SKIP_BACKGROUND = "true"
npm run android

Write-Host ""
Write-Host "Done! App should start now." -ForegroundColor Green
Write-Host ""
