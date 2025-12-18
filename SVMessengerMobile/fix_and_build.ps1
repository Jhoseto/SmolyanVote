Write-Host ">>> STARTING AUTOMATIC REPAIR AND BUILD PROCESS..." -ForegroundColor Green

# 1. Install Dependencies (Critical if node_modules is corrupted)
Write-Host "1. Installing Node Modules (Wait a moment)..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { 
    Write-Error "npm install failed. Check your internet connection."
    exit 1 
}

# 2. Restore Gradle Wrapper (Fixes 'Unable to access jarfile' error)
Write-Host "2. Restoring Gradle Wrapper..." -ForegroundColor Yellow
$wrapperSource = "node_modules\react-native\template\android\gradle\wrapper\gradle-wrapper.jar"
$wrapperPropsSource = "node_modules\react-native\template\android\gradle\wrapper\gradle-wrapper.properties"
$wrapperDestDir = "android\gradle\wrapper"

if (-not (Test-Path $wrapperDestDir)) {
    New-Item -ItemType Directory -Force -Path $wrapperDestDir | Out-Null
}

if (Test-Path $wrapperSource) {
    Copy-Item -Path $wrapperSource -Destination "$wrapperDestDir\gradle-wrapper.jar" -Force
    Copy-Item -Path $wrapperPropsSource -Destination "$wrapperDestDir\gradle-wrapper.properties" -Force
    Write-Host "Gradle wrapper restored successfully." -ForegroundColor Green
} else {
    Write-Error "Could not find Gradle wrapper template. npm install might have failed to download react-native package."
    exit 1
}

# 3. Clean Android Build Artifacts (Fixes CMake/Cache errors)
Write-Host "3. Cleaning Android Build Folders..." -ForegroundColor Yellow
Remove-Item -Path "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\app\.cxx" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue

# 4. Build Release APK
Write-Host "4. Building Release APK (This takes time)..." -ForegroundColor Yellow
Set-Location android

# Use the restored wrapper
.\gradlew assembleRelease

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n>>> BUILD SUCCESSFUL! <<<" -ForegroundColor Green
    Write-Host "Your APK file is located at:" -ForegroundColor Cyan
    Write-Host "$PWD\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Cyan
} else {
    Write-Error "Build Failed. Please check the logs above for details."
}
