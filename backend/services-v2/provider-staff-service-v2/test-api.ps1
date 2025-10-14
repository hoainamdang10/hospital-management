# Test Provider Staff Service API

Write-Host "Testing Provider Staff Service API..." -ForegroundColor Green

# Test 1: Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3003/health" -Method GET
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# Test 2: Register Staff
Write-Host "`n2. Testing Register Staff..." -ForegroundColor Yellow
try {
    $body = @{
        fullName = "Dr. Nguyen Van A"
        citizenId = "001234567890"
        phoneNumber = "0901234567"
        email = "nguyenvana@hospital.com"
        licenseNumber = "BS-12345"
        specialization = "Cardiology"
        yearsOfExperience = 10
        staffType = "doctor"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "http://localhost:3003/api/staff" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Cyan
    
    # Extract staffId from response
    $result = $response.Content | ConvertFrom-Json
    $staffId = $result.staffId
    Write-Host "Created Staff ID: $staffId" -ForegroundColor Magenta

    # Test 3: Get Staff Profile
    if ($staffId) {
        Write-Host "`n3. Testing Get Staff Profile..." -ForegroundColor Yellow
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3003/api/staff/$staffId" -Method GET
            Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "Response: $($response.Content)" -ForegroundColor Cyan
        } catch {
            Write-Host "Error: $_" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`nTests completed!" -ForegroundColor Green

