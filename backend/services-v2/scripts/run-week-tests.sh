#!/bin/bash

set -e

echo "=========================================="
echo "🧪 WEEK 1-3 COMPREHENSIVE TEST SUITE"
echo "=========================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICES_DIR="$(dirname "$SCRIPT_DIR")"

cd "$SERVICES_DIR"

echo "📋 Test Plan:"
echo "  - Unit Tests: Circuit Breaker, Size Limits, Retry Policy, Error Classification"
echo "  - Integration Tests: Service Registry, Health Checks"
echo "  - Coverage Target: >= 80%"
echo ""

echo "=========================================="
echo "🔧 SETUP"
echo "=========================================="

echo "Installing dependencies..."
cd api-gateway
npm install --silent
echo "✅ Dependencies installed"
echo ""

echo "=========================================="
echo "🧪 UNIT TESTS"
echo "=========================================="

echo "Running Circuit Breaker Config Validator tests..."
npm test -- CircuitBreakerConfigValidator.test.ts --coverage=false
echo ""

echo "Running Size Limit Middleware tests..."
npm test -- SizeLimitMiddleware.test.ts --coverage=false
echo ""

echo "Running Circuit Breaker tests..."
npm test -- CircuitBreaker.test.ts --coverage=false
echo ""

echo "Running Proxy Error tests..."
npm test -- ProxyError.test.ts --coverage=false
echo ""

echo "Running Retry Policy tests..."
npm test -- RetryPolicy.test.ts --coverage=false
echo ""

echo "=========================================="
echo "🔗 INTEGRATION TESTS"
echo "=========================================="

echo "Running Service Registry integration tests..."
npm test -- ServiceRegistry.integration.test.ts --coverage=false
echo ""

echo "=========================================="
echo "📊 COVERAGE REPORT"
echo "=========================================="

echo "Generating comprehensive coverage report..."
npm test -- --coverage --coverageReporters=text --coverageReporters=html
echo ""

echo "=========================================="
echo "✅ TEST SUMMARY"
echo "=========================================="

echo ""
echo "📁 Coverage report available at:"
echo "   file://$SERVICES_DIR/api-gateway/coverage/index.html"
echo ""

echo "🎉 All tests completed!"
echo ""

exit 0

