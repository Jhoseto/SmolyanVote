# PowerShell script to check Metro connection and help debug issues

Write-Host "🔍 Checking Metro Bundler Connection..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Metro is running
Write-Host "Step 1: Checking if Metro is running on port 8081..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/status" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Metro is running!" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Metro is NOT running!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 Solution: Start Metro with 'npm start' in SVMessengerMobile folder" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 2: Check if port 8081 is listening
Write-Host "Step 2: Checking if port 8081 is listening..." -ForegroundColor Yellow
$portCheck = Test-NetConnection -ComputerName localhost -Port 8081 -WarningAction SilentlyContinue
if ($portCheck.TcpTestSucceeded) {
    Write-Host "✅ Port 8081 is open and listening" -ForegroundColor Green
} else {
    Write-Host "❌ Port 8081 is not accessible" -ForegroundColor Red
    Write-Host "   This might be a firewall issue" -ForegroundColor Gray
}

Write-Host ""

# Step 3: Get local IP address
Write-Host "Step 3: Getting your local IP address..." -ForegroundColor Yellow
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*" 
} | Select-Object -First 1

if ($ipAddresses) {
    $localIP = $ipAddresses.IPAddress
    Write-Host "✅ Your local IP address: $localIP" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 For physical device:" -ForegroundColor Cyan
    Write-Host "   1. Open Dev Menu in app (shake device or Ctrl+M)" -ForegroundColor Gray
    Write-Host "   2. Go to Settings → Debug server host & port" -ForegroundColor Gray
    Write-Host "   3. Enter: $localIP`:8081" -ForegroundColor Gray
} else {
    Write-Host "⚠️ Could not determine local IP address" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Check Node.js processes
Write-Host "Step 4: Checking Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process | Where-Object { $_.ProcessName -like "*node*" }
if ($nodeProcesses) {
    Write-Host "✅ Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Green
    $nodeProcesses | ForEach-Object {
        Write-Host "   PID: $($_.Id), Name: $($_.ProcessName)" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️ No Node.js processes found" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Check firewall rules
Write-Host "Step 5: Checking Windows Firewall..." -ForegroundColor Yellow
$firewallRules = Get-NetFirewallRule | Where-Object { 
    $_.DisplayName -like "*Node*" -or 
    $_.DisplayName -like "*8081*" 
} | Select-Object -First 5

if ($firewallRules) {
    Write-Host "✅ Found firewall rules related to Node.js/8081" -ForegroundColor Green
    $firewallRules | ForEach-Object {
        Write-Host "   Rule: $($_.DisplayName), Enabled: $($_.Enabled)" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️ No specific firewall rules found for Node.js/8081" -ForegroundColor Yellow
    Write-Host "   You may need to allow Node.js through Windows Firewall" -ForegroundColor Gray
}

Write-Host ""

# Step 6: Check ADB connection (for Android devices)
Write-Host "Step 6: Checking ADB connection..." -ForegroundColor Yellow
try {
    $adbPath = Get-Command adb -ErrorAction Stop
    $devices = adb devices 2>&1 | Select-String "device$"
    if ($devices) {
        Write-Host "✅ ADB is connected to device(s)" -ForegroundColor Green
        $devices | ForEach-Object {
            Write-Host "   $_" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠️ No Android devices connected via ADB" -ForegroundColor Yellow
        Write-Host "   Make sure USB debugging is enabled on your device" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️ ADB not found in PATH" -ForegroundColor Yellow
    Write-Host "   Install Android SDK Platform Tools to use ADB" -ForegroundColor Gray
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📋 Summary and Next Steps:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "If Metro is running but you still can't connect:" -ForegroundColor Yellow
Write-Host "  1. Check that device and computer are on the same Wi-Fi network" -ForegroundColor Gray
Write-Host "  2. Configure Dev Menu with correct IP address (see Step 3)" -ForegroundColor Gray
Write-Host "  3. Check Windows Firewall settings" -ForegroundColor Gray
Write-Host "  4. Try using Chrome DevTools (Dev Menu → Debug)" -ForegroundColor Gray
Write-Host "  5. Use Logcat for native debugging: adb logcat" -ForegroundColor Gray
Write-Host ""
Write-Host "For more help, see: debug-metro.md" -ForegroundColor Cyan
Write-Host ""

