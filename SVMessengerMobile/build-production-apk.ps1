# ============================================
# SVMessenger Mobile - Build Production APK
# Генерира production APK файл за инсталация на телефон
# ============================================

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BUILD PRODUCTION APK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "  1. Clean old build files" -ForegroundColor Gray
Write-Host "  2. Bundle JavaScript for production" -ForegroundColor Gray
Write-Host "  3. Build release APK" -ForegroundColor Gray
Write-Host "  4. Show APK location" -ForegroundColor Gray
Write-Host ""
Write-Host "IMPORTANT: This APK will use PRODUCTION backend (https://smolyanvote.com)" -ForegroundColor Yellow
Write-Host ""

# Step 1: Clean old build files
Write-Host "Step 1: Cleaning old build files..." -ForegroundColor Yellow

# Clean Android build
$buildPaths = @(
    "$PSScriptRoot\android\app\build",
    "$PSScriptRoot\android\build",
    "$PSScriptRoot\android\app\src\main\assets\index.android.bundle"
)

foreach ($buildPath in $buildPaths) {
    if (Test-Path $buildPath) {
        Remove-Item -Path $buildPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  Cleaned: $buildPath" -ForegroundColor Gray
    }
}

# Run Gradle clean
Set-Location "$PSScriptRoot\android"
if (Test-Path "gradlew.bat") {
    Write-Host "  Running Gradle clean..." -ForegroundColor Gray
    try {
        & .\gradlew.bat clean 2>&1 | Out-Null
    } catch {
        Write-Host "  Gradle clean completed (warnings can be ignored)" -ForegroundColor Gray
    }
} else {
    Write-Host "  Gradle wrapper not found, skipping clean..." -ForegroundColor Yellow
}
Set-Location $PSScriptRoot

Write-Host "Build files cleaned" -ForegroundColor Green
Write-Host ""

# Step 2: Create assets directory if it doesn't exist
Write-Host "Step 2: Preparing assets directory..." -ForegroundColor Yellow
$assetsDir = "$PSScriptRoot\android\app\src\main\assets"
if (-not (Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null
    Write-Host "  Created assets directory" -ForegroundColor Gray
}
Write-Host "Assets directory ready" -ForegroundColor Green
Write-Host ""

# Step 3: Bundle JavaScript for production
Write-Host "Step 3: Bundling JavaScript for production..." -ForegroundColor Yellow
Write-Host "  This may take 30-60 seconds..." -ForegroundColor Gray
Write-Host ""

$bundleCommand = "npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/"

try {
    Invoke-Expression $bundleCommand
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: Failed to bundle JavaScript!" -ForegroundColor Red
        Write-Host "Exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to bundle JavaScript!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "JavaScript bundle ready!" -ForegroundColor Green
Write-Host ""

# Step 4: Build APK using Gradle
Write-Host "Step 4: Building release APK with Gradle..." -ForegroundColor Yellow
Write-Host "  This may take 2-5 minutes..." -ForegroundColor Gray
Write-Host ""

Set-Location "$PSScriptRoot\android"

# Build release APK
# Try with arm64-v8a first (most common architecture)
Write-Host "  Building for arm64-v8a architecture..." -ForegroundColor Gray

$buildExitCode = 0
$buildOutput = ""

# Try building with arm64-v8a
$process = Start-Process -FilePath ".\gradlew.bat" -ArgumentList "assembleRelease", "-PreactNativeArchitectures=arm64-v8a" -NoNewWindow -Wait -PassThru -RedirectStandardOutput "gradle-output.txt" -RedirectStandardError "gradle-error.txt"

$buildExitCode = $process.ExitCode

if ($buildExitCode -ne 0) {
    Write-Host ""
    Write-Host "  Trying without architecture restriction..." -ForegroundColor Yellow
    
    # Try without architecture restriction
    $process = Start-Process -FilePath ".\gradlew.bat" -ArgumentList "assembleRelease" -NoNewWindow -Wait -PassThru -RedirectStandardOutput "gradle-output.txt" -RedirectStandardError "gradle-error.txt"
    
    $buildExitCode = $process.ExitCode
}

# Read build output
if (Test-Path "gradle-output.txt") {
    $buildOutput = Get-Content "gradle-output.txt" -Raw
    Remove-Item "gradle-output.txt" -ErrorAction SilentlyContinue
}

if (Test-Path "gradle-error.txt") {
    $errorOutput = Get-Content "gradle-error.txt" -Raw
    if ($errorOutput) {
        $buildOutput = $buildOutput + "`n" + $errorOutput
    }
    Remove-Item "gradle-error.txt" -ErrorAction SilentlyContinue
}

Set-Location $PSScriptRoot

if ($buildExitCode -eq 0) {
    # Find APK file
    $apkPath = "$PSScriptRoot\android\app\build\outputs\apk\release\app-release.apk"
    
    if (Test-Path $apkPath) {
        $fullPath = (Resolve-Path $apkPath).Path
        $fileSize = (Get-Item $apkPath).Length / 1MB
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "SUCCESS! APK file is ready!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Location: $fullPath" -ForegroundColor Cyan
        Write-Host "Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "To install on your phone:" -ForegroundColor Yellow
        Write-Host "  1. Copy APK file to your phone (via USB, email, or cloud)" -ForegroundColor White
        Write-Host "  2. Open the file on your phone" -ForegroundColor White
        Write-Host "  3. Allow installation from unknown sources (if prompted)" -ForegroundColor White
        Write-Host "     - Settings > Security > Unknown sources" -ForegroundColor DarkGray
        Write-Host "  4. Install the app" -ForegroundColor White
        Write-Host ""
        Write-Host "IMPORTANT:" -ForegroundColor Yellow
        Write-Host "  - This APK uses PRODUCTION backend: https://smolyanvote.com" -ForegroundColor White
        Write-Host "  - All API calls will go to production server" -ForegroundColor White
        Write-Host "  - Make sure you have internet connection" -ForegroundColor White
        Write-Host ""
        
        # Try to open file location in Explorer
        try {
            $apkDir = Split-Path $fullPath
            Start-Process explorer.exe -ArgumentList "/select,`"$fullPath`""
            Write-Host "Opened file location in Explorer" -ForegroundColor Gray
        } catch {
            # Ignore if can't open
        }
    } else {
        Write-Host ""
        Write-Host "ERROR: APK file not found at expected location!" -ForegroundColor Red
        Write-Host "Expected: $apkPath" -ForegroundColor Red
        Write-Host ""
        Write-Host "Check build output above for errors." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "ERROR: Failed to build APK!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Exit code: $buildExitCode" -ForegroundColor Yellow
    if ($buildOutput) {
        Write-Host ""
        Write-Host "Last 50 lines of build output:" -ForegroundColor Yellow
        $buildOutputLines = $buildOutput -split "`n"
        $lastLines = $buildOutputLines[-50..-1]
        Write-Host ($lastLines -join "`n") -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "No build output captured. Check Android Studio for details." -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "SOLUTION: Use Android Studio instead:" -ForegroundColor Yellow
    Write-Host "  1. Open Android Studio" -ForegroundColor White
    Write-Host "  2. File > Open > Select SVMessengerMobile/android folder" -ForegroundColor White
    Write-Host "  3. Build > Generate Signed Bundle / APK" -ForegroundColor White
    Write-Host "  4. Select APK" -ForegroundColor White
    Write-Host "  5. Use debug.keystore (password: android)" -ForegroundColor White
    Write-Host "  6. Select release build variant" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
Write-Host ""

