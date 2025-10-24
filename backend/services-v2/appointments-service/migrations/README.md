# Scheduling Service Database Migrations

## Overview
This directory contains SQL migration files for the Scheduling Service database schema.

**Schema Name**: `scheduling_schema`  
**Pattern**: Schema-per-Service  
**Database**: Supabase PostgreSQL

---

## Migration Files

### 001_create_scheduling_schema.sql
**Status**: ⚠️ **PENDING** - Needs to be run on Supabase  
**Description**: Initial schema creation with all tables, indexes, and RLS policies

**Creates**:
- ✅ Schema: `scheduling_schema`
- ✅ Table: `appointments` - Main appointment records
- ✅ Table: `appointment_read_models` - CQRS read models with denormalized data
- ✅ Table: `queue_entries` - Queue management
- ✅ Table: `recurring_appointments` - Recurring appointment patterns
- ✅ Indexes for performance optimization
- ✅ Row Level Security (RLS) policies
- ✅ Triggers for `updated_at` auto-update

---

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   ```
   https://ciasxktujslgsdgylimv.supabase.co
   ```

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy Migration Content**
   ```bash
   # Copy the entire content of 001_create_scheduling_schema.sql
   cat migrations/001_create_scheduling_schema.sql
   ```

4. **Paste and Run**
   - Paste the SQL into the editor
   - Click "Run" button
   - Wait for completion (should take ~5-10 seconds)

5. **Verify Success**
   - Check for "Success" message
   - No error messages should appear

---

### Option 2: Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to project
supabase link --project-ref ciasxktujslgsdgylimv

# Run migration
supabase db push --file migrations/001_create_scheduling_schema.sql
```

---

### Option 3: psql Command Line

```bash
# Connect to Supabase database
psql -h db.ciasxktujslgsdgylimv.supabase.co \
     -U postgres \
     -d postgres \
     -f migrations/001_create_scheduling_schema.sql

# Enter password when prompted
```

---

## Verification

After running the migration, verify the schema exists:

### Method 1: Supabase Dashboard
1. Go to "Table Editor"
2. Select schema: `scheduling_schema`
3. You should see 4 tables:
   - `appointments`
   - `appointment_read_models`
   - `queue_entries`
   - `recurring_appointments`

### Method 2: SQL Query
```sql
-- Check if schema exists
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'scheduling_schema';

-- List all tables in schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'scheduling_schema';

-- Count records (should be 0 initially)
SELECT COUNT(*) FROM scheduling_schema.appointments;
```

### Method 3: Node.js Script
```bash
cd backend/services-v2/scheduling-service

node -e "
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'scheduling_schema' } }
);

supabase.from('appointments').select('*').limit(1).then(({ data, error }) => {
  if (error) {
    console.log('❌ Schema not found:', error.message);
  } else {
    console.log('✅ Schema exists and is accessible');
  }
});
"
```

---

## After Migration

Once the migration is successfully run:

1. **Update Repository Code**
   - ✅ Already configured to use `scheduling_schema`
   - ✅ Supabase client configured with schema option

2. **Run Integration Tests**
   ```bash
   npm test -- --testPathPattern="integration"
   ```
   - All 14 integration tests should pass ✅

3. **Run All Tests**
   ```bash
   npm test
   ```
   - Expected: 72/86 tests passing (84%)

4. **Check Coverage**
   ```bash
   npm run test:coverage
   ```
   - Expected: ~50-60% coverage

---

## Rollback

If you need to rollback the migration:

```sql
-- Drop all tables
DROP TABLE IF EXISTS scheduling_schema.recurring_appointments CASCADE;
DROP TABLE IF EXISTS scheduling_schema.queue_entries CASCADE;
DROP TABLE IF EXISTS scheduling_schema.appointment_read_models CASCADE;
DROP TABLE IF EXISTS scheduling_schema.appointments CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS scheduling_schema.update_updated_at_column() CASCADE;

-- Drop schema
DROP SCHEMA IF EXISTS scheduling_schema CASCADE;
```

---

## Schema Design

### appointments Table
- **Purpose**: Main appointment records (Write Model)
- **Pattern**: DDD Aggregate Root
- **Compliance**: HIPAA, Vietnamese Healthcare Standards
- **Features**:
  - Soft references to Patient and Provider services
  - Full appointment lifecycle tracking
  - Financial tracking (consultation fees, payment status)
  - Audit trail (created_by, updated_at, version)

### appointment_read_models Table
- **Purpose**: Denormalized read model (CQRS)
- **Pattern**: CQRS Read Model
- **Features**:
  - Denormalized patient and doctor data
  - Optimized for queries
  - Updated via domain events

### queue_entries Table
- **Purpose**: Queue management
- **Features**:
  - Queue position tracking
  - Priority levels
  - Wait time estimation

### recurring_appointments Table
- **Purpose**: Recurring appointment patterns
- **Features**:
  - Daily, weekly, monthly, yearly patterns
  - Series management
  - Template for generating appointments

---

## Next Steps

1. ✅ **Run migration** on Supabase Dashboard
2. ✅ **Verify schema** exists
3. ✅ **Run integration tests**
4. ✅ **Continue development** with confidence

---

**Last Updated**: 2025-01-13  
**Version**: 3.0.0  
**Author**: Hospital Management Team

