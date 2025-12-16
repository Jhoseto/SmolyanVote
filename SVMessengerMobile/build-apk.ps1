# ============================================
# SVMessenger Mobile - Build Release APK
# Генерира production APK файл
# ============================================

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "Building Release APK..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Bundle JavaScript for production
Write-Host "Step 1: Bundling JavaScript for production..." -ForegroundColor Yellow
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to bundle JavaScript!" -ForegroundColor Red
    exit 1
}

Write-Host "JavaScript bundle ready!" -ForegroundColor Green
Write-Host ""

# Step 2: Build APK using Gradle
Write-Host "Step 2: Building APK with Gradle..." -ForegroundColor Yellow
Write-Host "Note: This may take 2-5 minutes..." -ForegroundColor Gray
Write-Host ""

cd android

# Try to build with only arm64-v8a to avoid path length issues
.\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a

if ($LASTEXITCODE -eq 0) {
    $apkPath = "app\build\outputs\apk\release\app-release.apk"
    if (Test-Path $apkPath) {
        $fullPath = (Resolve-Path $apkPath).Path
        Write-Host ""
        Write-Host "SUCCESS! APK file is ready!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Location: $fullPath" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "To install on your phone:" -ForegroundColor Yellow
        Write-Host "  1. Copy APK file to your phone" -ForegroundColor White
        Write-Host "  2. Open the file on your phone" -ForegroundColor White
        Write-Host "  3. Allow installation from unknown sources (if needed)" -ForegroundColor White
        Write-Host "  4. Install the app" -ForegroundColor White
        Write-Host ""
        Write-Host "IMPORTANT: App is configured for production backend (https://smolyanvote.com)" -ForegroundColor Yellow
    } else {
        Write-Host "ERROR: APK file not found at expected location!" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to build APK!" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTION: Use Android Studio instead:" -ForegroundColor Yellow
    Write-Host "  1. Open Android Studio" -ForegroundColor White
    Write-Host "  2. File > Open > Select SVMessengerMobile/android folder" -ForegroundColor White
    Write-Host "  3. Build > Generate Signed Bundle / APK" -ForegroundColor White
    Write-Host "  4. Select APK" -ForegroundColor White
    Write-Host "  5. Use debug.keystore (password: android)" -ForegroundColor White
    Write-Host "  6. Select release build variant" -ForegroundColor White
    Write-Host ""
    Write-Host "The APK will be in: android/app/release/app-release.apk" -ForegroundColor Gray
    exit 1
}

cd ..

