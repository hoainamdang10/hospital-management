#!/usr/bin/env pwsh
# Development Script - Start All Services in Separate Windows
# Usage: .\scripts\dev-all-windows.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Hospital Management Services V2..." -ForegroundColor Cyan
Write-Host "Each service will open in a separate terminal window" -ForegroundColor Yellow
Write-Host ""

# Get the base directory
$baseDir = Split-Path -Parent $PSScriptRoot

# Service configurations
$services = @(
    @{
        Name = "API Gateway"
        Path = "api-gateway"
        Port = 3101
        Color = "Blue"
    },
    @{
        Name = "Identity Service"
        Path = "identity-service"
        Port = 3001
        Color = "Magenta"
    },
    @{
        Name = "Patient Registry"
        Path = "patient-registry-service"
        Port = 3002
        Color = "Green"
    },
    @{
        Name = "Provider/Staff Service"
        Path = "provider-staff-service"
        Port = 3003
        Color = "Yellow"
    },
    @{
        Name = "Appointments Service"
        Path = "appointments-service"
        Port = 3004
        Color = "Cyan"
    },
    @{
        Name = "Notifications Service"
        Path = "notifications-service"
        Port = 3011
        Color = "White"
    },
    @{
        Name = "Billing Service"
        Path = "billing-service"
        Port = 3009
        Color = "Red"
    }
)

# Check if infrastructure is running
Write-Host "📋 Checking infrastructure..." -ForegroundColor Cyan
$redisRunning = docker ps --filter "name=hospital-redis-v2" --filter "status=running" --format "{{.Names}}"
$rabbitRunning = docker ps --filter "name=hospital-rabbitmq-v2" --filter "status=running" --format "{{.Names}}"

if (-not $redisRunning -or -not $rabbitRunning) {
    Write-Host "⚠️  Infrastructure not running. Starting Redis + RabbitMQ..." -ForegroundColor Yellow
    Write-Host ""
    
    Set-Location $baseDir
    docker-compose -f docker-compose.infra.yml up -d
    
    Write-Host ""
    Write-Host "⏳ Waiting 5 seconds for infrastructure to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
} else {
    Write-Host "✅ Infrastructure is running" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting services in separate windows..." -ForegroundColor Cyan
Write-Host ""

# Start each service in a new terminal window
foreach ($service in $services) {
    $servicePath = Join-Path $baseDir $service.Path
    $title = "$($service.Name) - Port $($service.Port)"
    
    Write-Host "Starting: $($service.Name) on port $($service.Port)..." -ForegroundColor $service.Color
    
    # Start new Windows Terminal (if available) or PowerShell window
    if (Get-Command wt -ErrorAction SilentlyContinue) {
        # Windows Terminal available
        Start-Process wt -ArgumentList "new-tab --title `"$title`" pwsh -NoExit -Command `"cd '$servicePath'; npm run dev`""
    } else {
        # Fallback to standard PowerShell
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$servicePath'; Write-Host '🚀 $title' -ForegroundColor $($service.Color); npm run dev"
    }
    
    # Small delay between starting services
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "✅ All services started in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Service URLs:" -ForegroundColor Cyan
Write-Host "  - API Gateway:      http://localhost:3101" -ForegroundColor Blue
Write-Host "  - Identity Service: http://localhost:3001" -ForegroundColor Magenta
Write-Host "  - Patient Registry: http://localhost:3002" -ForegroundColor Green
Write-Host "  - Provider/Staff:   http://localhost:3003" -ForegroundColor Yellow
Write-Host "  - Appointments:     http://localhost:3004" -ForegroundColor Cyan
Write-Host "  - Notifications:    http://localhost:3011" -ForegroundColor White
Write-Host "  - Billing:          http://localhost:3009" -ForegroundColor Red
Write-Host ""
Write-Host "🛑 To stop all services: Close all service terminal windows" -ForegroundColor Yellow
Write-Host ""
