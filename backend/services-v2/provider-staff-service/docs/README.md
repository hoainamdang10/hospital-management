# Provider/Staff Service - Documentation

**Hospital Management System V2 - Provider/Staff Service**

> 🔗 **Database**: Supabase (Project: `ciasxktujslgsdgylimv`)  
> 📍 **Schema**: `provider_schema`  
> ✅ **Status**: Production-Ready (97.9% test coverage)

---

## 📚 Documentation Index

### 1. **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Comprehensive Schema Documentation
   - **Purpose**: Complete reference for all tables, columns, constraints, indexes
   - **Audience**: Developers, DBAs, AI agents
   - **Content**:
     - Schema overview and table structure
     - Detailed column definitions with types and constraints
     - JSONB column structures with examples
     - Index definitions and performance tips
     - Row Level Security (RLS) policies
     - Triggers and sync mechanisms
     - Query examples
   - **When to use**: Need detailed information about database structure

### 2. **[SUPABASE_SCHEMA_REFERENCE.md](./SUPABASE_SCHEMA_REFERENCE.md)** - Quick Reference Guide
   - **Purpose**: Quick lookup for common queries and schema info
   - **Audience**: Developers, AI agents
   - **Content**:
     - Schema overview (tables, columns, indexes)
     - Common SQL queries
     - Enum values
     - Performance tips
     - RLS policies summary
   - **When to use**: Need quick answers about schema structure

### 3. **[CODE_TO_DATABASE_MAPPING.md](./CODE_TO_DATABASE_MAPPING.md)** - TypeScript ↔ Database Mapping
   - **Purpose**: Map TypeScript domain entities to database tables
   - **Audience**: Developers, AI agents
   - **Content**:
     - Domain entity to table mapping
     - Value object to JSONB mapping
     - Repository operations
     - CQRS query mapping
     - Event mapping
     - Audit trail mapping
     - Sync strategy
   - **When to use**: Need to understand how code maps to database

---

## 🎯 Quick Start

### For AI Agents

**When working with Provider/Staff Service database:**

1. **First time?** → Read [SUPABASE_SCHEMA_REFERENCE.md](./SUPABASE_SCHEMA_REFERENCE.md)
2. **Need details?** → Check [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
3. **Mapping code to DB?** → Use [CODE_TO_DATABASE_MAPPING.md](./CODE_TO_DATABASE_MAPPING.md)

### For Developers

**When implementing features:**

1. **Understand schema** → [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
2. **Write queries** → [SUPABASE_SCHEMA_REFERENCE.md](./SUPABASE_SCHEMA_REFERENCE.md)
3. **Map to domain** → [CODE_TO_DATABASE_MAPPING.md](./CODE_TO_DATABASE_MAPPING.md)

---

## 📊 Schema Overview

### Tables (3 total)

| Table | Type | Purpose | Rows |
|-------|------|---------|------|
| `staff_profiles` | Write Model | Main aggregate root for staff | ~100+ |
| `staff_read_model` | Read Model | CQRS denormalized view | ~100+ |
| `staff_consultation_fees_backup` | Legacy | Backup (to be migrated) | ~50 |

### Key Statistics

- **Total Columns**: 32 (staff_profiles) + 11 (staff_read_model)
- **Total Indexes**: 15 (staff_profiles) + 4 (staff_read_model)
- **JSONB Columns**: 8 (personal_info, professional_info, work_schedule, specializations, credentials, certifications, availability, department_assignments)
- **Constraints**: 25+ (PK, UNIQUE, CHECK, NOT NULL)
- **RLS Policies**: 6 active policies

---

## 🔍 Key Concepts

### Write Model vs Read Model

**Write Model** (`staff_profiles`):
- Normalized data structure
- Single source of truth
- Updated by application
- Used for CRUD operations

**Read Model** (`staff_read_model`):
- Denormalized data structure
- Optimized for queries
- Auto-synced via trigger
- Includes rating data from Review Service

### CQRS Pattern

- **Commands**: Modify state (Create, Update, Delete) → Write Model
- **Queries**: Read state (no side effects) → Read Model
- **Sync**: Trigger-based synchronization

### Event-Driven Architecture

- **Domain Events**: Published when aggregate state changes
- **Integration Events**: Consumed from other services (Identity Service)
- **Event Store**: `public.domain_events` table
- **Event Bus**: RabbitMQ for inter-service communication

---

## 🗂️ File Structure

```
provider-staff-service/
├── docs/
│   ├── README.md                          # This file
│   ├── DATABASE_SCHEMA.md                 # Comprehensive schema docs
│   ├── SUPABASE_SCHEMA_REFERENCE.md       # Quick reference
│   └── CODE_TO_DATABASE_MAPPING.md        # Code ↔ DB mapping
│
├── src/
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── ProviderStaff.ts           # Main aggregate root
│   │   ├── value-objects/
│   │   │   ├── PersonalInfo.ts
│   │   │   ├── ProfessionalInfo.ts
│   │   │   ├── Specialization.ts
│   │   │   ├── Credential.ts
│   │   │   └── DepartmentAssignment.ts
│   │   ├── repositories/
│   │   │   └── IProviderStaffRepository.ts
│   │   └── events/
│   │       ├── StaffRegisteredEvent.ts
│   │       ├── StaffCredentialAddedEvent.ts
│   │       └── ...
│   │
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── RegisterStaffUseCase.ts
│   │   │   ├── GetStaffProfileUseCase.ts
│   │   │   └── ...
│   │   ├── handlers/
│   │   │   ├── StaffCommandHandlers.ts
│   │   │   └── StaffQueryHandlers.ts
│   │   └── interfaces/
│   │       └── ILogger.ts
│   │
│   ├── infrastructure/
│   │   ├── repositories/
│   │   │   └── SupabaseProviderStaffRepository.ts
│   │   ├── events/
│   │   │   ├── UserCreatedEventHandler.ts
│   │   │   ├── UserDeactivatedEventHandler.ts
│   │   │   └── UserRoleChangedEventHandler.ts
│   │   ├── audit/
│   │   │   └── AuditService.ts
│   │   └── cache/
│   │       └── RedisStaffCache.ts
│   │
│   ├── presentation/
│   │   ├── controllers/
│   │   │   └── StaffController.ts
│   │   ├── routes/
│   │   │   └── staff.routes.ts
│   │   └── dto/
│   │       ├── CreateStaffDTO.ts
│   │       └── StaffResponseDTO.ts
│   │
│   └── main.ts                            # Application entry point
│
├── tests/
│   ├── unit/
│   │   ├── domain/
│   │   ├── application/
│   │   └── presentation/
│   ├── integration/
│   │   ├── repositories/
│   │   ├── events/
│   │   └── api/
│   ├── fixtures/
│   └── helpers/
│
├── migrations/
│   ├── 001_create_staff_profiles.sql
│   ├── 002_create_indexes.sql
│   ├── 003_create_rls_policies.sql
│   └── 004_create_read_model.sql
│
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## 🔗 Database Connections

### Supabase Configuration

```env
# .env
SUPABASE_URL=https://ciasxktujslgsdgylimv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
```

### Schema Access

```typescript
// TypeScript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Query provider_schema
const { data, error } = await supabase
  .from('staff_profiles')
  .select('*')
  .eq('staff_type', 'doctor');
```

---

## 📋 Common Tasks

### Find Staff by ID
```sql
SELECT * FROM provider_schema.staff_profiles
WHERE staff_id = 'DOC-CARD-202501-001';
```
**See**: [SUPABASE_SCHEMA_REFERENCE.md - Common Queries](./SUPABASE_SCHEMA_REFERENCE.md#-common-queries)

### Find Active Doctors
```sql
SELECT * FROM provider_schema.staff_profiles
WHERE staff_type = 'doctor' 
  AND status = 'active' 
  AND is_active = true;
```

### Get Top Rated Staff
```sql
SELECT * FROM provider_schema.staff_read_model
WHERE average_rating >= 4.0
ORDER BY average_rating DESC
LIMIT 10;
```

### Find Staff by Specialization
```sql
SELECT * FROM provider_schema.staff_profiles
WHERE specializations @> '[{"name": "Cardiology"}]'::jsonb;
```

---

## 🔐 Security

### Row Level Security (RLS)

All tables have RLS enabled with policies for:
- Service role (full access)
- Authenticated users (view active staff)
- Staff (own profile access)
- Admins (full access)
- Department managers (department access)

**See**: [DATABASE_SCHEMA.md - Row Level Security](./DATABASE_SCHEMA.md#row-level-security-rls)

### Audit Logging

All operations logged to `public.audit_logs`:
- Action type
- Resource type and ID
- User ID
- Changes (before/after)
- Timestamp

**See**: [CODE_TO_DATABASE_MAPPING.md - Audit Trail Mapping](./CODE_TO_DATABASE_MAPPING.md#audit-trail-mapping)

---

## ⚡ Performance

### Index Strategy

- **BTREE Indexes**: Fast lookups on staff_id, user_id, staff_type, status, is_active
- **GIN Indexes**: Array/JSONB searches on specializations, credentials, certifications, department_assignments
- **Composite Indexes**: Common filter combinations

**See**: [DATABASE_SCHEMA.md - Indexes](./DATABASE_SCHEMA.md#indexes)

### Query Optimization

1. Use indexed columns in WHERE clauses
2. Use GIN indexes for JSONB array searches
3. Use read model for complex queries
4. Avoid full table scans on large tables
5. Use pagination for large result sets

**See**: [SUPABASE_SCHEMA_REFERENCE.md - Performance Tips](./SUPABASE_SCHEMA_REFERENCE.md#-performance-tips)

---

## 🔄 Sync Strategy

### Write Model → Read Model

**Trigger**: `sync_staff_read_model_trigger`  
**Event**: AFTER INSERT OR UPDATE on `staff_profiles`  
**Sync**: Automatic via PostgreSQL trigger

**Synced Fields**:
- full_name (from personal_info.fullName)
- specialization (from specializations[0].name)
- department (from professional_info.department)
- staff_type, status, is_active, employment_type
- email, phone_number, title, years_of_experience, license_number

**See**: [CODE_TO_DATABASE_MAPPING.md - Sync Strategy](./CODE_TO_DATABASE_MAPPING.md#sync-strategy)

---

## 📚 Related Documentation

### Service Documentation
- **[AI_AGENT_GUIDE.md](./AI_AGENT_GUIDE.md)** - Guidelines for AI agents
- **[IDENTITY_API_CONTRACT.md](./api/IDENTITY_API_CONTRACT.md)** - API endpoints
- **[IDENTITY_RUNBOOK.md](./ops/IDENTITY_RUNBOOK.md)** - Operational runbook

### Project Documentation
- **[AGENTS.md](../../AGENTS.md)** - Agent guidelines
- **[CLAUDE.md](../../CLAUDE.md)** - Claude Code guidelines
- **[DEVELOPMENT_RULES.md](../../DEVELOPMENT_RULES.md)** - Development standards
- **[README.md](../../README.md)** - Project overview

---

## 🚀 Getting Started

### 1. Understand the Schema
```bash
# Read quick reference
cat docs/SUPABASE_SCHEMA_REFERENCE.md

# Read full documentation
cat docs/DATABASE_SCHEMA.md
```

### 2. Map Code to Database
```bash
# Understand how TypeScript maps to database
cat docs/CODE_TO_DATABASE_MAPPING.md
```

### 3. Write Queries
```bash
# Use common queries as templates
grep -A 5 "Find Staff by ID" docs/SUPABASE_SCHEMA_REFERENCE.md
```

### 4. Implement Features
```bash
# Follow Clean Architecture patterns
# Use domain entities, value objects, repositories
# Implement use cases and query handlers
```

---

## 📞 Support

### For Questions About:

- **Schema Structure** → [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- **Quick Queries** → [SUPABASE_SCHEMA_REFERENCE.md](./SUPABASE_SCHEMA_REFERENCE.md)
- **Code Mapping** → [CODE_TO_DATABASE_MAPPING.md](./CODE_TO_DATABASE_MAPPING.md)
- **API Endpoints** → [api/IDENTITY_API_CONTRACT.md](./api/IDENTITY_API_CONTRACT.md)
- **Operations** → [ops/IDENTITY_RUNBOOK.md](./ops/IDENTITY_RUNBOOK.md)

---

## 📊 Database Status

| Component | Status | Details |
|-----------|--------|---------|
| **Database** | ✅ Live | Supabase PostgreSQL |
| **Schema** | ✅ Active | provider_schema |
| **Tables** | ✅ 3 tables | staff_profiles, staff_read_model, backup |
| **Indexes** | ✅ 19 indexes | BTREE + GIN |
| **RLS** | ✅ Enabled | 6 policies |
| **Triggers** | ✅ Active | sync_staff_read_model_trigger |
| **Backups** | ✅ Daily | 7-day retention |

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-01-22 | Initial documentation |
| 2.0.0 | 2025-01-22 | Added CODE_TO_DATABASE_MAPPING.md |
| 2.0.0 | 2025-01-22 | Added SUPABASE_SCHEMA_REFERENCE.md |

---

**Last Updated**: 2025-01-22  
**Database Status**: ✅ Live & Operational  
**Project ID**: ciasxktujslgsdgylimv  
**Schema**: provider_schema
