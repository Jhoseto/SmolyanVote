# Waits until TCP ports are free (nothing LISTENING).
param(
    [string]$PortList = "2662,3000,3099",
    [int]$TimeoutSec = 30
)

$Ports = @($PortList -split ',' | ForEach-Object { [int]$_.Trim() } | Where-Object { $_ -gt 0 })
$deadline = (Get-Date).AddSeconds($TimeoutSec)

function Test-PortListening {
    param([int]$Port)
    return [bool](netstat -ano | Select-String "LISTENING" | Select-String ":$Port\s")
}

while ((Get-Date) -lt $deadline) {
    $busy = @($Ports | Where-Object { Test-PortListening -Port $_ })
    if ($busy.Count -eq 0) {
        exit 0
    }
    Start-Sleep -Seconds 1
}

Write-Host "  WARNING: Ports still in use after ${TimeoutSec}s: $($busy -join ', ')"
exit 1
