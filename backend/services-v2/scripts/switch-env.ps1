# Switch Environment Script (PowerShell)
# Copies the appropriate .env file for each service
# Usage: .\scripts\switch-env.ps1 local|docker

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("local", "docker")]
    [string]$Environment
)

$ErrorActionPreference = "Stop"

Write-Host "🔄 Switching to $Environment environment..." -ForegroundColor Cyan

# Define services directory
$servicesDir = Join-Path $PSScriptRoot ".."

# Root env file
$rootEnvFile = ".env.$Environment"
$rootEnvSource = Join-Path $servicesDir $rootEnvFile
$rootEnvTarget = Join-Path $servicesDir ".env"

if (Test-Path $rootEnvSource) {
    Copy-Item $rootEnvSource $rootEnvTarget -Force
    Write-Host "✅ Root: Copied $rootEnvFile to .env" -ForegroundColor Green
} else {
    Write-Warning "⚠️  Root: $rootEnvFile not found, skipping"
}

# List of services
$services = @(
    "identity-service",
    "patient-registry-service",
    "provider-staff-service",
    "appointments-service",
    # "clinical-emr-service",  # REMOVED FOR MVP - Focus on Appointments only
    "billing-service",
    "notifications-service",
    # "scheduler-service",  # REMOVED - Functionality moved to cron jobs
    "department-service",
    "api-gateway"
)

$successCount = 0
$skipCount = 0

foreach ($service in $services) {
    $servicePath = Join-Path $servicesDir $service
    
    if (-not (Test-Path $servicePath)) {
        Write-Warning "⚠️  Service directory not found: $service"
        $skipCount++
        continue
    }
    
    $envFile = ".env.$Environment"
    $envSource = Join-Path $servicePath $envFile
    $envTarget = Join-Path $servicePath ".env"
    
    if (Test-Path $envSource) {
        Copy-Item $envSource $envTarget -Force
        Write-Host "✅ $service`: Copied $envFile to .env" -ForegroundColor Green
        $successCount++
    } else {
        Write-Warning "⚠️  $service`: $envFile not found, skipping"
        $skipCount++
    }
}

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Success: $successCount services" -ForegroundColor Green
if ($skipCount -gt 0) {
    Write-Host "   ⚠️  Skipped: $skipCount services" -ForegroundColor Yellow
}

Write-Host "`n✨ Environment switched to: $Environment" -ForegroundColor Cyan
Write-Host "   You can now run services with: npm run dev" -ForegroundColor Gray
