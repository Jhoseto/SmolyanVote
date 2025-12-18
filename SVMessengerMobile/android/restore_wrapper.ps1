$sourceJar = "..\node_modules\react-native\template\android\gradle\wrapper\gradle-wrapper.jar"
$sourceProps = "..\node_modules\react-native\template\android\gradle\wrapper\gradle-wrapper.properties"
$destDir = "gradle\wrapper"

if (!(Test-Path $destDir)) {
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    Write-Host "Created directory $destDir"
}

if (Test-Path $sourceJar) {
    Copy-Item -Path $sourceJar -Destination "$destDir\gradle-wrapper.jar" -Force
    Write-Host "Restored gradle-wrapper.jar"
} else {
    Write-Host "Error: Could not find source jar at $sourceJar"
}

if (Test-Path $sourceProps) {
    Copy-Item -Path $sourceProps -Destination "$destDir\gradle-wrapper.properties" -Force
    Write-Host "Restored gradle-wrapper.properties"
} else {
    Write-Host "Error: Could not find source properties at $sourceProps"
}
