# Скрипт за генериране на Release APK
# Това скрипт генерира production APK файл за инсталация на телефон

Write-Host "🚀 Генериране на Release APK..." -ForegroundColor Green

# Проверка дали сме в правилната директория
if (-not (Test-Path "android")) {
    Write-Host "❌ Грешка: Трябва да сте в SVMessengerMobile директорията!" -ForegroundColor Red
    exit 1
}

# Bundle на JavaScript кода за production
Write-Host "📦 Bundle на JavaScript кода за production..." -ForegroundColor Yellow
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Грешка при bundle на JavaScript кода!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ JavaScript bundle готов!" -ForegroundColor Green

# Генериране на Release APK
Write-Host "🔨 Генериране на Release APK..." -ForegroundColor Yellow
Write-Host "⚠️  Забележка: Ако има проблеми с дългите пътища на Windows, използвайте Android Studio:" -ForegroundColor Yellow
Write-Host "   1. Отворете проекта в Android Studio" -ForegroundColor Yellow
Write-Host "   2. Build > Generate Signed Bundle / APK" -ForegroundColor Yellow
Write-Host "   3. Изберете APK и следвайте стъпките" -ForegroundColor Yellow
Write-Host ""

cd android

# Опитваме се да генерираме APK
.\gradlew.bat assembleRelease

if ($LASTEXITCODE -eq 0) {
    $apkPath = "app\build\outputs\apk\release\app-release.apk"
    if (Test-Path $apkPath) {
        Write-Host ""
        Write-Host "✅ APK файлът е готов!" -ForegroundColor Green
        Write-Host "📍 Локация: $((Get-Location).Path)\$apkPath" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📱 За да инсталирате на телефона:" -ForegroundColor Yellow
        Write-Host "   1. Копирайте APK файла на телефона" -ForegroundColor White
        Write-Host "   2. Отворете файла на телефона" -ForegroundColor White
        Write-Host "   3. Разрешите инсталация от неизвестни източници (ако е необходимо)" -ForegroundColor White
        Write-Host "   4. Инсталирайте приложението" -ForegroundColor White
        Write-Host ""
        Write-Host "⚠️  Важно: Приложението е конфигурирано за production backend (https://smolyanvote.com)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ APK файлът не е намерен на очакваното място!" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "❌ Грешка при генериране на APK!" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Решение: Използвайте Android Studio:" -ForegroundColor Yellow
    Write-Host "   1. Отворете Android Studio" -ForegroundColor White
    Write-Host "   2. File > Open > Изберете SVMessengerMobile/android папката" -ForegroundColor White
    Write-Host "   3. Build > Generate Signed Bundle / APK" -ForegroundColor White
    Write-Host "   4. Изберете APK" -ForegroundColor White
    Write-Host "   5. Използвайте debug.keystore (парола: android)" -ForegroundColor White
    Write-Host "   6. Изберете release build variant" -ForegroundColor White
    exit 1
}

cd ..

