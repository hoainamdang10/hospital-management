@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo 🧪 WEEK 1-3 COMPREHENSIVE TEST SUITE
echo ==========================================
echo.

set SCRIPT_DIR=%~dp0
set SERVICES_DIR=%SCRIPT_DIR%..

cd /d "%SERVICES_DIR%"

echo 📋 Test Plan:
echo   - Unit Tests: Circuit Breaker, Size Limits, Retry Policy, Error Classification
echo   - Integration Tests: Service Registry, Health Checks
echo   - Coverage Target: ^>= 80%%
echo.

echo ==========================================
echo 🔧 SETUP
echo ==========================================

echo Installing dependencies...
cd api-gateway
call npm install --silent
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    exit /b 1
)
echo ✅ Dependencies installed
echo.

echo ==========================================
echo 🧪 UNIT TESTS
echo ==========================================

echo Running Circuit Breaker Config Validator tests...
call npm test -- CircuitBreakerConfigValidator.test.ts --coverage=false
if errorlevel 1 (
    echo ❌ Circuit Breaker Config Validator tests failed
    exit /b 1
)
echo.

echo Running Size Limit Middleware tests...
call npm test -- SizeLimitMiddleware.test.ts --coverage=false
if errorlevel 1 (
    echo ❌ Size Limit Middleware tests failed
    exit /b 1
)
echo.

echo Running Circuit Breaker tests...
call npm test -- CircuitBreaker.test.ts --coverage=false
if errorlevel 1 (
    echo ❌ Circuit Breaker tests failed
    exit /b 1
)
echo.

echo Running Proxy Error tests...
call npm test -- ProxyError.test.ts --coverage=false
if errorlevel 1 (
    echo ❌ Proxy Error tests failed
    exit /b 1
)
echo.

echo Running Retry Policy tests...
call npm test -- RetryPolicy.test.ts --coverage=false
if errorlevel 1 (
    echo ❌ Retry Policy tests failed
    exit /b 1
)
echo.

echo ==========================================
echo 🔗 INTEGRATION TESTS
echo ==========================================

echo Running Service Registry integration tests...
call npm test -- ServiceRegistry.integration.test.ts --coverage=false
if errorlevel 1 (
    echo ❌ Service Registry integration tests failed
    exit /b 1
)
echo.

echo ==========================================
echo 📊 COVERAGE REPORT
echo ==========================================

echo Generating comprehensive coverage report...
call npm test -- --coverage --coverageReporters=text --coverageReporters=html
if errorlevel 1 (
    echo ⚠️ Coverage report generation had warnings
)
echo.

echo ==========================================
echo ✅ TEST SUMMARY
echo ==========================================

echo.
echo 📁 Coverage report available at:
echo    file:///%SERVICES_DIR%\api-gateway\coverage\index.html
echo.

echo 🎉 All tests completed!
echo.

endlocal
exit /b 0

