# Builds config/jvm/cacerts-with-avast — Java default truststore + local AV HTTPS MITM root.
# Needed when Avast/AVG (or similar) SSL scanning breaks Google/Facebook OAuth (PKIX errors).
# Machine-specific — do not commit the generated file.

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$destDir = Join-Path $root "config\jvm"
$destCacerts = Join-Path $destDir "cacerts-with-avast"

if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME "bin\keytool.exe"))) {
    $javaHome = $env:JAVA_HOME
} else {
    $candidates = @(
        "C:\Program Files\Java\jdk-17",
        "C:\Program Files\Eclipse Adoptium\jdk-17*",
        "C:\Program Files\Microsoft\jdk-17*"
    )
    $javaHome = $null
    foreach ($pattern in $candidates) {
        $hit = Get-Item $pattern -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($hit -and (Test-Path (Join-Path $hit.FullName "bin\keytool.exe"))) {
            $javaHome = $hit.FullName
            break
        }
    }
    if (-not $javaHome) {
        $javaExe = (Get-Command java -ErrorAction Stop).Source
        $javaHome = Split-Path (Split-Path $javaExe -Parent) -Parent
    }
}
$keytool = Join-Path $javaHome "bin\keytool.exe"
$srcCacerts = Join-Path $javaHome "lib\security\cacerts"

if (-not (Test-Path $keytool)) { throw "keytool not found under $javaHome" }
if (-not (Test-Path $srcCacerts)) { throw "cacerts not found under $javaHome" }

New-Item -ItemType Directory -Force -Path $destDir | Out-Null
Copy-Item -Force $srcCacerts $destCacerts

$cerPath = Join-Path $env:TEMP "sv-avast-web-shield-root.cer"
# Use a site the monitor actually calls — oauth2 alone can miss the current Avast root.
$hostName = "sigma.midt.bg"
$tcp = New-Object System.Net.Sockets.TcpClient($hostName, 443)
$ssl = New-Object System.Net.Security.SslStream($tcp.GetStream(), $false, ({ $true }))
$ssl.AuthenticateAsClient($hostName)
$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($ssl.RemoteCertificate)
$chain = New-Object System.Security.Cryptography.X509Certificates.X509Chain
$chain.ChainPolicy.RevocationMode = [System.Security.Cryptography.X509Certificates.X509RevocationMode]::NoCheck
[void]$chain.Build($cert)
$rootCert = $chain.ChainElements[$chain.ChainElements.Count - 1].Certificate
[IO.File]::WriteAllBytes($cerPath, $rootCert.Export([Security.Cryptography.X509Certificates.X509ContentType]::Cert))
$ssl.Close(); $tcp.Close()

Write-Host "Detected HTTPS interceptor root: $($rootCert.Subject)"

& $keytool -delete -alias avast-web-shield -keystore $destCacerts -storepass changeit 2>$null | Out-Null
& $keytool -importcert -noprompt -alias avast-web-shield -keystore $destCacerts -storepass changeit -file $cerPath | Out-Host

Write-Host "Wrote $destCacerts"
Write-Host "bootRun / restart.bat will pick this up automatically."
