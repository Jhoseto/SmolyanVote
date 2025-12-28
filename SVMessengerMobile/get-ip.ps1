# ============================================
# SVMessenger Mobile - Get Local IP Address
# Помощен скрипт за намиране на IP адреса на компютъра
# ============================================

Write-Host ""
Write-Host "Намиране на IP адреса на компютъра..." -ForegroundColor Cyan
Write-Host ""

# Намиране на активния мрежов адаптер
$networkAdapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*" -and
    $_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual"
} | Sort-Object InterfaceIndex

if ($networkAdapters) {
    Write-Host "Намерени IP адреси:" -ForegroundColor Green
    Write-Host ""
    
    $index = 1
    $ipAddresses = @()
    
    foreach ($adapter in $networkAdapters) {
        $interface = Get-NetAdapter -InterfaceIndex $adapter.InterfaceIndex -ErrorAction SilentlyContinue
        $interfaceName = if ($interface) { $interface.Name } else { "Unknown" }
        
        $ip = $adapter.IPAddress
        $ipAddresses += $ip
        
        Write-Host "  [$index] $ip" -ForegroundColor Yellow
        Write-Host "      Адаптер: $interfaceName" -ForegroundColor Gray
        Write-Host ""
        
        $index++
    }
    
    if ($ipAddresses.Count -gt 0) {
        $primaryIP = $ipAddresses[0]
        Write-Host "Основен IP адрес: $primaryIP" -ForegroundColor Green
        Write-Host ""
        Write-Host "Инструкции:" -ForegroundColor Cyan
        Write-Host "1. Отвори файла: SVMessengerMobile\src\config\api.ts" -ForegroundColor Yellow
        Write-Host "2. Промени DEV_HOST_IP с IP адреса по-горе:" -ForegroundColor Yellow
        Write-Host "   const DEV_HOST_IP = '$primaryIP';" -ForegroundColor White
        Write-Host ""
        Write-Host "3. Уверете се че:" -ForegroundColor Yellow
        Write-Host "   - Телефонът и компютърът са в една и съща Wi-Fi мрежа" -ForegroundColor Gray
        Write-Host "   - Firewall-ът на Windows позволява входящи връзки на порт 2662" -ForegroundColor Gray
        Write-Host ""
        
        # Копиране в clipboard
        try {
            Set-Clipboard -Value $primaryIP
            Write-Host "✓ IP адресът е копиран в clipboard!" -ForegroundColor Green
        } catch {
            Write-Host "Не можах да копирам в clipboard, но IP адресът е показан по-горе" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "Не можах да намеря активни мрежови адаптери!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Опитай ръчно:" -ForegroundColor Yellow
    Write-Host "1. Отвори PowerShell" -ForegroundColor Gray
    Write-Host "2. Изпълни: ipconfig" -ForegroundColor Gray
    Write-Host "3. Търси 'IPv4 Address' под активния адаптер" -ForegroundColor Gray
}

Write-Host ""
pause

