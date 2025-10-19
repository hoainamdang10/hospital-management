@echo off
REM Test Runner Script for Patient Registry Service (Windows)
REM Bypasses potential npm/git hook issues

echo =========================================
echo Patient Registry Service - Test Runner
echo =========================================
echo.

REM Navigate to service directory
cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [ERROR] node_modules not found. Running npm install...
    call npm install
)

REM Check if jest is installed
if not exist "node_modules\.bin\jest.cmd" (
    echo [ERROR] Jest not found. Installing dependencies...
    call npm install
)

echo [OK] Dependencies OK
echo.

REM Run tests based on argument
if "%1"=="coverage" (
    echo [INFO] Running tests with coverage...
    node node_modules\jest\bin\jest.js --coverage --passWithNoTests
    goto :end
)

if "%1"=="watch" (
    echo [INFO] Running tests in watch mode...
    node node_modules\jest\bin\jest.js --watch
    goto :end
)

if "%1"=="domain" (
    echo [INFO] Running Domain Layer tests...
    node node_modules\jest\bin\jest.js tests/unit/domain --coverage
    goto :end
)

if "%1"=="services" (
    echo [INFO] Running Application Services tests...
    node node_modules\jest\bin\jest.js tests/unit/application/services --coverage
    goto :end
)

if "%1"=="usecases" (
    echo [INFO] Running Application Use Cases tests...
    node node_modules\jest\bin\jest.js tests/unit/application/use-cases --coverage
    goto :end
)

if "%1"=="all" (
    echo [INFO] Running ALL tests with coverage...
    node node_modules\jest\bin\jest.js --coverage --passWithNoTests
    goto :end
)

REM Default: run all tests
echo [INFO] Running all tests (default)...
node node_modules\jest\bin\jest.js --passWithNoTests

:end
echo.
echo =========================================
echo Test run completed!
echo =========================================
pause

