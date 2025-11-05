#!/bin/bash

# Bash Script to Run Integration Tests with Real Identity Service
# Usage: ./scripts/run-integration-tests.sh

set -e

echo "🚀 Patient Registry Service - Integration Tests"
echo "================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Identity Service is running
echo -e "${YELLOW}🔍 Checking if Identity Service is running on port 3021...${NC}"

if curl -f http://localhost:3021/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Identity Service is running!${NC}"
    echo ""
else
    echo -e "${RED}❌ Identity Service is NOT running on port 3021${NC}"
    echo ""
    echo -e "${YELLOW}Please start Identity Service first:${NC}"
    echo "  cd ../identity-service"
    echo "  PORT=3021 npm run dev"
    echo ""
    echo -e "${YELLOW}Or use Docker:${NC}"
    echo "  cd .."
    echo "  docker-compose -f docker-compose.v2.yml up identity-service"
    echo ""
    exit 1
fi

# Run integration tests
echo -e "${YELLOW}🧪 Running integration tests...${NC}"
echo ""

npm run test:integration -- identity-service.integration.test.ts

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All integration tests passed!${NC}"
else
    echo ""
    echo -e "${RED}❌ Integration tests failed${NC}"
    exit 1
fi

