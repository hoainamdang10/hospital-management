#!/bin/bash

###############################################################################
# Apply Database Migrations for Patient Registry Service
#
# This script applies all pending migrations to the Supabase database
#
# Usage:
#   ./scripts/apply-migrations.sh
#
# Prerequisites:
#   - SUPABASE_URL environment variable set
#   - SUPABASE_SERVICE_ROLE_KEY environment variable set
#   - psql command available (PostgreSQL client)
#
# Author: Hospital Management Team
# Version: 2.0.0
# Date: 2025-10-04
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$PROJECT_DIR/migrations"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Patient Registry Service - Migrations${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check prerequisites
if [ -z "$SUPABASE_URL" ]; then
  echo -e "${RED}Error: SUPABASE_URL environment variable not set${NC}"
  echo "Please set it in your .env file or export it:"
  echo "  export SUPABASE_URL=https://your-project.supabase.co"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set${NC}"
  echo "Please set it in your .env file or export it:"
  echo "  export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
  exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
  echo -e "${YELLOW}Warning: psql command not found${NC}"
  echo ""
  echo "You can apply migrations manually via Supabase Dashboard:"
  echo "1. Go to https://app.supabase.com"
  echo "2. Select your project"
  echo "3. Go to SQL Editor"
  echo "4. Copy and paste the content of each migration file"
  echo "5. Click 'Run'"
  echo ""
  echo "Migration files location: $MIGRATIONS_DIR"
  exit 0
fi

# Extract database connection details from SUPABASE_URL
# Format: https://[project-id].supabase.co
PROJECT_ID=$(echo "$SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co|\1|')
DB_HOST="db.${PROJECT_ID}.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo "Database connection:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo ""

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo -e "${RED}Error: Migrations directory not found: $MIGRATIONS_DIR${NC}"
  exit 1
fi

# Get list of migration files
MIGRATION_FILES=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort)

if [ -z "$MIGRATION_FILES" ]; then
  echo -e "${YELLOW}No migration files found in $MIGRATIONS_DIR${NC}"
  exit 0
fi

echo "Found migrations:"
for file in $MIGRATION_FILES; do
  echo "  - $(basename "$file")"
done
echo ""

# Prompt for confirmation
read -p "Apply these migrations? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

# Apply each migration
echo ""
echo "Applying migrations..."
echo ""

for migration_file in $MIGRATION_FILES; do
  migration_name=$(basename "$migration_file")
  echo -e "${YELLOW}Applying: $migration_name${NC}"
  
  # Note: Supabase requires password authentication
  # You'll need to enter the database password when prompted
  # The password is the one you set when creating the Supabase project
  
  if PGPASSWORD="$SUPABASE_SERVICE_ROLE_KEY" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f "$migration_file" \
    2>&1 | grep -v "NOTICE"; then
    echo -e "${GREEN}✓ Applied: $migration_name${NC}"
  else
    echo -e "${RED}✗ Failed: $migration_name${NC}"
    echo ""
    echo "If you see authentication errors, you can apply migrations manually:"
    echo "1. Go to Supabase Dashboard → SQL Editor"
    echo "2. Copy content of: $migration_file"
    echo "3. Paste and click 'Run'"
    exit 1
  fi
  echo ""
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All migrations applied successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Restart the patient-registry-service"
echo "2. Test the new transaction functions"
echo "3. Monitor query performance"

