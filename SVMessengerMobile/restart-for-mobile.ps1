# ============================================
# SVMessenger Mobile - Restart for Physical Device
# Restarts Metro and Android app for PHYSICAL DEVICE (not emulator)
# Изтрива всички APK и кешове преди rebuild
# ============================================

# Find npm and node in PATH or common installation locations
Write-Host "Checking for Node.js and npm..." -ForegroundColor Cyan

# First, try to find in PATH
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
$npmPath = (Get-Command npm -ErrorAction SilentlyContinue).Source

# If not found, search in common locations
if (-not $nodePath) {
    Write-Host "Node.js not in PATH, searching common locations..." -ForegroundColor Yellow
    
    $commonPaths = @(
        "$env:ProgramFiles\nodejs",
        "${env:ProgramFiles(x86)}\nodejs",
        "$env:LOCALAPPDATA\Programs\nodejs",
        "$env:USERPROFILE\AppData\Local\Programs\nodejs",
        "$env:APPDATA\npm"
    )
    
    # Check for nvm-windows
    $nvmPath = "$env:USERPROFILE\AppData\Roaming\nvm"
    if (Test-Path $nvmPath) {
        $nvmCurrent = Join-Path $nvmPath "current"
        if (Test-Path $nvmCurrent) {
            $commonPaths = @($nvmCurrent) + $commonPaths
        }
    }
    
    foreach ($path in $commonPaths) {
        if ($path -and (Test-Path $path)) {
            $testNodePath = Join-Path $path "node.exe"
            if (Test-Path $testNodePath) {
                $nodePath = $testNodePath
                Write-Host "Found Node.js at: $nodePath" -ForegroundColor Green
                
                # Add to PATH for this session
                if ($env:Path -notlike "*$path*") {
                    $env:Path = "$path;$env:Path"
                    Write-Host "Added to PATH: $path" -ForegroundColor Gray
                }
                break
            }
        }
    }
}

# If still not found, try to find npm.cmd
if (-not $npmPath) {
    $npmPath = (Get-Command npm -ErrorAction SilentlyContinue).Source
    
    if (-not $npmPath) {
        # Try to find npm.cmd in nodejs directory
        if ($nodePath) {
            $nodeDir = Split-Path $nodePath
            $npmCmdPath = Join-Path $nodeDir "npm.cmd"
            if (Test-Path $npmCmdPath) {
                $npmPath = $npmCmdPath
            }
        }
        
        # Also check for local node_modules/.bin
        $localNodeBin = Join-Path $PSScriptRoot "node_modules\.bin"
        if (Test-Path $localNodeBin) {
            if ($env:Path -notlike "*$localNodeBin*") {
                $env:Path = "$localNodeBin;$env:Path"
            }
        }
    }
}

# Final check
if (-not $nodePath) {
    Write-Host "" -ForegroundColor Red
    Write-Host "ERROR: Node.js not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Or run: .\add-node-to-path.bat if already installed" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

if (-not $npmPath) {
    Write-Host "WARNING: npm not found, but continuing..." -ForegroundColor Yellow
    Write-Host "Node.js found at: $nodePath" -ForegroundColor Green
} else {
    Write-Host "Node.js found: $nodePath" -ForegroundColor Green
    Write-Host "npm found: $npmPath" -ForegroundColor Green
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESTART FOR PHYSICAL DEVICE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "  1. Stop Metro processes" -ForegroundColor Gray
Write-Host "  2. Delete ALL APK files" -ForegroundColor Gray
Write-Host "  3. Clear Metro cache" -ForegroundColor Gray
Write-Host "  4. Clear Android build cache" -ForegroundColor Gray
Write-Host "  5. Clear Gradle cache" -ForegroundColor Gray
Write-Host "  6. Uninstall old app from device" -ForegroundColor Gray
Write-Host "  7. Start Metro with clean cache" -ForegroundColor Gray
Write-Host "  8. Build and install on device" -ForegroundColor Gray
Write-Host ""

# Step 1: Stop all Metro processes
Write-Host "Step 1: Stopping Metro processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { 
    $_.Path -like "*node.exe*" 
}

if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "Metro processes stopped" -ForegroundColor Green
} else {
    Write-Host "No Metro processes running" -ForegroundColor Gray
}
Write-Host ""

# Step 2: Delete ALL APK files
Write-Host "Step 2: Deleting ALL APK files..." -ForegroundColor Yellow
$apkPaths = @(
    "$PSScriptRoot\android\app\build\outputs\apk",
    "$PSScriptRoot\android\app\build\outputs\bundle"
)

$apkCount = 0
foreach ($apkPath in $apkPaths) {
    if (Test-Path $apkPath) {
        $apkFiles = Get-ChildItem -Path $apkPath -Filter "*.apk" -Recurse -ErrorAction SilentlyContinue
        foreach ($apkFile in $apkFiles) {
            Remove-Item -Path $apkFile.FullName -Force -ErrorAction SilentlyContinue
            $apkCount++
            Write-Host "  Deleted: $($apkFile.Name)" -ForegroundColor Gray
        }
    }
}

# Also check for AAB files
foreach ($apkPath in $apkPaths) {
    if (Test-Path $apkPath) {
        $aabFiles = Get-ChildItem -Path $apkPath -Filter "*.aab" -Recurse -ErrorAction SilentlyContinue
        foreach ($aabFile in $aabFiles) {
            Remove-Item -Path $aabFile.FullName -Force -ErrorAction SilentlyContinue
            $apkCount++
            Write-Host "  Deleted: $($aabFile.Name)" -ForegroundColor Gray
        }
    }
}

if ($apkCount -gt 0) {
    Write-Host "Deleted $apkCount APK/AAB file(s)" -ForegroundColor Green
} else {
    Write-Host "No APK files found to delete" -ForegroundColor Gray
}
Write-Host ""

# Step 3: Clear Metro cache and build artifacts
Write-Host "Step 3: Clearing Metro cache..." -ForegroundColor Yellow

# Clear Metro cache
$cachePaths = @(
    "$PSScriptRoot\node_modules\.cache",
    "$PSScriptRoot\.metro"
)

foreach ($cachePath in $cachePaths) {
    if (Test-Path $cachePath) {
        Remove-Item -Path $cachePath -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Clear old bundle files
$bundlePath = "$PSScriptRoot\android\app\src\main\assets\index.android.bundle"
if (Test-Path $bundlePath) {
    Remove-Item -Path $bundlePath -Force -ErrorAction SilentlyContinue
    Write-Host "Old bundle file removed" -ForegroundColor Gray
}

# Clear TEMP cache
Get-ChildItem -Path $env:TEMP -Filter "metro-*" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path $env:TEMP -Filter "react-*" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path $env:TEMP -Filter "haste-map-*" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Metro cache cleared" -ForegroundColor Green
Write-Host ""

# Step 4: Clear Android build cache
Write-Host "Step 4: Clearing Android build cache..." -ForegroundColor Yellow
$androidCachePaths = @(
    "$PSScriptRoot\android\app\build",
    "$PSScriptRoot\android\build",
    "$PSScriptRoot\android\.gradle"
)

foreach ($cachePath in $androidCachePaths) {
    if (Test-Path $cachePath) {
        Remove-Item -Path $cachePath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  Deleted: $cachePath" -ForegroundColor Gray
    }
}
Write-Host "Android build cache cleared" -ForegroundColor Green
Write-Host ""

# Step 5: Run Gradle clean
Write-Host "Step 5: Running Gradle clean..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\android"
try {
    if (Test-Path "gradlew.bat") {
        .\gradlew.bat clean 2>&1 | Out-Null
        Write-Host "Gradle clean completed" -ForegroundColor Green
    } else {
        Write-Host "Gradle wrapper not found, skipping..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Gradle clean skipped (not critical)" -ForegroundColor Yellow
}
Set-Location $PSScriptRoot
Write-Host ""

# Step 6: Uninstall old app from device
Write-Host "Step 6: Uninstalling old app from device..." -ForegroundColor Yellow
$adbCheck = Get-Command adb -ErrorAction SilentlyContinue
if ($adbCheck) {
    try {
        $devices = adb devices 2>&1 | Select-String "device$"
        if ($devices) {
            Write-Host "Found device, uninstalling old app..." -ForegroundColor Gray
            adb uninstall com.svmessengermobile 2>&1 | Out-Null
            Write-Host "Old app uninstalled (if it existed)" -ForegroundColor Green
        } else {
            Write-Host "WARNING: No devices found!" -ForegroundColor Yellow
            Write-Host "  Make sure your phone is connected via USB with USB debugging enabled" -ForegroundColor Gray
        }
    } catch {
        Write-Host "Could not uninstall (not critical)" -ForegroundColor Yellow
    }
} else {
    Write-Host "ADB not found in PATH, skipping uninstall..." -ForegroundColor Yellow
}
Write-Host ""

# Step 7: Start Metro in new window
Write-Host "Step 7: Starting Metro Bundler..." -ForegroundColor Yellow

# Build PATH for Metro window
$metroPath = $env:Path
if ($nodePath) {
    $nodeDir = Split-Path $nodePath
    if ($metroPath -notlike "*$nodeDir*") {
        $metroPath = "$nodeDir;$metroPath"
    }
}

$metroCommand = "cd '$PSScriptRoot'; `$env:Path = '$metroPath'; Write-Host 'Metro Bundler Starting...' -ForegroundColor Green; Write-Host ''; npm start -- --reset-cache"
$metroWindow = Start-Process powershell -ArgumentList "-NoExit", "-Command", $metroCommand -PassThru
Write-Host "Metro started in new window (PID: $($metroWindow.Id))" -ForegroundColor Green

# Step 8: Wait for Metro to start
Write-Host ""
Write-Host "Waiting for Metro to start (10 seconds)..." -ForegroundColor Yellow
for ($i = 10; $i -gt 0; $i--) {
    Write-Host "   $i..." -ForegroundColor Gray -NoNewline
    Start-Sleep -Seconds 1
    Write-Host "`r" -NoNewline
}
Write-Host "   Ready!    " -ForegroundColor Green

# Step 9: Check if Metro is running
Write-Host ""
Write-Host "Checking if Metro is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/status" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "Metro is running on port 8081" -ForegroundColor Green
} catch {
    Write-Host "Metro may not be ready yet, but continuing..." -ForegroundColor Yellow
}

# Step 10: Setup Android SDK and Java (same as restart.ps1)
Write-Host ""
Write-Host "Setting up Android SDK and Java..." -ForegroundColor Yellow

Set-Location $PSScriptRoot

# Ensure PATH includes Node.js for this session
if ($nodePath) {
    $nodeDir = Split-Path $nodePath
    if ($env:Path -notlike "*$nodeDir*") {
        $env:Path = "$nodeDir;$env:Path"
    }
}

# Also try to refresh from environment
$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')
if ($nodePath) {
    $nodeDir = Split-Path $nodePath
    if ($env:Path -notlike "*$nodeDir*") {
        $env:Path = "$nodeDir;$env:Path"
    }
}

# Add Android SDK to PATH if needed
$androidSdkPaths = @(
    "$env:ANDROID_HOME",
    "$env:ANDROID_SDK_ROOT",
    "D:\Android\Sdk",
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk"
)

# Check local.properties for SDK location
$localPropsPath = Join-Path $PSScriptRoot "android\local.properties"
if (Test-Path $localPropsPath) {
    $localProps = Get-Content $localPropsPath -Raw
    if ($localProps -match 'sdk\.dir=(.+)') {
        $sdkDir = $matches[1].Trim()
        $androidSdkPaths = @($sdkDir) + $androidSdkPaths
    }
}

foreach ($sdkPath in $androidSdkPaths) {
    if ($sdkPath -and (Test-Path $sdkPath)) {
        $platformTools = Join-Path $sdkPath "platform-tools"
        $tools = Join-Path $sdkPath "tools"
        $toolsBin = Join-Path $sdkPath "tools\bin"
        
        if (Test-Path $platformTools) {
            if ($env:Path -notlike "*$platformTools*") {
                $env:Path = "$platformTools;$env:Path"
                Write-Host "Added Android platform-tools to PATH" -ForegroundColor Gray
            }
        }
        if (Test-Path $toolsBin) {
            if ($env:Path -notlike "*$toolsBin*") {
                $env:Path = "$toolsBin;$env:Path"
            }
        }
        if (Test-Path $tools) {
            if ($env:Path -notlike "*$tools*") {
                $env:Path = "$tools;$env:Path"
            }
        }
        
        # Set ANDROID_HOME if not set
        if (-not $env:ANDROID_HOME) {
            $env:ANDROID_HOME = $sdkPath
            $env:ANDROID_SDK_ROOT = $sdkPath
        }
        break
    }
}

# Find and set JAVA_HOME if not set
if (-not $env:JAVA_HOME) {
    Write-Host "Searching for Java JDK..." -ForegroundColor Yellow
    
    $javaPaths = @(
        "$env:JAVA_HOME",
        "$env:JDK_HOME",
        "C:\Program Files\Android\Android Studio\jbr",
        "C:\Program Files\Android\Android Studio\jre",
        "$env:LOCALAPPDATA\Android\Android Studio\jbr",
        "$env:PROGRAMFILES\Android\Android Studio\jbr"
    )
    
    # Search in Program Files for JDK
    $programFilesJava = Get-ChildItem -Path "$env:ProgramFiles\Java" -ErrorAction SilentlyContinue | Where-Object { 
        $_.Name -like "jdk*" -or $_.Name -like "jbr*"
    } | Sort-Object Name -Descending | Select-Object -First 1
    
    if ($programFilesJava) {
        $javaPaths = @($programFilesJava.FullName) + $javaPaths
    }
    
    # Search in Program Files (x86)
    $programFilesX86Java = Get-ChildItem -Path "${env:ProgramFiles(x86)}\Java" -ErrorAction SilentlyContinue | Where-Object { 
        $_.Name -like "jdk*" -or $_.Name -like "jbr*"
    } | Sort-Object Name -Descending | Select-Object -First 1
    
    if ($programFilesX86Java) {
        $javaPaths = @($programFilesX86Java.FullName) + $javaPaths
    }
    
    # Try to find java.exe in PATH first
    $javaExe = (Get-Command java -ErrorAction SilentlyContinue).Source
    if ($javaExe) {
        $javaDir = Split-Path (Split-Path $javaExe)
        $javaPaths = @($javaDir) + $javaPaths
    }
    
    $foundJava = $null
    foreach ($javaPath in $javaPaths) {
        if ($javaPath -and (Test-Path $javaPath)) {
            $javaExePath = Join-Path $javaPath "bin\java.exe"
            if (Test-Path $javaExePath) {
                $foundJava = $javaPath
                Write-Host "Found Java at: $foundJava" -ForegroundColor Green
                $env:JAVA_HOME = $foundJava
                $env:JDK_HOME = $foundJava
                
                # Add to PATH
                $javaBin = Join-Path $foundJava "bin"
                if ($env:Path -notlike "*$javaBin*") {
                    $env:Path = "$javaBin;$env:Path"
                    Write-Host "Added Java bin to PATH" -ForegroundColor Gray
                }
                break
            }
        }
    }
    
    if (-not $foundJava) {
        Write-Host "WARNING: Java JDK not found!" -ForegroundColor Yellow
        Write-Host "  Android Studio usually includes Java (JBR)" -ForegroundColor Gray
        Write-Host "  Or install JDK 17+ from: https://adoptium.net/" -ForegroundColor Gray
        Write-Host "  Continuing anyway..." -ForegroundColor Gray
    }
} else {
    Write-Host "JAVA_HOME is set: $env:JAVA_HOME" -ForegroundColor Green
    # Verify it exists
    $javaExePath = Join-Path $env:JAVA_HOME "bin\java.exe"
    if (-not (Test-Path $javaExePath)) {
        Write-Host "WARNING: JAVA_HOME points to invalid location!" -ForegroundColor Yellow
        $env:JAVA_HOME = $null
    } else {
        # Add to PATH if not already there
        $javaBin = Join-Path $env:JAVA_HOME "bin"
        if ($env:Path -notlike "*$javaBin*") {
            $env:Path = "$javaBin;$env:Path"
        }
    }
}

# Check for Android devices
Write-Host ""
Write-Host "Checking for Android devices..." -ForegroundColor Yellow
$adbCheck = Get-Command adb -ErrorAction SilentlyContinue
if ($adbCheck) {
    try {
        $devices = adb devices 2>&1 | Select-String "device$"
        if ($devices) {
            Write-Host "Found Android device(s):" -ForegroundColor Green
            $devices | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        } else {
            Write-Host "WARNING: No Android devices found!" -ForegroundColor Yellow
            Write-Host "  Make sure your phone is connected via USB" -ForegroundColor Gray
            Write-Host "  Enable USB debugging in Developer Options" -ForegroundColor Gray
            Write-Host "  The app will try to start anyway..." -ForegroundColor Gray
        }
    } catch {
        Write-Host "Could not check devices, continuing..." -ForegroundColor Yellow
    }
} else {
    Write-Host "ADB not found in PATH, but continuing..." -ForegroundColor Yellow
}
Write-Host ""

# Step 11: Start Android app
Write-Host "Step 11: Building and installing Android app..." -ForegroundColor Yellow
Write-Host ""

# Verify npm is accessible
$npmCheck = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCheck) {
    Write-Host "WARNING: npm not accessible, trying npx..." -ForegroundColor Yellow
    $npxCheck = Get-Command npx -ErrorAction SilentlyContinue
    if ($npxCheck) {
        Write-Host "Using npx instead of npm" -ForegroundColor Green
        npx react-native run-android
    } else {
        Write-Host "ERROR: Neither npm nor npx is accessible!" -ForegroundColor Red
        Write-Host "Please ensure Node.js is properly installed and in PATH." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "Running: npm run android" -ForegroundColor Cyan
    Write-Host ""
    
    # Run with error handling
    $errorOccurred = $false
    try {
        npm run android
        if ($LASTEXITCODE -ne 0) {
            $errorOccurred = $true
        }
    } catch {
        $errorOccurred = $true
        Write-Host "ERROR: Failed to start Android app" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
    
    if ($errorOccurred) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "Failed to start Android app!" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "  1. Phone not connected or USB debugging not enabled" -ForegroundColor Gray
        Write-Host "     - Connect phone via USB" -ForegroundColor DarkGray
        Write-Host "     - Enable USB debugging in Developer Options" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "  2. Java JDK not found (JAVA_HOME not set)" -ForegroundColor Gray
        Write-Host "     - Android Studio includes Java (JBR)" -ForegroundColor DarkGray
        Write-Host "     - Or install JDK 17+ from: https://adoptium.net/" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "  3. Android SDK not configured" -ForegroundColor Gray
        Write-Host "     - Run: cd android; .\setup-android-sdk.ps1" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "  4. Gradle build failed" -ForegroundColor Gray
        Write-Host "     - Check Android Studio for errors" -ForegroundColor DarkGray
        Write-Host ""
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "SUCCESS! App installed on device!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Tips:" -ForegroundColor Cyan
Write-Host "   - Metro runs in separate window" -ForegroundColor Gray
Write-Host "   - To stop Metro: close window or Ctrl+C" -ForegroundColor Gray
Write-Host "   - To reload: press R twice in app" -ForegroundColor Gray
Write-Host "   - Make sure phone and computer are on same Wi-Fi network" -ForegroundColor Gray
Write-Host ""

