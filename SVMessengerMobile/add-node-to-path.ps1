# ============================================
# Add Node.js to PATH Script
# ============================================

Write-Host "Searching for Node.js installation..." -ForegroundColor Cyan
Write-Host ""

# Common installation locations
$searchPaths = @(
    "C:\Program Files\nodejs",
    "C:\Program Files (x86)\nodejs",
    "$env:ProgramFiles\nodejs",
    "${env:ProgramFiles(x86)}\nodejs",
    "$env:LOCALAPPDATA\Programs\nodejs",
    "$env:USERPROFILE\AppData\Local\Programs\nodejs"
)

$nodePath = $null
$nodeDir = $null

# Search for node.exe
foreach ($path in $searchPaths) {
    $testPath = Join-Path $path "node.exe"
    if (Test-Path $testPath) {
        $nodePath = $testPath
        $nodeDir = $path
        Write-Host "Found Node.js at: $nodePath" -ForegroundColor Green
        break
    }
}

# If not found, search more broadly
if (-not $nodePath) {
    Write-Host "Searching in common locations..." -ForegroundColor Yellow
    
    # Check Program Files
    $pfNode = Get-ChildItem -Path "$env:ProgramFiles" -Filter "node.exe" -Recurse -ErrorAction SilentlyContinue -Depth 2 | Select-Object -First 1
    if ($pfNode) {
        $nodePath = $pfNode.FullName
        $nodeDir = Split-Path $nodePath
        Write-Host "Found Node.js at: $nodePath" -ForegroundColor Green
    }
}

if (-not $nodePath) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Node.js not found!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js first:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://nodejs.org/" -ForegroundColor Cyan
    Write-Host "  2. Install the LTS version" -ForegroundColor Cyan
    Write-Host "  3. Make sure to check 'Add to PATH' during installation" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installation, run this script again." -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host ""
Write-Host "Node.js directory: $nodeDir" -ForegroundColor Green
Write-Host ""

# Check if already in PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -like "*$nodeDir*") {
    Write-Host "Node.js is already in your User PATH!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Current PATH includes: $nodeDir" -ForegroundColor Gray
} else {
    Write-Host "Adding Node.js to User PATH..." -ForegroundColor Yellow
    
    # Add to User PATH
    $newPath = $currentPath
    if ($newPath -and -not $newPath.EndsWith(";")) {
        $newPath += ";"
    }
    $newPath += $nodeDir
    
    try {
        [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        Write-Host "Successfully added to User PATH!" -ForegroundColor Green
        Write-Host ""
        Write-Host "IMPORTANT: You need to restart your terminal/PowerShell for changes to take effect!" -ForegroundColor Yellow
        Write-Host ""
    } catch {
        Write-Host "ERROR: Failed to add to PATH: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "You can manually add this to PATH:" -ForegroundColor Yellow
        Write-Host "  1. Press Win+R, type: sysdm.cpl" -ForegroundColor Cyan
        Write-Host "  2. Go to 'Advanced' tab -> 'Environment Variables'" -ForegroundColor Cyan
        Write-Host "  3. Edit 'Path' in 'User variables'" -ForegroundColor Cyan
        Write-Host "  4. Add: $nodeDir" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "To verify, restart PowerShell and run: node --version" -ForegroundColor Cyan
Write-Host ""
pause

