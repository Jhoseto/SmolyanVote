# PowerShell script to start React Native DevTools
# This script helps start DevTools for debugging

Write-Host "🔧 Starting React Native DevTools..." -ForegroundColor Cyan
Write-Host ""

# Check if react-devtools is installed
Write-Host "Checking if react-devtools is installed..." -ForegroundColor Yellow
try {
    $devtoolsVersion = npm list react-devtools --depth=0 2>&1 | Select-String "react-devtools"
    if ($devtoolsVersion) {
        Write-Host "✅ react-devtools is installed" -ForegroundColor Green
    } else {
        Write-Host "⚠️ react-devtools not found, installing..." -ForegroundColor Yellow
        npm install --save-dev react-devtools
        Write-Host "✅ react-devtools installed" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Could not check react-devtools, continuing..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📋 DevTools Options:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: React Native Debugger (RECOMMENDED)" -ForegroundColor Green
Write-Host "  Download: https://github.com/jhen0409/react-native-debugger/releases" -ForegroundColor Gray
Write-Host "  Then: Dev Menu → Debug in app" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: Standalone React DevTools" -ForegroundColor Yellow
Write-Host "  Starting now..." -ForegroundColor Gray
Write-Host ""

# Start react-devtools
try {
    Write-Host "🚀 Starting react-devtools..." -ForegroundColor Yellow
    npm run devtools
} catch {
    Write-Host "❌ Failed to start react-devtools" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 Alternative: Use React Native Debugger instead" -ForegroundColor Yellow
    Write-Host "   Download: https://github.com/jhen0409/react-native-debugger/releases" -ForegroundColor Gray
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "💡 Tips:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. React Native Debugger works better than Chrome DevTools" -ForegroundColor Gray
Write-Host "2. For native logs, use: adb logcat | Select-String ReactNativeJS" -ForegroundColor Gray
Write-Host "3. Dev Menu: Shake device or press Ctrl+M in emulator" -ForegroundColor Gray
Write-Host ""

