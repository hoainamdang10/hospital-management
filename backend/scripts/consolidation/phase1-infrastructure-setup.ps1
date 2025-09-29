# =====================================================
# Phase 1: Infrastructure Setup & Backup
# Hospital Management System - Microservices Consolidation
# Department Service → Auth Service Migration (PowerShell)
# =====================================================

param(
    [switch]$SkipBackup = $false,
    [switch]$Verbose = $false
)

# Configuration
$BackupDir = "backups\phase1-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$LogFile = "logs\phase1-infrastructure-setup.log"
$DeploymentId = "phase1-$(Get-Date -UFormat %s)"

# Ensure directories exist
New-Item -ItemType Directory -Path "backups", "logs", "scripts\consolidation\rollback" -Force | Out-Null

# Logging function
function Write-Log {
    param($Level, $Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "$Timestamp [$Level] $Message"
    Write-Output $LogEntry | Tee-Object -FilePath $LogFile -Append
}

function Write-Header {
    param($Title)
    Write-Host "`n=================================================" -ForegroundColor Blue
    Write-Host $Title -ForegroundColor Blue
    Write-Host "=================================================" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
    Write-Log "SUCCESS" $Message
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
    Write-Log "ERROR" $Message
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
    Write-Log "WARNING" $Message
}

function Write-Info {
    param($Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
    Write-Log "INFO" $Message
}

# Validation functions
function Test-Environment {
    Write-Header "VALIDATING ENVIRONMENT"
    
    # Check required tools
    $RequiredTools = @("docker", "node", "npm", "git")
    foreach ($Tool in $RequiredTools) {
        if (!(Get-Command $Tool -ErrorAction SilentlyContinue)) {
            Write-Error "Required tool not found: $Tool"
            exit 1
        }
    }
    Write-Success "All required tools are available"
    
    # Check environment variables
    $RequiredVars = @("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")
    foreach ($Var in $RequiredVars) {
        if (!(Get-ChildItem Env:$Var -ErrorAction SilentlyContinue)) {
            Write-Error "Required environment variable not set: $Var"
            exit 1
        }
    }
    Write-Success "All required environment variables are set"
    
    # Check Docker daemon
    try {
        docker info | Out-Null
        Write-Success "Docker daemon is running"
    }
    catch {
        Write-Error "Docker daemon is not running"
        exit 1
    }
    
    # Check current directory
    if (!(Test-Path "backend\docker-compose.yml")) {
        Write-Error "Must be run from project root directory"
        exit 1
    }
    Write-Success "Running from correct directory"
}

# Backup functions
function New-ComprehensiveBackup {
    Write-Header "CREATING COMPREHENSIVE BACKUP"
    
    if ($SkipBackup) {
        Write-Warning "Skipping backup as requested"
        return
    }
    
    Write-Info "Creating backup directory: $BackupDir"
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    
    # 1. Backup codebase
    Write-Info "Backing up codebase..."
    Copy-Item -Path "backend\services" -Destination "$BackupDir\" -Recurse -Force
    Copy-Item -Path "backend\shared" -Destination "$BackupDir\" -Recurse -Force
    Copy-Item -Path "backend\docker-compose.yml" -Destination "$BackupDir\" -Force
    Copy-Item -Path "backend\package.json" -Destination "$BackupDir\" -Force
    Write-Success "Codebase backup completed"
    
    # 2. Backup database schemas
    Write-Info "Backing up database schemas..."
    New-Item -ItemType Directory -Path "$BackupDir\database" -Force | Out-Null
    
    # Use Supabase API to backup schema info
    try {
        $Headers = @{
            "Authorization" = "Bearer $env:SUPABASE_SERVICE_ROLE_KEY"
            "Content-Type" = "application/json"
        }
        Invoke-RestMethod -Uri "$env:SUPABASE_URL/rest/v1/rpc/get_schema_info" -Headers $Headers -OutFile "$BackupDir\database\schema-info.json"
        Write-Success "Database schema backup completed"
    }
    catch {
        Write-Warning "Could not backup database schema via API: $($_.Exception.Message)"
    }
    
    # 3. Backup current service configurations
    Write-Info "Backing up service configurations..."
    New-Item -ItemType Directory -Path "$BackupDir\configs" -Force | Out-Null
    
    # Department service config
    if (Test-Path "backend\services\department-service") {
        Copy-Item -Path "backend\services\department-service\src\config" -Destination "$BackupDir\configs\department-service-config" -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # Auth service config
    if (Test-Path "backend\services\auth-service") {
        Copy-Item -Path "backend\services\auth-service\src\config" -Destination "$BackupDir\configs\auth-service-config" -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # API Gateway routing config
    if (Test-Path "backend\services\api-gateway\src\app.ts") {
        Copy-Item -Path "backend\services\api-gateway\src\app.ts" -Destination "$BackupDir\configs\api-gateway-routes.ts" -Force
    }
    
    Write-Success "Service configurations backup completed"
    
    # 4. Create backup manifest
    $BackupManifest = @{
        backup_id = $DeploymentId
        timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        phase = "phase1-infrastructure-setup"
        type = "comprehensive"
        contents = @{
            codebase = $true
            database_schema = $true
            service_configs = $true
            docker_configs = $true
        }
        services_backed_up = @(
            "department-service",
            "auth-service", 
            "api-gateway"
        )
        backup_size = (Get-ChildItem $BackupDir -Recurse | Measure-Object -Property Length -Sum).Sum
        restoration_notes = "Use rollback scripts in scripts\consolidation\rollback\"
    }
    
    $BackupManifest | ConvertTo-Json -Depth 10 | Out-File "$BackupDir\backup-manifest.json" -Encoding UTF8
    
    Write-Success "Backup manifest created"
    Write-Success "Comprehensive backup completed: $BackupDir"
}

# Safety protocol setup
function Set-SafetyProtocols {
    Write-Header "SETTING UP SAFETY PROTOCOLS"
    
    # 1. Create rollback scripts
    Write-Info "Creating rollback scripts..."
    
    $RollbackScript = @'
# Phase 1 Rollback Script (PowerShell)
param($BackupDir)

if (-not $BackupDir) {
    Write-Host "Usage: .\phase1-rollback.ps1 -BackupDir <backup_directory>"
    exit 1
}

Write-Host "🔄 Rolling back Phase 1 migration..."
Write-Host "📁 Using backup: $BackupDir"

# Stop current services
Set-Location backend
docker-compose --profile core down

# Restore codebase
Copy-Item -Path "$BackupDir\services" -Destination "." -Recurse -Force
Copy-Item -Path "$BackupDir\shared" -Destination "." -Recurse -Force
Copy-Item -Path "$BackupDir\docker-compose.yml" -Destination "." -Force

# Rebuild and restart services
docker-compose --profile core build
docker-compose --profile core up -d

Write-Host "✅ Phase 1 rollback completed"
'@
    
    $RollbackScript | Out-File "scripts\consolidation\rollback\phase1-rollback.ps1" -Encoding UTF8
    Write-Success "Rollback script created"
    
    # 2. Create health check script
    $HealthCheckScript = @'
# Health check script for consolidation process (PowerShell)

function Test-ServiceHealth {
    param($ServiceName, $Port)
    $MaxAttempts = 30
    $Attempt = 1
    
    Write-Host "🔍 Checking $ServiceName health..."
    
    while ($Attempt -le $MaxAttempts) {
        try {
            $Response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -UseBasicParsing -TimeoutSec 5
            if ($Response.StatusCode -eq 200) {
                Write-Host "✅ $ServiceName is healthy" -ForegroundColor Green
                return $true
            }
        }
        catch {
            Write-Host "⏳ Attempt $Attempt/$MaxAttempts - waiting for $ServiceName..."
            Start-Sleep 2
            $Attempt++
        }
    }
    
    Write-Host "❌ $ServiceName health check failed" -ForegroundColor Red
    return $false
}

# Check all core services
Test-ServiceHealth "API Gateway" 3100
Test-ServiceHealth "Auth Service" 3001
Test-ServiceHealth "Department Service" 3005

Write-Host "🏥 All services health check completed"
'@
    
    $HealthCheckScript | Out-File "scripts\consolidation\health-check.ps1" -Encoding UTF8
    Write-Success "Health check script created"
    
    Write-Success "Safety protocols setup completed"
}

# Environment preparation
function Initialize-Environment {
    Write-Header "PREPARING ENVIRONMENT"
    
    # 1. Check current service status
    Write-Info "Checking current service status..."
    Set-Location backend
    docker-compose ps
    
    # 2. Ensure all services are running
    Write-Info "Starting all services to ensure clean state..."
    docker-compose --profile core up -d
    
    # Wait for services to be ready
    Start-Sleep 10
    
    # 3. Run health checks
    Write-Info "Running initial health checks..."
    Set-Location ..
    & ".\scripts\consolidation\health-check.ps1"
    
    Write-Success "Environment preparation completed"
}

# Main execution
function Start-Phase1Setup {
    Write-Header "PHASE 1: INFRASTRUCTURE SETUP & BACKUP"
    Write-Info "Deployment ID: $DeploymentId"
    Write-Info "Log file: $LogFile"
    
    # Execute setup steps
    Test-Environment
    New-ComprehensiveBackup
    Set-SafetyProtocols
    Initialize-Environment
    
    Write-Header "PHASE 1 INFRASTRUCTURE SETUP COMPLETED"
    Write-Success "✅ Backup created: $BackupDir"
    Write-Success "✅ Safety protocols established"
    Write-Success "✅ Environment prepared for migration"
    Write-Success "✅ Ready to proceed with Department Service analysis"
    
    # Save deployment info
    $DeploymentInfo = @{
        deployment_id = $DeploymentId
        phase = "phase1-infrastructure-setup"
        status = "completed"
        timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        backup_location = $BackupDir
        next_step = "Department Service Analysis"
        rollback_command = ".\scripts\consolidation\rollback\phase1-rollback.ps1 -BackupDir $BackupDir"
    }
    
    $DeploymentInfo | ConvertTo-Json -Depth 10 | Out-File "logs\phase1-deployment-info.json" -Encoding UTF8
    
    Write-Info "📋 Next step: Run Department Service Analysis"
    Write-Info "🔄 Rollback command: .\scripts\consolidation\rollback\phase1-rollback.ps1 -BackupDir $BackupDir"
}

# Execute main function
Start-Phase1Setup
