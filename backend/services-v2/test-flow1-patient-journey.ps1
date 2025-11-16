# Flow 1: Patient Journey - End-to-End Test Script
# Tests the complete flow from user registration to appointment booking

$ErrorActionPreference = "Stop"

# Service URLs
$IDENTITY_URL = "http://localhost:3001"
$PATIENT_URL = "http://localhost:3003"
$PROVIDER_URL = "http://localhost:3002"
$APPOINTMENTS_URL = "http://localhost:3004"

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "Flow 1: Patient Journey - End-to-End Test" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# Generate unique test data
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testEmail = "patient.test.$timestamp@hospital.com"
$testPhone = "0901234567"
# Generate valid CMND/CCCD (9-12 digits) - using 12 digits
$randomSuffix = Get-Random -Minimum 100000 -Maximum 999999
$testCitizenId = "079200$randomSuffix"

Write-Host "Test Data:" -ForegroundColor Yellow
Write-Host "  Email: $testEmail" -ForegroundColor White
Write-Host "  Phone: $testPhone" -ForegroundColor White
Write-Host "  Citizen ID: $testCitizenId" -ForegroundColor White
Write-Host ""

# ============================================
# STEP 1: User Registration (Identity Service)
# ============================================
Write-Host "Step 1: User Registration (Identity Service)" -ForegroundColor Green
Write-Host "Endpoint: POST $IDENTITY_URL/api/auth/register" -ForegroundColor Gray

$registerPayload = @{
    email = $testEmail
    password = "Test@123456"
    fullName = "Nguyen Van Test $timestamp"
    phoneNumber = $testPhone
    citizenId = $testCitizenId
    dateOfBirth = "1990-01-15"
    gender = "male"
    address = @{
        street = "123 Nguyen Hue"
        ward = "Phuong Ben Nghe"
        district = "Quan 1"
        city = "Ho Chi Minh"
        country = "Vietnam"
    }
} | ConvertTo-Json -Depth 10

try {
    $registerResponse = Invoke-RestMethod -Uri "$IDENTITY_URL/api/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $registerPayload
    
    Write-Host "✓ User registered successfully!" -ForegroundColor Green
    Write-Host "  User ID: $($registerResponse.userId)" -ForegroundColor White
    Write-Host "  Email Verification Required: $($registerResponse.requiresEmailVerification)" -ForegroundColor White
    Write-Host ""
    
    $userId = $registerResponse.userId
    
} catch {
    Write-Host "✗ Registration failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# Wait for event processing
Write-Host "Waiting 3 seconds for event processing..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# ============================================
# STEP 2: Verify Patient Profile Creation
# ============================================
Write-Host "Step 2: Verify Patient Profile Creation (Patient Registry)" -ForegroundColor Green
Write-Host "Endpoint: GET $PATIENT_URL/api/v1/patients/user/$userId" -ForegroundColor Gray

try {
    # Try to get patient profile (may need to retry if event hasn't been processed yet)
    $maxRetries = 5
    $retryCount = 0
    $patientFound = $false
    
    while (-not $patientFound -and $retryCount -lt $maxRetries) {
        try {
            $patientResponse = Invoke-RestMethod -Uri "$PATIENT_URL/api/v1/patients/user/$userId" `
                -Method Get `
                -ContentType "application/json"
            
            $patientFound = $true
            Write-Host "✓ Patient profile created successfully!" -ForegroundColor Green
            Write-Host "  Patient ID: $($patientResponse.data.patientId)" -ForegroundColor White
            Write-Host "  Full Name: $($patientResponse.data.personalInfo.fullName)" -ForegroundColor White
            Write-Host "  Status: $($patientResponse.data.isActive)" -ForegroundColor White
            Write-Host ""
            
            $patientId = $patientResponse.data.patientId
            
        } catch {
            $retryCount++
            if ($retryCount -lt $maxRetries) {
                Write-Host "Patient not found yet, retrying ($retryCount/$maxRetries)..." -ForegroundColor Yellow
                Start-Sleep -Seconds 2
            } else {
                throw
            }
        }
    }
    
} catch {
    Write-Host "✗ Failed to get patient profile!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host "Note: Patient profile might not have been created by event consumer yet" -ForegroundColor Yellow
    exit 1
}

# ============================================
# STEP 3: Find Available Doctors
# ============================================
Write-Host "Step 3: Find Available Doctors (Provider Staff Service)" -ForegroundColor Green
Write-Host "Endpoint: GET $PROVIDER_URL/api/staff?isActive=true&limit=5" -ForegroundColor Gray

try {
    $staffResponse = Invoke-RestMethod -Uri "$PROVIDER_URL/api/staff?isActive=true&limit=5" `
        -Method Get `
        -ContentType "application/json"
    
    Write-Host "✓ Found $($staffResponse.data.total) staff members" -ForegroundColor Green
    
    if ($staffResponse.data.staff.Count -gt 0) {
        $doctor = $staffResponse.data.staff[0]
        Write-Host "  Selected Doctor:" -ForegroundColor White
        Write-Host "    Staff ID: $($doctor.staffId)" -ForegroundColor White
        Write-Host "    Name: $($doctor.personalInfo.fullName)" -ForegroundColor White
        Write-Host "    Type: $($doctor.staffType)" -ForegroundColor White
        Write-Host ""
        
        $providerId = $doctor.staffId
    } else {
        Write-Host "⚠ No doctors available for booking!" -ForegroundColor Yellow
        Write-Host "Please create staff members first" -ForegroundColor Yellow
        exit 1
    }
    
} catch {
    Write-Host "✗ Failed to get staff list!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# ============================================
# STEP 4: Book Appointment
# ============================================
Write-Host "Step 4: Book Appointment (Appointments Service)" -ForegroundColor Green

# Calculate appointment time (tomorrow at 10:00 AM)
$tomorrow = (Get-Date).AddDays(1)
$appointmentDate = Get-Date $tomorrow -Hour 10 -Minute 0 -Second 0 -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
$appointmentEndTime = Get-Date $tomorrow -Hour 10 -Minute 30 -Second 0 -Format "yyyy-MM-ddTHH:mm:ss.fffZ"

Write-Host "Endpoint: POST $APPOINTMENTS_URL/api/appointments" -ForegroundColor Gray

$appointmentPayload = @{
    patientId = $patientId
    providerId = $providerId
    scheduledStartTime = $appointmentDate
    scheduledEndTime = $appointmentEndTime
    appointmentType = "CONSULTATION"
    reason = "General checkup - Test Flow 1"
    notes = "Automated test appointment"
} | ConvertTo-Json -Depth 10

try {
    $appointmentResponse = Invoke-RestMethod -Uri "$APPOINTMENTS_URL/api/appointments" `
        -Method Post `
        -ContentType "application/json" `
        -Body $appointmentPayload
    
    Write-Host "✓ Appointment booked successfully!" -ForegroundColor Green
    Write-Host "  Appointment ID: $($appointmentResponse.data.appointmentId)" -ForegroundColor White
    Write-Host "  Status: $($appointmentResponse.data.status)" -ForegroundColor White
    Write-Host "  Scheduled Time: $appointmentDate" -ForegroundColor White
    Write-Host ""
    
    $appointmentId = $appointmentResponse.data.appointmentId
    
} catch {
    Write-Host "✗ Appointment booking failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# ============================================
# SUMMARY
# ============================================
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "Flow 1 Test Summary" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ All steps completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Created Resources:" -ForegroundColor Yellow
Write-Host "  User ID: $userId" -ForegroundColor White
Write-Host "  Patient ID: $patientId" -ForegroundColor White
Write-Host "  Provider ID: $providerId" -ForegroundColor White
Write-Host "  Appointment ID: $appointmentId" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Verify data in Supabase database" -ForegroundColor White
Write-Host "  2. Check RabbitMQ for published events" -ForegroundColor White
Write-Host "  3. Review service logs for event processing" -ForegroundColor White
Write-Host ""

# Save test results
$testResults = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    userId = $userId
    patientId = $patientId
    providerId = $providerId
    appointmentId = $appointmentId
    email = $testEmail
    phone = $testPhone
    citizenId = $testCitizenId
} | ConvertTo-Json -Depth 10

$testResults | Out-File -FilePath "flow1-test-results-$timestamp.json" -Encoding UTF8
Write-Host "Test results saved to: flow1-test-results-$timestamp.json" -ForegroundColor Gray
Write-Host ""