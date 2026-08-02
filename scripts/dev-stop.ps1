# Stops SmolyanVote local dev processes by listening port.
param(
    [string]$PortList = "2662,3000,3099"
)

$ErrorActionPreference = "SilentlyContinue"

$Ports = @($PortList -split ',' | ForEach-Object { [int]$_.Trim() } | Where-Object { $_ -gt 0 })

function Stop-PortListeners {
    param([int]$Port)
    $seen = @{}
    netstat -ano | Select-String "LISTENING" | Select-String ":$Port\s" | ForEach-Object {
        if ($_ -match '\s(\d+)\s*$') {
            $procId = [int]$matches[1]
            if ($procId -gt 0 -and -not $seen.ContainsKey($procId)) {
                $seen[$procId] = $true
                Write-Host "  - Port $Port : stopping PID $procId"
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

foreach ($port in $Ports) {
    Stop-PortListeners -Port $port
}

Start-Sleep -Seconds 1
