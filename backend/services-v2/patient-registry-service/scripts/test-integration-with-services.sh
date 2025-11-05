#!/bin/bash

# Integration Test Script with Real Services
# Starts Identity Service, runs tests, then cleans up

set -e

echo "🚀 Starting Integration Test Environment..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Cleanup function
cleanup() {
  echo -e "\n${YELLOW}🧹 Cleaning up test environment...${NC}"
  docker-compose -f docker-compose.test.yml down -v
  echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Start test services
echo -e "${YELLOW}📦 Starting test services (Identity, Redis, RabbitMQ)...${NC}"
docker-compose -f docker-compose.test.yml up -d

# Wait for Identity Service to be healthy
echo -e "${YELLOW}⏳ Waiting for Identity Service to be ready...${NC}"
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if curl -f http://localhost:3021/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Identity Service is ready!${NC}"
    break
  fi
  
  attempt=$((attempt + 1))
  echo -e "${YELLOW}   Attempt $attempt/$max_attempts...${NC}"
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo -e "${RED}❌ Identity Service failed to start${NC}"
  docker-compose -f docker-compose.test.yml logs identity-service-test
  exit 1
fi

# Run integration tests
echo -e "\n${YELLOW}🧪 Running integration tests...${NC}"
npm run test:integration -- identity-service.integration.test.ts

# Check test result
if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}✅ All integration tests passed!${NC}"
  exit 0
else
  echo -e "\n${RED}❌ Integration tests failed${NC}"
  echo -e "${YELLOW}📋 Identity Service logs:${NC}"
  docker-compose -f docker-compose.test.yml logs identity-service-test
  exit 1
fi

