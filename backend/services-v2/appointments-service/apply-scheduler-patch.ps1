# Scheduler Integration Patch Script (PowerShell)
# This script backs up original files and applies patched versions
# Run from: backend/services-v2/appointments-service/

$ErrorActionPreference = "Stop"

Write-Host "========================================"
Write-Host "  SCHEDULER INTEGRATION PATCH v1.0"
Write-Host "========================================"
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Must run from appointments-service directory" -ForegroundColor Red
    exit 1
}

$packageJson = Get-Content "package.json" | ConvertFrom-Json
if ($packageJson.name -notlike "*appointments*") {
    Write-Host "❌ Error: Not in appointments-service directory" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Directory check passed" -ForegroundColor Green
Write-Host ""

# Create backup directory
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "backup_$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Write-Host "📁 Created backup directory: $backupDir" -ForegroundColor Cyan
Write-Host ""

# Function to backup and replace file
function Backup-And-Replace {
    param(
        [string]$Original,
        [string]$Patched,
        [string]$DisplayName
    )
    
    if (-not (Test-Path $Original)) {
        Write-Host "⚠️  Warning: Original file not found: $Original" -ForegroundColor Yellow
        return $false
    }
    
    if (-not (Test-Path $Patched)) {
        Write-Host "❌ Error: Patched file not found: $Patched" -ForegroundColor Red
        return $false
    }
    
    Write-Host "Processing: $DisplayName"
    
    # Backup original
    $backupFile = Join-Path $backupDir (Split-Path $Original -Leaf)
    Copy-Item $Original $backupFile -Force
    Write-Host "  ✓ Backed up to: $backupFile" -ForegroundColor Green
    
    # Replace with patched version
    Copy-Item $Patched $Original -Force
    Write-Host "  ✓ Replaced with patched version" -ForegroundColor Green
    
    # Remove patched file
    Remove-Item $Patched -Force
    Write-Host "  ✓ Cleaned up patched file" -ForegroundColor Green
    Write-Host ""
    
    return $true
}

# Apply patches
Write-Host "Applying patches..." -ForegroundColor Cyan
Write-Host ""

Backup-And-Replace `
    -Original "src\application\use-cases\ScheduleAppointment.use-case.ts" `
    -Patched "src\application\use-cases\ScheduleAppointment.use-case.PATCHED.ts" `
    -DisplayName "ScheduleAppointment Use Case"

Backup-And-Replace `
    -Original "src\application\use-cases\CancelAppointment.use-case.ts" `
    -Patched "src\application\use-cases\CancelAppointment.use-case.PATCHED.ts" `
    -DisplayName "CancelAppointment Use Case"

Backup-And-Replace `
    -Original "src\application\use-cases\RescheduleAppointment.use-case.ts" `
    -Patched "src\application\use-cases\RescheduleAppointment.use-case.PATCHED.ts" `
    -DisplayName "RescheduleAppointment Use Case"

Write-Host "========================================"
Write-Host "✅ PATCH APPLIED SUCCESSFULLY" -ForegroundColor Green
Write-Host "========================================"
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   - 3 use case files patched"
Write-Host "   - Original files backed up to: $backupDir"
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Review CONTAINER_PATCH_INSTRUCTIONS.md"
Write-Host "   2. Manually update src\infrastructure\di\container.ts"
Write-Host "   3. Install dependencies: npm install axios axios-retry"
Write-Host "   4. Build: npm run build"
Write-Host "   5. Test: npm run dev"
Write-Host ""
Write-Host "📚 To rollback:" -ForegroundColor Cyan
Write-Host "   Copy-Item $backupDir\*.ts src\application\use-cases\"
Write-Host ""
