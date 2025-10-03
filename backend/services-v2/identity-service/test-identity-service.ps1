# IDENTITY SERVICE - COMPREHENSIVE TEST SCRIPT
# Test all endpoints with curl commands

Write-Host " IDENTITY SERVICE - TEST SUITE" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$BASE_URL = "http://localhost:3021"
$TEST_EMAIL = "testuser_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$TEST_PASSWORD = "TestPassword123!"

Write-Host " Test Configuration:" -ForegroundColor Yellow
Write-Host "  Base URL: $BASE_URL"
Write-Host "  Test Email: $TEST_EMAIL"
Write-Host "  Test Password: $TEST_PASSWORD"
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Green
Write-Host "-------------------"
$response = Invoke-RestMethod -Uri "$BASE_URL/health" -Method Get -ErrorAction SilentlyContinue
if ($response) {
    Write-Host " Health check passed" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} else {
    Write-Host " Health check failed" -ForegroundColor Red
}
Write-Host ""

# Test 2: User Registration
Write-Host "Test 2: User Registration" -ForegroundColor Green
Write-Host "------------------------"
$registerBody = @{
    email = $TEST_EMAIL
    password = $TEST_PASSWORD
    fullName = "Test User"
    roleType = "patient"
    phoneNumber = "0123456789"
    dateOfBirth = "1990-01-01"
    gender = "male"
    address = "123 Test Street, Hanoi"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host " Registration successful" -ForegroundColor Green
    $registerResponse | ConvertTo-Json -Depth 3
    $userId = $registerResponse.userId
} catch {
    Write-Host " Registration failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: User Login
Write-Host "Test 3: User Login" -ForegroundColor Green
Write-Host "-----------------"
$loginBody = @{
    email = $TEST_EMAIL
    password = $TEST_PASSWORD
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host " Login successful" -ForegroundColor Green
    $loginResponse | ConvertTo-Json -Depth 3
    $accessToken = $loginResponse.accessToken
    $sessionToken = $loginResponse.sessionToken
} catch {
    Write-Host " Login failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Forgot Password
Write-Host "Test 4: Forgot Password" -ForegroundColor Green
Write-Host "----------------------"
$forgotBody = @{
    email = $TEST_EMAIL
} | ConvertTo-Json

try {
    $forgotResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/forgot-password" -Method Post -Body $forgotBody -ContentType "application/json"
    Write-Host " Forgot password request successful" -ForegroundColor Green
    $forgotResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host " Forgot password failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Logout
Write-Host "Test 5: User Logout" -ForegroundColor Green
Write-Host "------------------"
$logoutBody = @{
    userId = $userId
    sessionId = $sessionToken
} | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }
    $logoutResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/logout" -Method Post -Body $logoutBody -ContentType "application/json" -Headers $headers
    Write-Host " Logout successful" -ForegroundColor Green
    $logoutResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host " Logout failed: $_" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "=================================" -ForegroundColor Cyan
Write-Host " TEST SUITE COMPLETE" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " Test Summary:" -ForegroundColor Yellow
Write-Host "  Test Email: $TEST_EMAIL"
Write-Host "  User ID: $userId"
Write-Host ""
Write-Host " Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Check database for new user"
Write-Host "  2. Verify email sent (check Supabase logs)"
Write-Host "  3. Test password reset flow"
Write-Host "  4. Test email verification"
Write-Host ""
