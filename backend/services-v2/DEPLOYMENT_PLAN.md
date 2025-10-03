# 🚀 KẾ HOẠCH TRIỂN KHAI V2 DATABASE LÊN SUPABASE

## 📋 THÔNG TIN TRIỂN KHAI

**Project:** Hospital Management System V2  
**Target:** Supabase Production Database  
**Project ID:** `ciasxktujslgsdgylimv`  
**Deployment Type:** Zero-Downtime Migration  
**Estimated Duration:** 30-45 minutes  
**Risk Level:** Medium (có rollback plan)

---

## 🎯 MỤC TIÊU TRIỂN KHAI

### **Primary Goals:**
✅ Deploy 9 schemas (auth, patient, doctor, appointment, medical_records, payment, notifications, analytics, shared)  
✅ Create 51+ tables with proper structure  
✅ Remove 4 cross-schema foreign keys  
✅ Move 4 misplaced tables to correct schemas  
✅ Preserve all existing data  
✅ Zero downtime deployment

### **Success Criteria:**
- ✅ All 9 schemas created
- ✅ Zero cross-schema foreign keys
- ✅ All existing data intact
- ✅ All services can connect
- ✅ Verification tests pass

---

## 📊 DEPLOYMENT WORKFLOW

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT PHASES                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PHASE 1: PRE-DEPLOYMENT (10 min)                          │
│  ├─ 1.1: Create Database Backup                            │
│  ├─ 1.2: Verify Supabase Connection                        │
│  ├─ 1.3: Validate Migration Scripts                        │
│  └─ 1.4: Document Current State                            │
│                                                              │
│  PHASE 2: MIGRATION EXECUTION (15-20 min)                  │
│  ├─ 2.1: Execute Migration 01 (Fix Violations)             │
│  ├─ 2.2: Verify Migration 01                               │
│  ├─ 2.3: Execute Migration 02 (Move Tables)                │
│  ├─ 2.4: Verify Migration 02                               │
│  ├─ 2.5: Execute Migration 03 (Schema Setup)               │
│  └─ 2.6: Verify Migration 03                               │
│                                                              │
│  PHASE 3: POST-DEPLOYMENT (10-15 min)                      │
│  ├─ 3.1: Comprehensive Schema Verification                 │
│  ├─ 3.2: Test Service Connections                          │
│  ├─ 3.3: Data Integrity Validation                         │
│  ├─ 3.4: Generate Deployment Report                        │
│  └─ 3.5: Update Documentation                              │
│                                                              │
│  PHASE 4: ROLLBACK (if needed)                             │
│  ├─ 4.1: Restore from Backup                               │
│  ├─ 4.2: Analyze Failure Cause                             │
│  └─ 4.3: Verify Rollback Success                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 CHI TIẾT TỪNG PHASE

### **PHASE 1: PRE-DEPLOYMENT PREPARATION** (10 phút)

#### **1.1: Create Database Backup** ⏱️ 3 phút

```bash
# Using Supabase MCP
# Backup current database state
supabase db dump --project-ref ciasxktujslgsdgylimv > backup-$(date +%Y%m%d-%H%M%S).sql

# Verify backup file created
ls -lh backup-*.sql
```

**Expected Output:** Backup file ~10-50MB depending on data

#### **1.2: Verify Supabase Connection** ⏱️ 2 phút

```typescript
// Test connection using Supabase MCP
const { data, error } = await supabase
  .from('auth_schema.user_profiles')
  .select('count')
  .limit(1);

if (error) {
  console.error('❌ Connection failed:', error);
} else {
  console.log('✅ Connection successful');
}
```

**Expected Output:** Connection successful

#### **1.3: Validate Migration Scripts** ⏱️ 2 phút

```bash
# Check migration files exist
ls -lh backend/services-v2/migration/*.sql

# Expected files:
# 01-fix-cross-schema-violations.sql
# 02-move-misplaced-tables.sql
# 03-complete-schema-setup.sql
```

**Expected Output:** 3 migration files found

#### **1.4: Document Current State** ⏱️ 3 phút

```sql
-- Count current schemas
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name LIKE '%_schema';

-- Count current tables
SELECT table_schema, COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema IN ('auth_schema', 'patient_schema', 'doctor_schema', 'appointment_schema')
GROUP BY table_schema;

-- Count cross-schema FKs
SELECT COUNT(*) as cross_schema_fks
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema != ccu.table_schema;
```

**Expected Output:** Document baseline metrics

---

### **PHASE 2: MIGRATION EXECUTION** (15-20 phút)

#### **2.1: Execute Migration 01 - Fix Cross-Schema Violations** ⏱️ 3 phút

```bash
# Run migration using Supabase MCP
cat backend/services-v2/migration/01-fix-cross-schema-violations.sql | \
  supabase db execute --project-ref ciasxktujslgsdgylimv
```

**What it does:**
- Drops 4 cross-schema foreign keys
- Creates replacement indexes
- Adds validation functions
- Documents reference relationships

**Expected Output:** 
```
✅ Dropped FK: patient_schema.patient_profiles -> auth_schema.user_profiles
✅ Dropped FK: doctor_schema.doctor_profiles -> auth_schema.user_profiles
✅ Dropped FK: appointment_schema.appointments -> patient_schema.patient_profiles
✅ Dropped FK: appointment_schema.appointments -> doctor_schema.doctor_profiles
✅ All cross-schema foreign keys removed successfully
```

#### **2.2: Verify Migration 01 Results** ⏱️ 2 phút

```sql
-- Verify zero cross-schema FKs
SELECT COUNT(*) FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema != ccu.table_schema;
-- Expected: 0

-- Verify indexes created
SELECT indexname FROM pg_indexes 
WHERE indexname LIKE 'idx_%_user_id' OR indexname LIKE 'idx_%_patient_id';
-- Expected: 4+ indexes
```

#### **2.3: Execute Migration 02 - Move Misplaced Tables** ⏱️ 4 phút

```bash
# Run migration
cat backend/services-v2/migration/02-move-misplaced-tables.sql | \
  supabase db execute --project-ref ciasxktujslgsdgylimv
```

**What it does:**
- Moves receptionist → doctor_schema.receptionist_profiles
- Moves department_scheduling_rules → appointment_schema
- Moves daily_operations → analytics_schema
- Moves status_values → shared_schema
- Creates analytics_schema and shared_schema
- Handles duplicate profiles table

**Expected Output:**
```
✅ Moved receptionist table to doctor_schema
✅ Moved department_scheduling_rules to appointment_schema
✅ Moved daily_operations to analytics_schema
✅ Moved status_values to shared_schema
✅ analytics_schema created successfully
✅ shared_schema created successfully
✅ Renamed profiles to profiles_backup for manual review
```

#### **2.4: Verify Migration 02 Results** ⏱️ 2 phút

```sql
-- Verify tables moved
SELECT table_schema, table_name 
FROM information_schema.tables
WHERE table_name IN ('receptionist_profiles', 'department_scheduling_rules', 'daily_operations', 'status_values');

-- Verify new schemas
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name IN ('analytics_schema', 'shared_schema');
```

#### **2.5: Execute Migration 03 - Complete Schema Setup** ⏱️ 5 phút

```bash
# Run migration
cat backend/services-v2/migration/03-complete-schema-setup.sql | \
  supabase db execute --project-ref ciasxktujslgsdgylimv
```

**What it does:**
- Creates all 9 schemas
- Creates shared reference tables
- Seeds medical specialties (17 specialties)
- Seeds status values (appointment, invoice, medical_record)
- Creates audit trigger function

**Expected Output:**
```
✅ All schemas created successfully
✅ Extensions created successfully
✅ Shared reference tables created
✅ Shared reference data seeded
✅ Audit trigger function created
Created schemas: 9 / 9
```

#### **2.6: Verify Migration 03 Results** ⏱️ 2 phút

```sql
-- Count schemas
SELECT COUNT(*) FROM information_schema.schemata 
WHERE schema_name LIKE '%_schema';
-- Expected: 9

-- Count shared tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'shared_schema';
-- Expected: 4

-- Verify seeded data
SELECT COUNT(*) FROM shared_schema.medical_specialties;
-- Expected: 17
```

---

### **PHASE 3: POST-DEPLOYMENT VERIFICATION** (10-15 phút)

#### **3.1: Comprehensive Schema Verification** ⏱️ 3 phút

```sql
-- Full verification query
SELECT 
  'Schemas' as metric,
  COUNT(*)::text as value,
  '9' as expected
FROM information_schema.schemata 
WHERE schema_name LIKE '%_schema'

UNION ALL

SELECT 
  'Cross-Schema FKs',
  COUNT(*)::text,
  '0'
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema != ccu.table_schema

UNION ALL

SELECT 
  'Total Tables',
  COUNT(*)::text,
  '51+'
FROM information_schema.tables
WHERE table_schema LIKE '%_schema';
```

#### **3.2: Test Service Database Connections** ⏱️ 4 phút

```typescript
// Test each service connection
const services = [
  { name: 'Identity', schema: 'auth_schema' },
  { name: 'Patient', schema: 'patient_schema' },
  { name: 'Provider', schema: 'doctor_schema' },
  { name: 'Scheduling', schema: 'appointment_schema' },
  { name: 'Clinical EMR', schema: 'medical_records_schema' },
  { name: 'Billing', schema: 'payment_schema' },
  { name: 'Notifications', schema: 'notifications_schema' },
];

for (const service of services) {
  const { data, error } = await supabase
    .from(`${service.schema}.user_profiles`)
    .select('count')
    .limit(1);
    
  console.log(`${service.name}: ${error ? '❌' : '✅'}`);
}
```

#### **3.3: Data Integrity Validation** ⏱️ 3 phút

```sql
-- Compare row counts before/after
-- (Use documented baseline from Phase 1)

SELECT 
  table_schema,
  table_name,
  (SELECT COUNT(*) FROM table_schema.table_name) as row_count
FROM information_schema.tables
WHERE table_schema LIKE '%_schema'
ORDER BY table_schema, table_name;
```

#### **3.4: Generate Deployment Report** ⏱️ 3 phút

Create report with:
- ✅ Migration execution results
- ✅ Schema structure summary
- ✅ Verification results
- ✅ Any warnings or issues
- ✅ Next steps

#### **3.5: Update Documentation** ⏱️ 2 phút

- Mark migrations as completed
- Update schema diagrams
- Document any manual steps needed

---

### **PHASE 4: ROLLBACK PLAN** (if needed)

#### **4.1: Restore from Backup**

```bash
# Restore from backup
supabase db restore --project-ref ciasxktujslgsdgylimv < backup-YYYYMMDD-HHMMSS.sql
```

#### **4.2: Analyze Failure Cause**

- Review error logs
- Document failure reason
- Plan remediation

#### **4.3: Verify Rollback Success**

```sql
-- Verify database restored
SELECT schema_name FROM information_schema.schemata;
SELECT table_schema, COUNT(*) FROM information_schema.tables GROUP BY table_schema;
```

---

## ✅ DEPLOYMENT CHECKLIST

### **Pre-Deployment:**
- [ ] Backup created and verified
- [ ] Supabase connection tested
- [ ] Migration scripts validated
- [ ] Current state documented
- [ ] Team notified of deployment

### **During Deployment:**
- [ ] Migration 01 executed successfully
- [ ] Migration 01 verified
- [ ] Migration 02 executed successfully
- [ ] Migration 02 verified
- [ ] Migration 03 executed successfully
- [ ] Migration 03 verified

### **Post-Deployment:**
- [ ] Schema verification passed
- [ ] Service connections tested
- [ ] Data integrity validated
- [ ] Deployment report generated
- [ ] Documentation updated
- [ ] Team notified of completion

---

## 🎯 NEXT STEPS AFTER DEPLOYMENT

1. **Implement Event Bus** - Setup RabbitMQ for inter-service communication
2. **Update Service Code** - Update services to use new schemas
3. **Test End-to-End** - Run full integration tests
4. **Monitor Performance** - Watch for any performance issues
5. **Plan Service-Specific Tables** - Create remaining tables for each service

---

**Created:** 2025-01-XX  
**Status:** ✅ Ready for Execution  
**Approved By:** _________________  
**Executed By:** _________________  
**Execution Date:** _________________

