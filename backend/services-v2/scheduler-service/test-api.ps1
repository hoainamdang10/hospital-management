# Scheduler Service API Tests
# PowerShell script for testing API endpoints

$baseUrl = "http://localhost:3030/api/v1"
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGhvc3BpdGFsLmNvbSIsInJvbGUiOiJhZG1pbiIsInNlcnZpY2UiOiJhcHBvaW50bWVudHMiLCJpYXQiOjE3NjA5ODk2MDcsImV4cCI6MTc2MTA3NjAwN30.haV-hdwyOJSm4ICmGi9WOVuLr3sTe8oCcetU7kAcX00"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "`n=== Scheduler Service API Tests ===`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "Test 1: Health Check (No Auth)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ PASS" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host "`n---`n"

# Test 2: Create ONCE Schedule (Valid)
Write-Host "Test 2: Create ONCE Schedule (Valid)" -ForegroundColor Yellow
$body = @{
    tenantId = "hospital-1"
    ownerService = "appointments"
    ownerResourceType = "appointment"
    ownerResourceId = "appt-123"
    scheduleType = "ONCE"
    startAtUtc = "2025-10-23T09:00:00Z"
    topicOrCommand = "appointments.appointment.reminder.24h"
    payloadJson = @{
        appointmentId = "appt-123"
        patientId = "patient-456"
        doctorId = "doctor-789"
    }
    dedupKey = "appt-123:reminder-24h"
    retryPolicy = @{
        strategy = "exp"
        maxAttempts = 3
        baseMs = 1000
        maxDelayMs = 60000
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/schedules:createOrUpdateByDedup" -Method Post -Headers $headers -Body $body
    Write-Host "✅ PASS" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
    $global:scheduleId = $response.data.scheduleId
    Write-Host "`nSchedule ID: $global:scheduleId" -ForegroundColor Cyan
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}
Write-Host "`n---`n"

# Test 3: Create ONCE Schedule with Wildcard Topic (Valid)
Write-Host "Test 3: Create ONCE Schedule with Wildcard Topic" -ForegroundColor Yellow
$body = @{
    tenantId = "hospital-1"
    ownerService = "appointments"
    scheduleType = "ONCE"
    startAtUtc = "2025-10-23T11:00:00Z"
    topicOrCommand = "appointments.appointment.reminder.custom"
    payloadJson = @{
        appointmentId = "appt-456"
        message = "Custom reminder"
    }
    dedupKey = "appt-456:reminder-custom"
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/schedules:createOrUpdateByDedup" -Method Post -Headers $headers -Body $body
    Write-Host "✅ PASS" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}
Write-Host "`n---`n"

# Test 4: Create CRON Schedule (Invalid - MVP Only Supports ONCE)
Write-Host "Test 4: Create CRON Schedule (Should FAIL - MVP Only)" -ForegroundColor Yellow
$body = @{
    tenantId = "hospital-1"
    ownerService = "billing"
    scheduleType = "CRON"
    cronExpr = "0 9 * * *"
    topicOrCommand = "billing.invoice.generate.monthly"
    payloadJson = @{
        reportType = "monthly"
    }
    dedupKey = "billing:monthly-invoice"
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/schedules:createOrUpdateByDedup" -Method Post -Headers $headers -Body $body
    Write-Host "❌ FAIL: Should have rejected CRON schedule" -ForegroundColor Red
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "✅ PASS: Correctly rejected CRON schedule" -ForegroundColor Green
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}
Write-Host "`n---`n"

# Test 5: Create ONCE Schedule without startAtUtc (Invalid)
Write-Host "Test 5: Create ONCE without startAtUtc (Should FAIL)" -ForegroundColor Yellow
$body = @{
    tenantId = "hospital-1"
    ownerService = "appointments"
    scheduleType = "ONCE"
    topicOrCommand = "appointments.appointment.reminder.24h"
    payloadJson = @{
        appointmentId = "appt-789"
    }
    dedupKey = "appt-789:reminder-24h"
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/schedules:createOrUpdateByDedup" -Method Post -Headers $headers -Body $body
    Write-Host "❌ FAIL: Should have required startAtUtc" -ForegroundColor Red
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "✅ PASS: Correctly required startAtUtc" -ForegroundColor Green
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}
Write-Host "`n---`n"

# Test 6: Create Schedule with Unauthorized Topic (Invalid)
Write-Host "Test 6: Unauthorized Topic (Should FAIL)" -ForegroundColor Yellow
$body = @{
    tenantId = "hospital-1"
    ownerService = "appointments"
    scheduleType = "ONCE"
    startAtUtc = "2025-10-23T09:00:00Z"
    topicOrCommand = "billing.invoice.send"
    payloadJson = @{
        test = "data"
    }
    dedupKey = "test:unauthorized-topic"
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/schedules:createOrUpdateByDedup" -Method Post -Headers $headers -Body $body
    Write-Host "❌ FAIL: Should have rejected unauthorized topic" -ForegroundColor Red
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "✅ PASS: Correctly rejected unauthorized topic" -ForegroundColor Green
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}
Write-Host "`n---`n"

# Test 7: Create Schedule with Unknown Service (Invalid)
Write-Host "Test 7: Unknown Service (Should FAIL)" -ForegroundColor Yellow
$body = @{
    tenantId = "hospital-1"
    ownerService = "unknown-service"
    scheduleType = "ONCE"
    startAtUtc = "2025-10-23T09:00:00Z"
    topicOrCommand = "unknown-service.test"
    payloadJson = @{
        test = "data"
    }
    dedupKey = "test:unknown-service"
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/schedules:createOrUpdateByDedup" -Method Post -Headers $headers -Body $body
    Write-Host "❌ FAIL: Should have rejected unknown service" -ForegroundColor Red
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "✅ PASS: Correctly rejected unknown service" -ForegroundColor Green
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}
Write-Host "`n---`n"

# Test 8: Create Schedule without Authentication (Invalid)
Write-Host "Test 8: No Authentication (Should FAIL)" -ForegroundColor Yellow
$body = @{
    tenantId = "hospital-1"
    ownerService = "appointments"
    scheduleType = "ONCE"
    startAtUtc = "2025-10-23T09:00:00Z"
    topicOrCommand = "appointments.appointment.reminder.24h"
    payloadJson = @{
        appointmentId = "appt-999"
    }
    dedupKey = "appt-999:reminder-24h"
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/schedules:createOrUpdateByDedup" -Method Post -Headers @{"Content-Type" = "application/json"} -Body $body
    Write-Host "❌ FAIL: Should have required authentication" -ForegroundColor Red
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "✅ PASS: Correctly required authentication" -ForegroundColor Green
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}
Write-Host "`n---`n"

# Test 9: Get Schedule by ID (if scheduleId exists)
if ($global:scheduleId) {
    Write-Host "Test 9: Get Schedule by ID" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/schedules/$global:scheduleId" -Method Get -Headers $headers
        Write-Host "✅ PASS" -ForegroundColor Green
        Write-Host ($response | ConvertTo-Json -Depth 10)
    } catch {
        Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host $_.ErrorDetails.Message
        }
    }
    Write-Host "`n---`n"
}

Write-Host "`n=== Test Summary ===`n" -ForegroundColor Cyan
Write-Host "All tests completed. Review results above." -ForegroundColor Green

