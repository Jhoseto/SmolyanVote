Write-Host ">>> STARTING AUTOMATIC REPAIR AND BUILD PROCESS..." -ForegroundColor Green

# 1. Install Dependencies
Write-Host "1. Installing Node Modules..." -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) { 
    Write-Warning "npm install finished with errors, but we will try to proceed."
}

# 2. Restore Gradle Wrapper
Write-Host "2. Searching for Gradle Wrapper..." -ForegroundColor Yellow
$wrapperDestDir = "android\gradle\wrapper"
if (-not (Test-Path $wrapperDestDir)) {
    New-Item -ItemType Directory -Force -Path $wrapperDestDir | Out-Null
}

# Try to find the jar in node_modules recursively
$foundJar = Get-ChildItem -Path "node_modules" -Filter "gradle-wrapper.jar" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
$foundProps = Get-ChildItem -Path "node_modules" -Filter "gradle-wrapper.properties" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1

if ($foundJar) {
    Write-Host "Found jar at: $($foundJar.FullName)" -ForegroundColor Cyan
    Copy-Item -Path $foundJar.FullName -Destination "$wrapperDestDir\gradle-wrapper.jar" -Force
    
    if ($foundProps) {
        Copy-Item -Path $foundProps.FullName -Destination "$wrapperDestDir\gradle-wrapper.properties" -Force
    }
    Write-Host "Gradle wrapper restored successfully." -ForegroundColor Green
} else {
    Write-Warning "Could not find gradle-wrapper.jar in node_modules."
    Write-Host "Attempting to generate wrapper using system gradle..." -ForegroundColor Yellow
    
    # Try using system gradle
    Set-Location android
    try {
        gradle wrapper
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Wrapper generated using system Gradle." -ForegroundColor Green
        } else {
            throw "Gradle command failed"
        }
    } catch {
        Write-Error "Could not restore Gradle Wrapper. Please open the project in Android Studio to fix this automatically."
        Set-Location ..
        exit 1
    }
    Set-Location ..
}

# 3. Clean Android Build Artifacts
Write-Host "3. Cleaning Android Build Folders..." -ForegroundColor Yellow
Remove-Item -Path "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\app\.cxx" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue

# 4. Build Release APK
Write-Host "4. Building Release APK..." -ForegroundColor Yellow
Set-Location android

if (Test-Path "gradlew.bat") {
    .\gradlew.bat assembleRelease
} else {
    # If wrapper is still missing, try running gradle directly if installed
    gradle assembleRelease
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n>>> BUILD SUCCESSFUL! <<<" -ForegroundColor Green
    Write-Host "Your APK file is located at:" -ForegroundColor Cyan
    Write-Host "$PWD\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Cyan
} else {
    Write-Error "Build Failed. Please check the logs above."
}
Set-Location ..
