# ============================================
# SVMessenger Mobile - Stop Metro Script
# Stops all Metro processes
# ============================================

Write-Host "Stopping Metro processes..." -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { 
    $_.Path -like "*node.exe*" 
}

if ($nodeProcesses) {
    $count = $nodeProcesses.Count
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped $count Metro process(es)" -ForegroundColor Green
} else {
    Write-Host "No Metro processes running" -ForegroundColor Gray
}
