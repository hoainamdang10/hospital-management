#!/bin/bash

# Deploy migration 002 to Supabase
# Usage: ./scripts/deploy-migration.sh

set -e

echo "Deploying migration 002: acquire_due_runs function"

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
  exit 1
fi

# Extract database connection details from SUPABASE_URL
# Format: https://PROJECT_ID.supabase.co
PROJECT_ID=$(echo $SUPABASE_URL | sed 's/https:\/\///' | sed 's/.supabase.co//')
DB_HOST="db.${PROJECT_ID}.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo "Database: $DB_HOST"
echo "Project ID: $PROJECT_ID"

# Read migration file
MIGRATION_FILE="migrations/002_add_acquire_due_runs_function.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Error: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "Migration file: $MIGRATION_FILE"

# Execute migration using psql
echo "Executing migration..."

# Note: You'll be prompted for the database password
# Get it from Supabase Dashboard > Settings > Database > Connection string
psql -h "$DB_HOST" \
     -p "$DB_PORT" \
     -U "$DB_USER" \
     -d "$DB_NAME" \
     -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
  echo "Migration deployed successfully"
  
  # Verify function exists
  echo "Verifying function..."
  psql -h "$DB_HOST" \
       -p "$DB_PORT" \
       -U "$DB_USER" \
       -d "$DB_NAME" \
       -c "SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_schema = 'scheduler' AND routine_name = 'acquire_due_runs';"
  
  echo "Deployment complete"
else
  echo "Migration failed"
  exit 1
fi

