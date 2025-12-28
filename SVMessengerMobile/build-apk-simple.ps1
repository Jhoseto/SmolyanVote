# ============================================
# SVMessenger Mobile - Simple APK Builder
# Прост и надежден скрипт за build на production APK
# ============================================

$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BUILD PRODUCTION APK (SIMPLE)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will build a production APK for testing" -ForegroundColor Yellow
Write-Host "Backend: https://smolyanvote.com" -ForegroundColor Yellow
Write-Host ""

# Step 1: Bundle JavaScript
Write-Host "Step 1: Bundling JavaScript for production..." -ForegroundColor Yellow
Write-Host ""

$bundleCommand = "npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/"

# Create assets directory if needed
$assetsDir = "$PSScriptRoot\android\app\src\main\assets"
if (-not (Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null
}

# Run bundle command
Invoke-Expression $bundleCommand

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Failed to bundle JavaScript!" -ForegroundColor Red
    Write-Host "Exit code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "JavaScript bundle ready!" -ForegroundColor Green
Write-Host ""

# Step 2: Build APK with Gradle
Write-Host "Step 2: Building APK with Gradle..." -ForegroundColor Yellow
Write-Host "  This will show Gradle output in real-time..." -ForegroundColor Gray
Write-Host "  This may take 2-5 minutes..." -ForegroundColor Gray
Write-Host ""

Set-Location "$PSScriptRoot\android"

# Build release APK - show output in real-time
Write-Host "Running: .\gradlew.bat assembleRelease" -ForegroundColor Cyan
Write-Host ""

.\gradlew.bat assembleRelease

$buildExitCode = $LASTEXITCODE

Set-Location $PSScriptRoot

# Step 3: Check result
Write-Host ""
if ($buildExitCode -eq 0) {
    $apkPath = "$PSScriptRoot\android\app\build\outputs\apk\release\app-release.apk"
    
    if (Test-Path $apkPath) {
        $fullPath = (Resolve-Path $apkPath).Path
        $fileSize = (Get-Item $apkPath).Length / 1MB
        
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "SUCCESS! APK file is ready!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Location: $fullPath" -ForegroundColor Cyan
        Write-Host "Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "To install on your phone:" -ForegroundColor Yellow
        Write-Host "  1. Copy APK file to your phone" -ForegroundColor White
        Write-Host "  2. Open the file on your phone" -ForegroundColor White
        Write-Host "  3. Allow installation from unknown sources" -ForegroundColor White
        Write-Host "  4. Install the app" -ForegroundColor White
        Write-Host ""
        Write-Host "IMPORTANT: This APK uses PRODUCTION backend" -ForegroundColor Yellow
        Write-Host ""
        
        # Open file location
        try {
            $apkDir = Split-Path $fullPath
            Start-Process explorer.exe -ArgumentList "/select,`"$fullPath`""
        } catch {
            # Ignore
        }
    } else {
        Write-Host "ERROR: APK file not found!" -ForegroundColor Red
        Write-Host "Expected: $apkPath" -ForegroundColor Red
        Write-Host ""
        Write-Host "Check the Gradle output above for errors." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Exit code: $buildExitCode" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Check the Gradle output above for errors." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common solutions:" -ForegroundColor Cyan
    Write-Host "  1. Make sure Java JDK is installed" -ForegroundColor Gray
    Write-Host "  2. Check Android SDK is configured" -ForegroundColor Gray
    Write-Host "  3. Try: cd android; .\gradlew.bat clean" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "Done!" -ForegroundColor Green
Write-Host ""

