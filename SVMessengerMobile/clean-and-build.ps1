# ============================================
# SVMessenger Mobile - Clean and Build
# Пълно почистване на кеша и rebuild за физическо устройство
# ============================================

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CLEAN AND BUILD - SVMessenger Mobile" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Този скрипт ще:" -ForegroundColor Yellow
Write-Host "  1. Почисти Metro bundler кеш" -ForegroundColor Gray
Write-Host "  2. Почисти Android build кеш (Gradle)" -ForegroundColor Gray
Write-Host "  3. Почисти стари bundle файлове" -ForegroundColor Gray
Write-Host "  4. Почисти React Native кеш" -ForegroundColor Gray
Write-Host "  5. Рестартира Metro с чист кеш" -ForegroundColor Gray
Write-Host "  6. Build-не приложението отново" -ForegroundColor Gray
Write-Host ""

# Step 1: Stop Metro processes
Write-Host "Step 1: Спиране на Metro процеси..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { 
    $_.Path -like "*node.exe*" 
}

if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "  [OK] Metro процеси спрени" -ForegroundColor Green
} else {
    Write-Host "  [OK] Няма работещи Metro процеси" -ForegroundColor Gray
}
Write-Host ""

# Step 2: Clear Metro cache
Write-Host "Step 2: Почистване на Metro кеш..." -ForegroundColor Yellow
$cachePaths = @(
    "$PSScriptRoot\node_modules\.cache",
    "$PSScriptRoot\.metro"
)

foreach ($cachePath in $cachePaths) {
    if (Test-Path $cachePath) {
        Remove-Item -Path $cachePath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  [OK] Изтрит: $cachePath" -ForegroundColor Gray
    }
}

# Clear TEMP cache files with wildcards
Get-ChildItem -Path $env:TEMP -Filter "metro-*" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path $env:TEMP -Filter "react-*" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "  [OK] Metro кеш почистен" -ForegroundColor Green
Write-Host ""

# Step 3: Clear Android build cache
Write-Host "Step 3: Почистване на Android build кеш..." -ForegroundColor Yellow
$androidCachePaths = @(
    "$PSScriptRoot\android\app\build",
    "$PSScriptRoot\android\build",
    "$PSScriptRoot\android\.gradle",
    "$PSScriptRoot\android\app\src\main\assets\index.android.bundle"
)

foreach ($cachePath in $androidCachePaths) {
    if (Test-Path $cachePath) {
        Remove-Item -Path $cachePath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  [OK] Изтрит: $cachePath" -ForegroundColor Gray
    }
}
Write-Host "  [OK] Android build кеш почистен" -ForegroundColor Green
Write-Host ""

# Step 4: Run Gradle clean
Write-Host "Step 4: Gradle clean..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\android"
try {
    if (Test-Path "gradlew.bat") {
        .\gradlew.bat clean 2>&1 | Out-Null
        Write-Host "  [OK] Gradle clean завършен" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Gradle wrapper не е намерен, пропускам..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [WARN] Gradle clean пропуснат (не е критично)" -ForegroundColor Yellow
}
Set-Location $PSScriptRoot
Write-Host ""

# Step 5: Clear React Native cache
Write-Host "Step 5: Почистване на React Native кеш..." -ForegroundColor Yellow

Get-ChildItem -Path $env:TEMP -Filter "react-native-*" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path $env:TEMP -Filter "haste-map-*" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path $env:TEMP -Filter "metro-*" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "  [OK] React Native кеш почистен" -ForegroundColor Green
Write-Host ""

# Step 6: Uninstall old app from device (optional but recommended)
Write-Host "Step 6: Деинсталация на старо приложение от устройство..." -ForegroundColor Yellow
$adbCheck = Get-Command adb -ErrorAction SilentlyContinue
if ($adbCheck) {
    try {
        $devices = adb devices 2>&1 | Select-String "device$"
        if ($devices) {
            Write-Host "  Намерено устройство, деинсталирам старо приложение..." -ForegroundColor Gray
            adb uninstall com.svmessengermobile 2>&1 | Out-Null
            Write-Host "  [OK] Старо приложение деинсталирано (ако е съществувало)" -ForegroundColor Green
        } else {
            Write-Host "  [WARN] Няма свързани устройства" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  [WARN] Не можах да деинсталирам (не е критично)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [WARN] ADB не е намерен в PATH" -ForegroundColor Yellow
}
Write-Host ""

# Step 7: Start Metro with clean cache
Write-Host "Step 7: Стартиране на Metro с чист кеш..." -ForegroundColor Yellow

# Find Node.js
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $nodePath) {
    Write-Host "  [ERROR] Node.js не е намерен!" -ForegroundColor Red
    Write-Host "  Инсталирай Node.js от: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

$nodeDir = Split-Path $nodePath
$metroPath = $env:Path
if ($metroPath -notlike "*$nodeDir*") {
    $metroPath = $nodeDir
    $metroPath = $metroPath + ";"
    $metroPath = $metroPath + $env:Path
}

# Start Metro in new window - use same approach as restart.ps1
$scriptRootEscaped = $PSScriptRoot
$metroCommand = "cd '$scriptRootEscaped'; `$env:Path = '$metroPath'; Write-Host 'Metro Bundler Starting (Clean Cache)...' -ForegroundColor Green; Write-Host ''; npm start -- --reset-cache"
$metroWindow = Start-Process powershell -ArgumentList "-NoExit", "-Command", $metroCommand -PassThru
Write-Host "  [OK] Metro стартиран в нов прозорец (PID: $($metroWindow.Id))" -ForegroundColor Green
Write-Host ""

# Step 8: Wait for Metro
Write-Host "Step 8: Изчакване на Metro да стартира (15 секунди)..." -ForegroundColor Yellow
for ($i = 15; $i -gt 0; $i--) {
    Write-Host "   $i..." -ForegroundColor Gray -NoNewline
    Start-Sleep -Seconds 1
    Write-Host "`r" -NoNewline
}
Write-Host "   Готово!    " -ForegroundColor Green
Write-Host ""

# Step 9: Verify Metro
Write-Host "Step 9: Проверка на Metro..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/status" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "  [OK] Metro работи на порт 8081" -ForegroundColor Green
} catch {
    Write-Host "  [WARN] Metro може да не е готов още, но продължавам..." -ForegroundColor Yellow
}
Write-Host ""

# Step 10: Build and install app
Write-Host "Step 10: Build и инсталация на приложението..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Това може да отнеме 1-3 минути..." -ForegroundColor Gray
Write-Host ""

Set-Location $PSScriptRoot

# Ensure PATH includes Node.js
if ($nodePath) {
    $nodeDir = Split-Path $nodePath
    if ($env:Path -notlike "*$nodeDir*") {
        $env:Path = $nodeDir + ";" + $env:Path
    }
}

# Run android build
try {
    npm run android
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "[SUCCESS] BUILD УСПЕШЕН!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Приложението е инсталирано с най-новата версия!" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "[ERROR] BUILD НЕУСПЕШЕН" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Провери грешките по-горе." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "[ERROR] ГРЕШКА ПРИ BUILD" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Съвети:" -ForegroundColor Cyan
Write-Host "  - Metro работи в отделен прозорец" -ForegroundColor Gray
Write-Host "  - За reload: натисни R два пъти в приложението" -ForegroundColor Gray
Write-Host "  - За да спреш Metro: затвори прозореца или Ctrl+C" -ForegroundColor Gray
Write-Host ""
