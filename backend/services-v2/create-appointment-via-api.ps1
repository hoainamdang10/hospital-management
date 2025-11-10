# Script to create appointments via Appointment Service API
# This tests the full flow: API -> Event -> Read Model sync

$ErrorActionPreference = "Stop"

# Configuration
$APPOINTMENT_SERVICE_URL = "http://localhost:3004"
$PATIENT_ID = "PAT-202511-756"
$DOCTOR_ID = "DOC-GEN-202511-955"
$DEPARTMENT_ID = "bcc8cccf-3a92-42f7-ac2b-862b903af062"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CREATE APPOINTMENT VIA API TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Create a new appointment
Write-Host "Test 1: Creating appointment via API..." -ForegroundColor Yellow
Write-Host ""

$appointmentData = @{
    patientId = $PATIENT_ID
    doctorId = $DOCTOR_ID
    departmentId = $DEPARTMENT_ID
    appointmentDate = "2025-11-20"
    appointmentTime = "09:00"
    type = "CONSULTATION"
    reason = "Follow-up diabetes checkup"
    chiefComplaint = "Kiểm tra đường huyết"
    symptoms = @("Mệt mỏi nhẹ")
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Gray
Write-Host $appointmentData -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod `
        -Uri "$APPOINTMENT_SERVICE_URL/api/v1/appointments" `
        -Method Post `
        -ContentType "application/json" `
        -Body $appointmentData `
        -ErrorAction Stop

    Write-Host "✅ SUCCESS: Appointment created!" -ForegroundColor Green
    Write-Host "Appointment ID: $($response.appointmentId)" -ForegroundColor Green
    Write-Host ""
    
    $createdAppointmentId = $response.appointmentId
    
    # Wait for event processing
    Write-Host "⏳ Waiting 2 seconds for event processing..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    
    # Test 2: Verify in Read Model via API V2
    Write-Host ""
    Write-Host "Test 2: Verifying appointment in Read Model (API V2)..." -ForegroundColor Yellow
    Write-Host ""
    
    $readModelResponse = Invoke-RestMethod `
        -Uri "$APPOINTMENT_SERVICE_URL/api/v2/appointments/$createdAppointmentId" `
        -Method Get `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✅ SUCCESS: Appointment found in Read Model!" -ForegroundColor Green
    Write-Host "Details:" -ForegroundColor Cyan
    Write-Host "  - ID: $($readModelResponse.appointmentId)" -ForegroundColor White
    Write-Host "  - Patient: $($readModelResponse.patientFullName)" -ForegroundColor White
    Write-Host "  - Doctor: $($readModelResponse.doctorFullName)" -ForegroundColor White
    Write-Host "  - Date: $($readModelResponse.appointmentDate)" -ForegroundColor White
    Write-Host "  - Time: $($readModelResponse.appointmentTime)" -ForegroundColor White
    Write-Host "  - Status: $($readModelResponse.status)" -ForegroundColor White
    Write-Host ""
    
    # Test 3: List patient appointments
    Write-Host "Test 3: Listing all patient appointments..." -ForegroundColor Yellow
    Write-Host ""
    
    $listResponse = Invoke-RestMethod `
        -Uri "$APPOINTMENT_SERVICE_URL/api/v2/patients/$PATIENT_ID/appointments" `
        -Method Get `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✅ SUCCESS: Found $($listResponse.total) appointments for patient" -ForegroundColor Green
    Write-Host ""
    Write-Host "Appointments:" -ForegroundColor Cyan
    foreach ($apt in $listResponse.data) {
        Write-Host "  - $($apt.appointmentId): $($apt.appointmentDate) $($apt.appointmentTime) - $($apt.status)" -ForegroundColor White
    }
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host "  ✅ Appointment created via API" -ForegroundColor White
    Write-Host "  ✅ Event processed and synced to Read Model" -ForegroundColor White
    Write-Host "  ✅ Data retrievable via API V2" -ForegroundColor White
    Write-Host "  ✅ Patient appointments list working" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response Body:" -ForegroundColor Red
            Write-Host $responseBody -ForegroundColor Red
        } catch {
            Write-Host "Could not read response body" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check if Appointment Service is running on port 3004" -ForegroundColor White
    Write-Host "  2. Check if Patient Service is running (for patient data)" -ForegroundColor White
    Write-Host "  3. Check if Provider Service is running (for doctor data)" -ForegroundColor White
    Write-Host "  4. Check RabbitMQ connection for event publishing" -ForegroundColor White
    Write-Host ""
    
    exit 1
}
