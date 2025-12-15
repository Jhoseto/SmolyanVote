# Quick Test Script за Mobile API
# Използвай след като стартираш приложението с: ./gradlew bootRun

$baseUrl = "http://localhost:2662"
$testEmail = "krupek@smolyanvote.com"
$testPassword = "Krupek2025"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Mobile API Quick Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "[1/6] Checking server health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/actuator/health" -Method GET -ErrorAction Stop
    Write-Host "  ✓ Server is running" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Server is not running!" -ForegroundColor Red
    Write-Host "  Please start with: ./gradlew bootRun`n" -ForegroundColor Yellow
    exit 1
}

# Test 2: Login
Write-Host "[2/6] Testing login..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    
    if ($loginResponse.accessToken) {
        Write-Host "  ✓ Login successful" -ForegroundColor Green
        Write-Host "    Token: $($loginResponse.accessToken.Substring(0, 30))..." -ForegroundColor Gray
        Write-Host "    User: $($loginResponse.user.username)" -ForegroundColor Gray
        
        $script:accessToken = $loginResponse.accessToken
        $script:refreshToken = $loginResponse.refreshToken
    } else {
        Write-Host "  ✗ Login failed - no token received" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ✗ Login failed" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "    Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# Test 3: Protected Endpoint
Write-Host "[3/6] Testing protected endpoint..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $script:accessToken"
}

try {
    $conversations = Invoke-RestMethod -Uri "$baseUrl/api/svmessenger/conversations" -Method GET -Headers $headers -ErrorAction Stop
    Write-Host "  ✓ Protected endpoint accessible" -ForegroundColor Green
    Write-Host "    Conversations: $($conversations.Count)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Protected endpoint failed" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Refresh Token
Write-Host "[4/6] Testing token refresh..." -ForegroundColor Yellow
$refreshBody = @{
    refreshToken = $script:refreshToken
} | ConvertTo-Json

try {
    $refreshResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/auth/refresh" -Method POST -Body $refreshBody -ContentType "application/json" -ErrorAction Stop
    
    if ($refreshResponse.accessToken) {
        Write-Host "  ✓ Token refresh successful" -ForegroundColor Green
        $script:newAccessToken = $refreshResponse.accessToken
    } else {
        Write-Host "  ✗ Token refresh failed" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Token refresh failed" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Protected Endpoint with New Token
Write-Host "[5/6] Testing protected endpoint with refreshed token..." -ForegroundColor Yellow
if ($script:newAccessToken) {
    $newHeaders = @{
        "Authorization" = "Bearer $script:newAccessToken"
    }
    
    try {
        $conversations2 = Invoke-RestMethod -Uri "$baseUrl/api/svmessenger/conversations" -Method GET -Headers $newHeaders -ErrorAction Stop
        Write-Host "  ✓ Refreshed token works" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Refreshed token failed" -ForegroundColor Red
    }
}

# Test 6: Logout
Write-Host "[6/6] Testing logout..." -ForegroundColor Yellow
try {
    $logoutResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/auth/logout" -Method POST -Headers $headers -ContentType "application/json" -ErrorAction Stop
    Write-Host "  ✓ Logout successful" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Logout failed" -ForegroundColor Red
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Tests Completed!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

