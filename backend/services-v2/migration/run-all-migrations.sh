#!/bin/bash

# ============================================================================
# RUN ALL MIGRATIONS - Hospital Management System V2
# ============================================================================
# Purpose: Execute all database migrations in correct order
# Usage: ./run-all-migrations.sh [supabase-project-id]
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ID="${1:-ciasxktujslgsdgylimv}"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}  HOSPITAL MANAGEMENT SYSTEM V2 - DATABASE MIGRATION${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo -e "${YELLOW}Project ID: ${PROJECT_ID}${NC}"
echo -e "${YELLOW}Migration Directory: ${SCRIPT_DIR}${NC}"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Please install it first:${NC}"
    echo -e "${YELLOW}   npm install -g supabase${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Function to run migration
run_migration() {
    local migration_file=$1
    local migration_name=$(basename "$migration_file" .sql)
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Running: ${migration_name}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ -f "$migration_file" ]; then
        # Read and execute SQL file
        if supabase db execute --project-ref "$PROJECT_ID" < "$migration_file"; then
            echo -e "${GREEN}✅ ${migration_name} completed successfully${NC}"
            echo ""
        else
            echo -e "${RED}❌ ${migration_name} failed${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Migration file not found: ${migration_file}${NC}"
        exit 1
    fi
}

# Confirm before proceeding
echo -e "${YELLOW}⚠️  WARNING: This will modify your database schema!${NC}"
echo -e "${YELLOW}   - Drop cross-schema foreign keys${NC}"
echo -e "${YELLOW}   - Move tables to correct schemas${NC}"
echo -e "${YELLOW}   - Create new schemas and tables${NC}"
echo ""
read -p "Do you want to proceed? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${RED}Migration cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}Starting migrations...${NC}"
echo ""

# ============================================================================
# PHASE 1: FIX VIOLATIONS
# ============================================================================

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  PHASE 1: FIX SCHEMA VIOLATIONS                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

run_migration "${SCRIPT_DIR}/01-fix-cross-schema-violations.sql"

# ============================================================================
# PHASE 2: REORGANIZE SCHEMAS
# ============================================================================

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  PHASE 2: REORGANIZE SCHEMAS                                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

run_migration "${SCRIPT_DIR}/02-move-misplaced-tables.sql"

# ============================================================================
# PHASE 3: SETUP BASE SCHEMAS
# ============================================================================

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  PHASE 3: SETUP BASE SCHEMAS                                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

run_migration "${SCRIPT_DIR}/03-complete-schema-setup.sql"

# ============================================================================
# PHASE 4: CREATE SERVICE TABLES (if migration files exist)
# ============================================================================

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  PHASE 4: CREATE SERVICE-SPECIFIC TABLES                               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check and run service-specific migrations
for service_migration in \
    "04-auth-schema-tables.sql" \
    "05-patient-schema-tables.sql" \
    "06-doctor-schema-tables.sql" \
    "07-appointment-schema-tables.sql" \
    "08-medical-records-schema-tables.sql" \
    "09-payment-schema-tables.sql" \
    "10-notifications-schema-tables.sql"
do
    migration_file="${SCRIPT_DIR}/${service_migration}"
    if [ -f "$migration_file" ]; then
        run_migration "$migration_file"
    else
        echo -e "${YELLOW}⚠️  Skipping ${service_migration} (file not found)${NC}"
        echo ""
    fi
done

# ============================================================================
# VERIFICATION
# ============================================================================

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  VERIFICATION                                                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Checking for cross-schema foreign keys...${NC}"

# Create verification SQL
cat > /tmp/verify-migrations.sql << 'EOF'
-- Check for cross-schema foreign keys
SELECT 
    tc.table_schema || '.' || tc.table_name as source_table,
    ccu.table_schema || '.' || ccu.table_name as target_table,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema != ccu.table_schema
    AND tc.table_schema IN (
        'auth_schema', 'patient_schema', 'doctor_schema', 
        'appointment_schema', 'medical_records_schema', 
        'payment_schema', 'notifications_schema'
    );
EOF

# Run verification
if supabase db execute --project-ref "$PROJECT_ID" < /tmp/verify-migrations.sql | grep -q "0 rows"; then
    echo -e "${GREEN}✅ No cross-schema foreign keys found${NC}"
else
    echo -e "${RED}❌ WARNING: Cross-schema foreign keys still exist!${NC}"
fi

# Count tables per schema
echo ""
echo -e "${YELLOW}Counting tables per schema...${NC}"

cat > /tmp/count-tables.sql << 'EOF'
SELECT 
    table_schema,
    COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema IN (
    'auth_schema', 'patient_schema', 'doctor_schema', 
    'appointment_schema', 'medical_records_schema', 
    'payment_schema', 'notifications_schema',
    'analytics_schema', 'shared_schema'
)
AND table_type = 'BASE TABLE'
GROUP BY table_schema
ORDER BY table_schema;
EOF

supabase db execute --project-ref "$PROJECT_ID" < /tmp/count-tables.sql

# Cleanup temp files
rm -f /tmp/verify-migrations.sql /tmp/count-tables.sql

# ============================================================================
# COMPLETION
# ============================================================================

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${GREEN}✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY!${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Review migration logs above for any warnings"
echo -e "  2. Test service connections to database"
echo -e "  3. Verify RLS policies are working"
echo -e "  4. Seed initial data (admin user, roles, etc.)"
echo -e "  5. Start implementing event-driven communication"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo -e "  - Database Design Guide: ${SCRIPT_DIR}/../DATABASE_DESIGN_GUIDE.md"
echo -e "  - Event Definitions: ${SCRIPT_DIR}/../shared/domain/events/domain-events.ts"
echo -e "  - Event Bus: ${SCRIPT_DIR}/../shared/infrastructure/event-bus/EventBus.ts"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo ""

