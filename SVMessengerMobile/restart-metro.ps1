# Restart Metro with clean cache
Write-Host "Stopping Metro..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node.exe*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Clearing Metro cache..." -ForegroundColor Yellow
Remove-Item -Path "$PSScriptRoot\node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Starting Metro with reset cache..." -ForegroundColor Green
Set-Location $PSScriptRoot
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'Metro Bundler Starting...' -ForegroundColor Green; npx react-native start --reset-cache"

Write-Host "Metro started in new window. Wait 10 seconds before running the app." -ForegroundColor Cyan

