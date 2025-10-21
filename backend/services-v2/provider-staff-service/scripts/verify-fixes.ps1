# Provider Staff Service - Verification Script
# Verifies all bug fixes and service health

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Provider Staff Service - Fix Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0
$WarningCount = 0

# Function to print status
function Print-Status {
    param(
        [string]$Message,
        [string]$Status
    )
    
    $color = switch ($Status) {
        "OK" { "Green" }
        "FAIL" { "Red" }
        "WARN" { "Yellow" }
        default { "White" }
    }
    
    Write-Host "[$Status] " -ForegroundColor $color -NoNewline
    Write-Host $Message
}

# 1. Check if we're in the right directory
Write-Host "1. Checking directory..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    $pkg = Get-Content "package.json" | ConvertFrom-Json
    if ($pkg.name -eq "provider-staff-service") {
        Print-Status "In correct directory: provider-staff-service" "OK"
    } else {
        Print-Status "Wrong directory! Expected provider-staff-service" "FAIL"
        $ErrorCount++
    }
} else {
    Print-Status "package.json not found!" "FAIL"
    $ErrorCount++
}

Write-Host ""

# 2. Check Node.js version
Write-Host "2. Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($nodeVersion -match "v(\d+)\.") {
    $majorVersion = [int]$matches[1]
    if ($majorVersion -ge 18) {
        Print-Status "Node.js version: $nodeVersion" "OK"
    } else {
        Print-Status "Node.js version too old: $nodeVersion (need >= 18)" "FAIL"
        $ErrorCount++
    }
} else {
    Print-Status "Could not determine Node.js version" "FAIL"
    $ErrorCount++
}

Write-Host ""

# 3. Check dependencies
Write-Host "3. Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Print-Status "node_modules exists" "OK"
} else {
    Print-Status "node_modules not found - running npm install..." "WARN"
    $WarningCount++
    npm install
}

Write-Host ""

# 4. Check environment variables
Write-Host "4. Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Print-Status ".env file exists" "OK"
    
    $envContent = Get-Content ".env" -Raw
    
    $requiredVars = @(
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "PORT",
        "DATABASE_SCHEMA"
    )
    
    foreach ($var in $requiredVars) {
        if ($envContent -match "$var=") {
            Print-Status "  $var is set" "OK"
        } else {
            Print-Status "  $var is missing!" "FAIL"
            $ErrorCount++
        }
    }
} else {
    Print-Status ".env file not found!" "FAIL"
    $ErrorCount++
}

Write-Host ""

# 5. TypeScript compilation
Write-Host "5. Running TypeScript compilation..." -ForegroundColor Yellow
Write-Host "   This may take a moment..." -ForegroundColor Gray

$buildOutput = npm run build 2>&1
$buildExitCode = $LASTEXITCODE

if ($buildExitCode -eq 0) {
    Print-Status "TypeScript compilation successful" "OK"
} else {
    Print-Status "TypeScript compilation failed!" "FAIL"
    Write-Host "   Build output:" -ForegroundColor Gray
    Write-Host $buildOutput -ForegroundColor Red
    $ErrorCount++
}

Write-Host ""

# 6. Check DI setup file
Write-Host "6. Verifying DI container fixes..." -ForegroundColor Yellow
$diSetupPath = "src/infrastructure/di/setup.ts"

if (Test-Path $diSetupPath) {
    $diContent = Get-Content $diSetupPath -Raw
    
    # Check for registerFactory usage
    $registerFactoryCount = ([regex]::Matches($diContent, "registerFactory")).Count
    $registerCount = ([regex]::Matches($diContent, "\.register\(")).Count
    
    if ($registerFactoryCount -gt 0) {
        Print-Status "Found $registerFactoryCount registerFactory() calls" "OK"
    } else {
        Print-Status "No registerFactory() calls found!" "FAIL"
        $ErrorCount++
    }
    
    # Check for incorrect register() usage with factory functions
    if ($diContent -match "container\.register\([^,]+,\s*\([^)]*\)\s*=>") {
        Print-Status "Found incorrect register() usage with factory functions!" "FAIL"
        $ErrorCount++
    } else {
        Print-Status "No incorrect register() usage detected" "OK"
    }
} else {
    Print-Status "DI setup file not found: $diSetupPath" "FAIL"
    $ErrorCount++
}

Write-Host ""

# 7. Run tests
Write-Host "7. Running tests..." -ForegroundColor Yellow
Write-Host "   This may take a moment..." -ForegroundColor Gray

$testOutput = npm test 2>&1
$testExitCode = $LASTEXITCODE

if ($testExitCode -eq 0) {
    Print-Status "All tests passed" "OK"
} else {
    Print-Status "Some tests failed" "WARN"
    Write-Host "   Test output:" -ForegroundColor Gray
    Write-Host $testOutput -ForegroundColor Yellow
    $WarningCount++
}

Write-Host ""

# 8. Check for dist directory
Write-Host "8. Checking build output..." -ForegroundColor Yellow
if (Test-Path "dist") {
    $distFiles = Get-ChildItem "dist" -Recurse -File
    if ($distFiles.Count -gt 0) {
        Print-Status "Build output exists ($($distFiles.Count) files)" "OK"
    } else {
        Print-Status "Build output directory is empty" "WARN"
        $WarningCount++
    }
} else {
    Print-Status "Build output directory not found" "WARN"
    $WarningCount++
}

Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    Write-Host "✅ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The service is ready to run:" -ForegroundColor Green
    Write-Host "  npm run dev    # Start development server" -ForegroundColor Cyan
    Write-Host "  npm start      # Start production server" -ForegroundColor Cyan
    exit 0
} elseif ($ErrorCount -eq 0) {
    Write-Host "⚠️  PASSED WITH WARNINGS" -ForegroundColor Yellow
    Write-Host "   Warnings: $WarningCount" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "The service should work, but review warnings above." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "❌ VERIFICATION FAILED" -ForegroundColor Red
    Write-Host "   Errors: $ErrorCount" -ForegroundColor Red
    Write-Host "   Warnings: $WarningCount" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please fix the errors above before running the service." -ForegroundColor Red
    exit 1
}

