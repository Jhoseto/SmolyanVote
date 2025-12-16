# ============================================
# SVMessenger Mobile - Restart Script
# Restarts Metro and Android app
# ============================================

Write-Host "Restarting Metro and Android app..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop all Metro processes
Write-Host "Stopping Metro processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { 
    $_.Path -like "*node.exe*" 
}

if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "Metro processes stopped" -ForegroundColor Green
} else {
    Write-Host "No Metro processes running" -ForegroundColor Gray
}

# Step 2: Clear Metro cache
Write-Host ""
Write-Host "Clearing Metro cache..." -ForegroundColor Yellow
$cachePath = Join-Path $PSScriptRoot "node_modules\.cache"
if (Test-Path $cachePath) {
    Remove-Item -Path $cachePath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Cache cleared" -ForegroundColor Green
} else {
    Write-Host "No cache to clear" -ForegroundColor Gray
}

# Step 3: Start Metro in new window
Write-Host ""
Write-Host "Starting Metro Bundler..." -ForegroundColor Yellow
$metroWindow = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'Metro Bundler Starting...' -ForegroundColor Green; Write-Host ''; npm start -- --reset-cache" -PassThru
Write-Host "Metro started in new window (PID: $($metroWindow.Id))" -ForegroundColor Green

# Step 4: Wait for Metro to start
Write-Host ""
Write-Host "Waiting for Metro to start (10 seconds)..." -ForegroundColor Yellow
for ($i = 10; $i -gt 0; $i--) {
    Write-Host "   $i..." -ForegroundColor Gray -NoNewline
    Start-Sleep -Seconds 1
    Write-Host "`r" -NoNewline
}
Write-Host "   Ready!    " -ForegroundColor Green

# Step 5: Check if Metro is running
Write-Host ""
Write-Host "Checking if Metro is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/status" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "Metro is running on port 8081" -ForegroundColor Green
} catch {
    Write-Host "Metro may not be ready yet, but continuing..." -ForegroundColor Yellow
}

# Step 6: Start Android app
Write-Host ""
Write-Host "Starting Android app..." -ForegroundColor Yellow
Write-Host ""

Set-Location $PSScriptRoot
npm run android

Write-Host ""
Write-Host "Done! App should start on emulator." -ForegroundColor Green
Write-Host ""
Write-Host "Tips:" -ForegroundColor Cyan
Write-Host "   - Metro runs in separate window" -ForegroundColor Gray
Write-Host "   - To stop Metro: close window or Ctrl+C" -ForegroundColor Gray
Write-Host "   - To reload: press R twice in emulator" -ForegroundColor Gray
