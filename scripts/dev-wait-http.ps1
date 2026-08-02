# Waits for HTTP 2xx from a local health URL (Spring actuator or scraper /health).
param(
    [Parameter(Mandatory = $true)][string]$Url,
    [int]$TimeoutSec = 120,
    [int]$IntervalSec = 2
)

$deadline = (Get-Date).AddSeconds($TimeoutSec)

while ((Get-Date) -lt $deadline) {
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
            exit 0
        }
    } catch {
        # not ready yet
    }
    Start-Sleep -Seconds $IntervalSec
}

Write-Host "  WARNING: $Url did not respond within ${TimeoutSec}s"
exit 1
