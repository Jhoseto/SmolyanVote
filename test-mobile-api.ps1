# Test Script за Mobile API Endpoints
# Тества JWT Authentication endpoints

$baseUrl = "http://localhost:2662"
$testEmail = "krupek@smolyanvote.com"
$testPassword = "Krupek2025"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Mobile API Endpoints" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if server is running
Write-Host "Test 1: Checking server health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "$baseUrl/actuator/health" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Server is running (Status: $($healthResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "✗ Server is not running or not accessible" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start the application with: ./gradlew bootRun" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 2: Login endpoint
Write-Host "Test 2: Testing Login Endpoint..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "  Access Token: $($loginResponse.accessToken.Substring(0, 50))..." -ForegroundColor Gray
    Write-Host "  Refresh Token: $($loginResponse.refreshToken.Substring(0, 50))..." -ForegroundColor Gray
    Write-Host "  User: $($loginResponse.user.username) ($($loginResponse.user.fullName))" -ForegroundColor Gray
    
    $accessToken = $loginResponse.accessToken
    $refreshToken = $loginResponse.refreshToken
    
} catch {
    Write-Host "✗ Login failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}
Write-Host ""

# Test 3: Test protected endpoint with JWT token
Write-Host "Test 3: Testing Protected Endpoint (with JWT)..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

try {
    # Тестваме messenger conversations endpoint
    $conversationsResponse = Invoke-RestMethod -Uri "$baseUrl/api/svmessenger/conversations" -Method GET -Headers $headers -ErrorAction Stop
    Write-Host "✓ Protected endpoint accessible with JWT token" -ForegroundColor Green
    Write-Host "  Conversations count: $($conversationsResponse.Count)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Protected endpoint failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 4: Refresh token endpoint
Write-Host "Test 4: Testing Refresh Token Endpoint..." -ForegroundColor Yellow
$refreshBody = @{
    refreshToken = $refreshToken
} | ConvertTo-Json

try {
    $refreshResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/auth/refresh" -Method POST -Body $refreshBody -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "✓ Token refresh successful!" -ForegroundColor Green
    Write-Host "  New Access Token: $($refreshResponse.accessToken.Substring(0, 50))..." -ForegroundColor Gray
    
    $newAccessToken = $refreshResponse.accessToken
    
} catch {
    Write-Host "✗ Token refresh failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: Test with new access token
Write-Host "Test 5: Testing Protected Endpoint (with refreshed token)..." -ForegroundColor Yellow
$newHeaders = @{
    "Authorization" = "Bearer $newAccessToken"
}

try {
    $conversationsResponse2 = Invoke-RestMethod -Uri "$baseUrl/api/svmessenger/conversations" -Method GET -Headers $newHeaders -ErrorAction Stop
    Write-Host "✓ Protected endpoint accessible with refreshed token" -ForegroundColor Green
} catch {
    Write-Host "✗ Protected endpoint failed with refreshed token" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Logout endpoint
Write-Host "Test 6: Testing Logout Endpoint..." -ForegroundColor Yellow
try {
    $logoutResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/auth/logout" -Method POST -Headers $newHeaders -ContentType "application/json" -ErrorAction Stop
    Write-Host "✓ Logout successful!" -ForegroundColor Green
    Write-Host "  Response: $($logoutResponse | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Logout failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All Tests Completed!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

