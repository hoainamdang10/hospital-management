#!/bin/bash

# Validate JWT Configuration Across Services
# Ensures JWT_SECRET matches SUPABASE_JWT_SECRET

set -e

echo "🔍 Validating JWT Configuration..."
echo ""

# Load environment variables
if [ -f .env ]; then
  source .env
else
  echo "❌ .env file not found"
  echo "   Please create .env file from .env.example"
  exit 1
fi

# Check if SUPABASE_JWT_SECRET is set
if [ -z "$SUPABASE_JWT_SECRET" ]; then
  echo "❌ SUPABASE_JWT_SECRET is not set in .env"
  echo "   Get this from Supabase Dashboard -> Settings -> API -> JWT Settings"
  exit 1
fi

echo "✅ SUPABASE_JWT_SECRET is set"
echo "   Length: ${#SUPABASE_JWT_SECRET} characters"

# Check if JWT_SECRET is set
if [ -z "$JWT_SECRET" ]; then
  echo "⚠️  JWT_SECRET is not set in .env"
  echo "   It will default to SUPABASE_JWT_SECRET"
else
  echo "✅ JWT_SECRET is set"
  echo "   Length: ${#JWT_SECRET} characters"
  
  # Check if they match
  if [ "$JWT_SECRET" != "$SUPABASE_JWT_SECRET" ]; then
    echo ""
    echo "⚠️  WARNING: JWT_SECRET does not match SUPABASE_JWT_SECRET"
    echo "   This may cause authentication issues!"
    echo ""
    echo "   Recommendation: Set JWT_SECRET=\${SUPABASE_JWT_SECRET} in .env"
    echo ""
  else
    echo "✅ JWT_SECRET matches SUPABASE_JWT_SECRET"
  fi
fi

# Check SUPABASE_URL
if [ -z "$SUPABASE_URL" ]; then
  echo "❌ SUPABASE_URL is not set in .env"
  exit 1
fi

echo "✅ SUPABASE_URL is set: $SUPABASE_URL"

# Check SUPABASE_SERVICE_ROLE_KEY
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env"
  exit 1
fi

echo "✅ SUPABASE_SERVICE_ROLE_KEY is set"
echo "   Length: ${#SUPABASE_SERVICE_ROLE_KEY} characters"

# Validate in docker-compose.v2.yml
echo ""
echo "🔍 Checking docker-compose.v2.yml..."

if grep -q "JWT_SECRET=\${SUPABASE_JWT_SECRET}" docker-compose.v2.yml; then
  echo "✅ docker-compose.v2.yml uses SUPABASE_JWT_SECRET for JWT_SECRET"
else
  echo "⚠️  docker-compose.v2.yml may not be using SUPABASE_JWT_SECRET"
  echo "   Check api-gateway service environment variables"
fi

if grep -q "SUPABASE_JWT_SECRET=\${SUPABASE_JWT_SECRET}" docker-compose.v2.yml; then
  echo "✅ docker-compose.v2.yml has SUPABASE_JWT_SECRET configured"
else
  echo "⚠️  docker-compose.v2.yml may be missing SUPABASE_JWT_SECRET"
fi

# Check all services
echo ""
echo "🔍 Checking service configurations..."

SERVICES=("identity-service" "patient-registry-service" "provider-staff-service" "scheduling-service" "clinical-emr-service" "billing-service" "notifications-service")

for service in "${SERVICES[@]}"; do
  if grep -A 20 "$service:" docker-compose.v2.yml | grep -q "JWT_SECRET"; then
    echo "✅ $service has JWT_SECRET configured"
  else
    echo "⚠️  $service may be missing JWT_SECRET"
  fi
done

echo ""
echo "✅ JWT configuration validation complete!"
echo ""
echo "📋 Summary:"
echo "   - SUPABASE_JWT_SECRET: Set (${#SUPABASE_JWT_SECRET} chars)"
echo "   - JWT_SECRET: ${JWT_SECRET:+Set}${JWT_SECRET:-Not set (will use SUPABASE_JWT_SECRET)}"
echo "   - SUPABASE_URL: $SUPABASE_URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY: Set (${#SUPABASE_SERVICE_ROLE_KEY} chars)"
echo ""
echo "🎯 Next Steps:"
echo "   1. Ensure all services use JWT_SECRET=\${SUPABASE_JWT_SECRET} in docker-compose.v2.yml"
echo "   2. Restart services: npm run dev:stop && npm run dev:core"
echo "   3. Test authentication flow"
echo ""

