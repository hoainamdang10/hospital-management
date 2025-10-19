#!/bin/bash
# Test Runner Script for Patient Registry Service
# Bypasses potential npm/git hook issues

echo "========================================="
echo "Patient Registry Service - Test Runner"
echo "========================================="
echo ""

# Navigate to service directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Running npm install..."
    npm install
fi

# Check if jest is installed
if [ ! -f "node_modules/.bin/jest" ]; then
    echo "❌ Jest not found. Installing dependencies..."
    npm install
fi

echo "✅ Dependencies OK"
echo ""

# Run tests based on argument
case "$1" in
    "coverage")
        echo "📊 Running tests with coverage..."
        node_modules/.bin/jest --coverage --passWithNoTests
        ;;
    "watch")
        echo "👀 Running tests in watch mode..."
        node_modules/.bin/jest --watch
        ;;
    "domain")
        echo "🏗️  Running Domain Layer tests..."
        node_modules/.bin/jest tests/unit/domain --coverage
        ;;
    "services")
        echo "⚙️  Running Application Services tests..."
        node_modules/.bin/jest tests/unit/application/services --coverage
        ;;
    "usecases")
        echo "📋 Running Application Use Cases tests..."
        node_modules/.bin/jest tests/unit/application/use-cases --coverage
        ;;
    "all")
        echo "🚀 Running ALL tests with coverage..."
        node_modules/.bin/jest --coverage --passWithNoTests
        ;;
    *)
        echo "🧪 Running all tests (default)..."
        node_modules/.bin/jest --passWithNoTests
        ;;
esac

echo ""
echo "========================================="
echo "Test run completed!"
echo "========================================="

