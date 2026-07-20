# Builds config/jvm/cacerts-with-avast — Java default truststore + local AV HTTPS MITM root.
# Needed when Avast/AVG (or similar) SSL scanning breaks Google/Facebook OAuth (PKIX errors).
# Machine-specific — do not commit the generated file.

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$destDir = Join-Path $root "config\jvm"
$destCacerts = Join-Path $destDir "cacerts-with-avast"

$javaHome = (java -XshowSettings:properties -version 2>&1 | Select-String "^\s*java\.home\s*=").ToString()
$javaHome = ($javaHome -split "=", 2)[1].Trim()
$keytool = Join-Path $javaHome "bin\keytool.exe"
$srcCacerts = Join-Path $javaHome "lib\security\cacerts"

if (-not (Test-Path $keytool)) { throw "keytool not found under $javaHome" }
if (-not (Test-Path $srcCacerts)) { throw "cacerts not found under $javaHome" }

New-Item -ItemType Directory -Force -Path $destDir | Out-Null
Copy-Item -Force $srcCacerts $destCacerts

$cerPath = Join-Path $env:TEMP "sv-avast-web-shield-root.cer"
$hostName = "oauth2.googleapis.com"
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
