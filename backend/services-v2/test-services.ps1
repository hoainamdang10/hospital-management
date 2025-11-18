#!/usr/bin/env powershell

# Test Hospital Management Services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Hospital Management Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ports = @(
    @{ Name = "API Gateway"; Port = 3101 },
    @{ Name = "Identity Service"; Port = 3001 },
    @{ Name = "Patient Registry"; Port = 3002 },
    @{ Name = "Provider/Staff"; Port = 3003 },
    @{ Name = "Appointments"; Port = 3004 },
    @{ Name = "Billing"; Port = 3006 },
    @{ Name = "Notifications"; Port = 3011 },
    @{ Name = "Department"; Port = 3025 }
)

foreach ($service in $ports) {
    $url = "http://localhost:$($service.Port)/health"
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 3 -ErrorAction Stop
        Write-Host "$($service.Name) (Port $($service.Port)): ✅ OK" -ForegroundColor Green
    }
    catch {
        Write-Host "$($service.Name) (Port $($service.Port)): ❌ FAILED" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Testing Patient Endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/api/v1/patients/user/test-user-id" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "Patient Endpoint: ✅ OK" -ForegroundColor Green
}
catch {
    Write-Host "Patient Endpoint: ❌ FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing via API Gateway..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3101/api/v1/patients/user/test-user-id" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "API Gateway Patient Route: ✅ OK" -ForegroundColor Green
}
catch {
    Write-Host "API Gateway Patient Route: ❌ FAILED - $($_.Exception.Message)" -ForegroundColor Red
}
