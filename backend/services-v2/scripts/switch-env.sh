#!/bin/bash
# Switch Environment Script (Bash)
# Copies the appropriate .env file for each service
# Usage: ./scripts/switch-env.sh local|docker

set -e

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Environment parameter required${NC}"
    echo "Usage: $0 local|docker"
    exit 1
fi

ENVIRONMENT=$1

if [ "$ENVIRONMENT" != "local" ] && [ "$ENVIRONMENT" != "docker" ]; then
    echo -e "${RED}❌ Error: Invalid environment. Use 'local' or 'docker'${NC}"
    exit 1
fi

echo -e "${CYAN}🔄 Switching to $ENVIRONMENT environment...${NC}"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVICES_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Root env file
ROOT_ENV_FILE=".env.$ENVIRONMENT"
ROOT_ENV_SOURCE="$SERVICES_DIR/$ROOT_ENV_FILE"
ROOT_ENV_TARGET="$SERVICES_DIR/.env"

if [ -f "$ROOT_ENV_SOURCE" ]; then
    cp "$ROOT_ENV_SOURCE" "$ROOT_ENV_TARGET"
    echo -e "${GREEN}✅ Root: Copied $ROOT_ENV_FILE to .env${NC}"
else
    echo -e "${YELLOW}⚠️  Root: $ROOT_ENV_FILE not found, skipping${NC}"
fi

# List of services
SERVICES=(
    "identity-service"
    "patient-registry-service"
    "provider-staff-service"
    "appointments-service"
    "clinical-emr-service"
    "billing-service"
    "notifications-service"
    "scheduler-service"
    "department-service"
    "api-gateway"
)

SUCCESS_COUNT=0
SKIP_COUNT=0

for SERVICE in "${SERVICES[@]}"; do
    SERVICE_PATH="$SERVICES_DIR/$SERVICE"
    
    if [ ! -d "$SERVICE_PATH" ]; then
        echo -e "${YELLOW}⚠️  Service directory not found: $SERVICE${NC}"
        ((SKIP_COUNT++))
        continue
    fi
    
    ENV_FILE=".env.$ENVIRONMENT"
    ENV_SOURCE="$SERVICE_PATH/$ENV_FILE"
    ENV_TARGET="$SERVICE_PATH/.env"
    
    if [ -f "$ENV_SOURCE" ]; then
        cp "$ENV_SOURCE" "$ENV_TARGET"
        echo -e "${GREEN}✅ $SERVICE: Copied $ENV_FILE to .env${NC}"
        ((SUCCESS_COUNT++))
    else
        echo -e "${YELLOW}⚠️  $SERVICE: $ENV_FILE not found, skipping${NC}"
        ((SKIP_COUNT++))
    fi
done

echo -e "\n${CYAN}📊 Summary:${NC}"
echo -e "   ${GREEN}✅ Success: $SUCCESS_COUNT services${NC}"
if [ $SKIP_COUNT -gt 0 ]; then
    echo -e "   ${YELLOW}⚠️  Skipped: $SKIP_COUNT services${NC}"
fi

echo -e "\n${CYAN}✨ Environment switched to: $ENVIRONMENT${NC}"
echo -e "   You can now run services with: npm run dev"
