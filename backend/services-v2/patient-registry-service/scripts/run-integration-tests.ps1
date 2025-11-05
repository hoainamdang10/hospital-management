# PowerShell Script to Run Integration Tests with Real Identity Service
# Usage: .\scripts\run-integration-tests.ps1

Write-Host "🚀 Patient Registry Service - Integration Tests" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Identity Service is running
Write-Host "🔍 Checking if Identity Service is running on port 3021..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3021/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Identity Service is running!" -ForegroundColor Green
        Write-Host ""
    }
} catch {
    Write-Host "❌ Identity Service is NOT running on port 3021" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start Identity Service first:" -ForegroundColor Yellow
    Write-Host "  cd ..\identity-service" -ForegroundColor White
    Write-Host "  `$env:PORT=3021" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use Docker:" -ForegroundColor Yellow
    Write-Host "  cd .." -ForegroundColor White
    Write-Host "  docker-compose -f docker-compose.v2.yml up identity-service" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Run integration tests
Write-Host "🧪 Running integration tests..." -ForegroundColor Yellow
Write-Host ""

npm run test:integration -- identity-service.integration.test.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ All integration tests passed!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Integration tests failed" -ForegroundColor Red
    exit 1
}

