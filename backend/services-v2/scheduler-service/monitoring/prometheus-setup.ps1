# Prometheus Setup Script for Scheduler Service (PowerShell)
# Version: 1.0.0
# Last Updated: 2025-10-21

param(
    [Parameter(Position=0)]
    [ValidateSet('start', 'stop', 'restart', 'status', 'logs', 'reload', 'validate', 'cleanup', 'help')]
    [string]$Command = 'help'
)

# Script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PrometheusDir = Join-Path $ScriptDir "prometheus"

# Functions
function Write-Header {
    param([string]$Message)
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

# Check if Docker is running
function Test-Docker {
    Write-Header "Checking Docker"
    
    try {
        docker info | Out-Null
        Write-Success "Docker is running"
        return $true
    }
    catch {
        Write-Error "Docker is not running. Please start Docker and try again."
        return $false
    }
}

# Check if configuration files exist
function Test-Config {
    Write-Header "Checking Configuration Files"
    
    $prometheusYml = Join-Path $PrometheusDir "prometheus.yml"
    $alertsYml = Join-Path $PrometheusDir "alerts.yml"
    
    if (-not (Test-Path $prometheusYml)) {
        Write-Error "prometheus.yml not found in $PrometheusDir"
        return $false
    }
    Write-Success "prometheus.yml found"
    
    if (-not (Test-Path $alertsYml)) {
        Write-Error "alerts.yml not found in $PrometheusDir"
        return $false
    }
    Write-Success "alerts.yml found"
    
    return $true
}

# Validate Prometheus configuration
function Test-PrometheusConfig {
    Write-Header "Validating Prometheus Configuration"
    
    # Check if promtool is available
    $promtool = Get-Command promtool -ErrorAction SilentlyContinue
    
    if ($promtool) {
        $prometheusYml = Join-Path $PrometheusDir "prometheus.yml"
        $alertsYml = Join-Path $PrometheusDir "alerts.yml"
        
        # Validate prometheus.yml
        $result = & promtool check config $prometheusYml 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Prometheus configuration is valid"
        }
        else {
            Write-Error "Prometheus configuration is invalid"
            Write-Host $result
            return $false
        }
        
        # Validate alerts.yml
        $result = & promtool check rules $alertsYml 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Alert rules are valid"
        }
        else {
            Write-Error "Alert rules are invalid"
            Write-Host $result
            return $false
        }
    }
    else {
        Write-Warning "promtool not found. Skipping configuration validation."
        Write-Info "Install Prometheus locally to enable validation: https://prometheus.io/download/"
    }
    
    return $true
}

# Start Prometheus
function Start-Prometheus {
    Write-Header "Starting Prometheus"
    
    Push-Location $ScriptDir
    
    try {
        # Check if Prometheus is already running
        $running = docker ps --filter "name=scheduler-prometheus" --format "{{.Names}}" 2>$null
        if ($running -eq "scheduler-prometheus") {
            Write-Warning "Prometheus is already running"
            Write-Info "Use '.\prometheus-setup.ps1 restart' to restart"
            return
        }
        
        # Start Prometheus
        docker-compose -f docker-compose.prometheus.yml up -d
        
        # Wait for Prometheus to be healthy
        Write-Info "Waiting for Prometheus to be healthy..."
        Start-Sleep -Seconds 5
        
        $maxRetries = 30
        $retryCount = 0
        
        while ($retryCount -lt $maxRetries) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:9090/-/healthy" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
                if ($response.StatusCode -eq 200) {
                    Write-Success "Prometheus is healthy"
                    break
                }
            }
            catch {
                # Continue waiting
            }
            
            $retryCount++
            Write-Host "." -NoNewline
            Start-Sleep -Seconds 2
        }
        
        if ($retryCount -eq $maxRetries) {
            Write-Host ""
            Write-Error "Prometheus failed to start within timeout"
            Write-Info "Check logs: docker logs scheduler-prometheus"
            return
        }
        
        Write-Host ""
        Write-Success "Prometheus started successfully"
        Write-Info "Prometheus UI: http://localhost:9090"
        Write-Info "Metrics endpoint: http://localhost:3025/metrics"
    }
    finally {
        Pop-Location
    }
}

# Stop Prometheus
function Stop-Prometheus {
    Write-Header "Stopping Prometheus"
    
    Push-Location $ScriptDir
    
    try {
        $running = docker ps --filter "name=scheduler-prometheus" --format "{{.Names}}" 2>$null
        if ($running -ne "scheduler-prometheus") {
            Write-Warning "Prometheus is not running"
            return
        }
        
        docker-compose -f docker-compose.prometheus.yml down
        
        Write-Success "Prometheus stopped"
    }
    finally {
        Pop-Location
    }
}

# Restart Prometheus
function Restart-Prometheus {
    Write-Header "Restarting Prometheus"
    
    Stop-Prometheus
    Start-Sleep -Seconds 2
    Start-Prometheus
}

# Show Prometheus status
function Get-PrometheusStatus {
    Write-Header "Prometheus Status"
    
    $running = docker ps --filter "name=scheduler-prometheus" --format "{{.Names}}" 2>$null
    
    if ($running -eq "scheduler-prometheus") {
        Write-Success "Prometheus is running"
        
        # Show container details
        docker ps --filter "name=scheduler-prometheus" --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"
        
        # Check health
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:9090/-/healthy" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Success "Prometheus is healthy"
            }
        }
        catch {
            Write-Error "Prometheus is unhealthy"
        }
        
        # Show URLs
        Write-Host ""
        Write-Info "Prometheus UI: http://localhost:9090"
        Write-Info "Metrics endpoint: http://localhost:3025/metrics"
        Write-Info "Targets: http://localhost:9090/targets"
        Write-Info "Alerts: http://localhost:9090/alerts"
    }
    else {
        Write-Warning "Prometheus is not running"
        Write-Info "Use '.\prometheus-setup.ps1 start' to start"
    }
}

# Show logs
function Get-PrometheusLogs {
    Write-Header "Prometheus Logs"
    
    $running = docker ps --filter "name=scheduler-prometheus" --format "{{.Names}}" 2>$null
    
    if ($running -ne "scheduler-prometheus") {
        Write-Error "Prometheus is not running"
        return
    }
    
    docker logs -f scheduler-prometheus
}

# Reload configuration
function Update-PrometheusConfig {
    Write-Header "Reloading Prometheus Configuration"
    
    $running = docker ps --filter "name=scheduler-prometheus" --format "{{.Names}}" 2>$null
    
    if ($running -ne "scheduler-prometheus") {
        Write-Error "Prometheus is not running"
        return
    }
    
    # Validate config first
    if (-not (Test-PrometheusConfig)) {
        return
    }
    
    # Reload config
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9090/-/reload" -Method Post -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success "Configuration reloaded successfully"
        }
    }
    catch {
        Write-Error "Failed to reload configuration"
        Write-Info "Make sure --web.enable-lifecycle is enabled"
    }
}

# Clean up (remove volumes)
function Remove-Prometheus {
    Write-Header "Cleaning Up Prometheus"
    
    Write-Warning "This will remove all Prometheus data!"
    $confirmation = Read-Host "Are you sure? (y/N)"
    
    if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
        Write-Info "Cleanup cancelled"
        return
    }
    
    Push-Location $ScriptDir
    
    try {
        docker-compose -f docker-compose.prometheus.yml down -v
        Write-Success "Prometheus cleaned up"
    }
    finally {
        Pop-Location
    }
}

# Show help
function Show-Help {
    @"
Prometheus Setup Script for Scheduler Service

Usage: .\prometheus-setup.ps1 [COMMAND]

Commands:
    start       Start Prometheus
    stop        Stop Prometheus
    restart     Restart Prometheus
    status      Show Prometheus status
    logs        Show Prometheus logs (follow mode)
    reload      Reload Prometheus configuration
    validate    Validate Prometheus configuration
    cleanup     Stop Prometheus and remove all data
    help        Show this help message

Examples:
    .\prometheus-setup.ps1 start
    .\prometheus-setup.ps1 status
    .\prometheus-setup.ps1 logs
    .\prometheus-setup.ps1 reload

"@
}

# Main script
switch ($Command) {
    'start' {
        if (Test-Docker) {
            if (Test-Config) {
                Test-PrometheusConfig | Out-Null
                Start-Prometheus
            }
        }
    }
    'stop' {
        if (Test-Docker) {
            Stop-Prometheus
        }
    }
    'restart' {
        if (Test-Docker) {
            if (Test-Config) {
                Test-PrometheusConfig | Out-Null
                Restart-Prometheus
            }
        }
    }
    'status' {
        if (Test-Docker) {
            Get-PrometheusStatus
        }
    }
    'logs' {
        if (Test-Docker) {
            Get-PrometheusLogs
        }
    }
    'reload' {
        if (Test-Docker) {
            if (Test-Config) {
                Update-PrometheusConfig
            }
        }
    }
    'validate' {
        if (Test-Config) {
            Test-PrometheusConfig
        }
    }
    'cleanup' {
        if (Test-Docker) {
            Remove-Prometheus
        }
    }
    'help' {
        Show-Help
    }
    default {
        Write-Error "Unknown command: $Command"
        Write-Host ""
        Show-Help
    }
}

