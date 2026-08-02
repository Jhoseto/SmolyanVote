# Waits until a TCP port accepts connections.
param(
    [Parameter(Mandatory = $true)][int]$Port,
    [int]$TimeoutSec = 90,
    [int]$IntervalSec = 1
)

$deadline = (Get-Date).AddSeconds($TimeoutSec)

while ((Get-Date) -lt $deadline) {
    try {
        $client = New-Object Net.Sockets.TcpClient
        $client.Connect("127.0.0.1", $Port)
        $client.Close()
        exit 0
    } catch {
        Start-Sleep -Seconds $IntervalSec
    }
}

Write-Host "  WARNING: Port $Port not listening within ${TimeoutSec}s"
exit 1
