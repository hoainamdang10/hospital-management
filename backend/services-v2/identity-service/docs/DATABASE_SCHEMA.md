# Database Schema Documentation

**Last Updated**: 2025-10-07  
**Database**: Supabase (PostgreSQL)  
**Project ID**: ciasxktujslgsdgylimv  
**Schema**: auth_schema

> ⚠️ **IMPORTANT**: This documentation reflects the ACTUAL database schema on Supabase.  
> All tables listed here exist and are verified. Do NOT assume tables are missing.

---

## Table of Contents
1. [Core Tables](#core-tables)
2. [RBAC Tables](#rbac-tables)
3. [Security Tables](#security-tables)
4. [Audit Tables](#audit-tables)
5. [Recovery Tables](#recovery-tables)
6. [MFA Tables](#mfa-tables)

---

## Core Tables

### 1. user_profiles
**Status**: ✅ EXISTS (7 rows)  
**RLS**: Enabled  
**Purpose**: Stores user profile information

**Columns**:
- `id` (uuid, PK) - User ID
- `email` (text, unique) - User email
- `username` (text, unique, nullable) - Username
- `full_name` (text) - Full name
- `phone_number` (varchar, nullable) - Phone number
- `avatar_url` (text, nullable) - Avatar URL
- `role_type` (text) - Role type (admin, doctor, patient, receptionist)
- `is_active` (boolean, default: true) - Active status
- `is_verified` (boolean, default: false) - Verification status
- `citizen_id` (varchar, unique, nullable) - Citizen ID
- `date_of_birth` (date, nullable) - Date of birth
- `gender` (text, nullable) - Gender (male, female, other)
- `address` (text, nullable) - Address
- `emergency_contact_name` (text, nullable) - Emergency contact name
- `emergency_contact_phone` (varchar, nullable) - Emergency contact phone
- `subscription_tier` (text, default: 'free') - Subscription tier (free, premium, vip)
- `subscription_expires_at` (timestamptz, nullable) - Subscription expiration
- `created_at` (timestamptz, default: now()) - Creation timestamp
- `updated_at` (timestamptz, default: now()) - Update timestamp
- `created_by` (uuid, nullable) - Creator user ID
- `updated_by` (uuid, nullable) - Updater user ID

**Indexes**:
- Primary key on `id`
- Unique on `email`
- Unique on `username`
- Unique on `citizen_id`

**Foreign Keys**:
- Referenced by `user_permissions.user_id`
- Referenced by `user_sessions.user_id`
- Referenced by `password_reset_tokens.user_id`
- Referenced by `user_roles.user_id`

---

### 2. user_sessions
**Status**: ✅ EXISTS (0 rows)  
**RLS**: Enabled  
**Purpose**: Stores user login sessions

**Columns**:
- `id` (uuid, PK) - Session ID
- `user_id` (uuid, FK → user_profiles.id) - User ID
- `session_token` (text, unique) - JWT access token
- `device_info` (jsonb, default: {}) - Device information
- `ip_address` (inet, nullable) - IP address
- `user_agent` (text, nullable) - User agent
- `expires_at` (timestamptz) - Expiration timestamp
- `is_active` (boolean, default: true) - Active status
- `created_at` (timestamptz, default: now()) - Creation timestamp
- `last_accessed_at` (timestamptz, default: now()) - Last access timestamp

**Indexes**:
- Primary key on `id`
- Unique on `session_token`
- Index on `user_id`
- Index on `expires_at`
- Index on `is_active`
- Composite index on `(user_id, is_active)`

---

## RBAC Tables

### 3. healthcare_roles
**Status**: ✅ EXISTS (8 rows)  
**RLS**: Disabled  
**Purpose**: Stores healthcare role definitions

**Columns**:
- `id` (uuid, PK) - Role ID
- `role_name` (text, unique) - Role name
- `role_description` (text, nullable) - Role description
- `permissions` (jsonb, default: []) - Permissions (JSONB array)
- `is_active` (boolean, default: true) - Active status
- `created_at` (timestamptz, default: now()) - Creation timestamp

**Indexes**:
- Primary key on `id`
- Unique on `role_name`

**Foreign Keys**:
- Referenced by `role_permissions.role_id`

---

### 4. permissions
**Status**: ✅ EXISTS (52 rows)  
**RLS**: Disabled  
**Purpose**: Stores permission definitions

**Columns**:
- `id` (uuid, PK) - Permission ID
- `permission_name` (text, unique) - Permission name (format: resource:action)
- `resource_type` (text) - Resource type
- `action` (text) - Action
- `description` (text, nullable) - Description
- `is_active` (boolean, default: true) - Active status
- `created_at` (timestamptz, default: now()) - Creation timestamp
- `updated_at` (timestamptz, default: now()) - Update timestamp

**Indexes**:
- Primary key on `id`
- Unique on `permission_name`

---

### 5. role_permissions
**Status**: ✅ EXISTS (71 rows)  
**RLS**: Enabled  
**Purpose**: Maps roles to permissions

**Columns**:
- `id` (uuid, PK) - Mapping ID
- `role_id` (uuid, FK → healthcare_roles.id) - Role ID
- `permission_name` (text) - Permission name
- `resource_type` (text) - Resource type
- `actions` (text[]) - Actions array
- `conditions` (jsonb, default: {}) - Conditions
- `is_active` (boolean, default: true) - Active status
- `created_at` (timestamptz, default: now()) - Creation timestamp

**Indexes**:
- Primary key on `id`
- Index on `role_id`

---

### 6. user_roles
**Status**: ✅ EXISTS (0 rows)  
**RLS**: Enabled  
**Purpose**: Maps users to roles

**Columns**:
- `id` (uuid, PK) - Mapping ID
- `user_id` (uuid, FK → user_profiles.id) - User ID
- `role_name` (varchar) - Role name (ADMIN, RECEPTIONIST, DOCTOR, NURSE, PATIENT)
- `assigned_at` (timestamptz, default: now()) - Assignment timestamp
- `assigned_by` (varchar, nullable) - Assigner user ID

**Indexes**:
- Primary key on `id`
- Index on `user_id`

---

### 7. user_permissions
**Status**: ✅ EXISTS (0 rows)  
**RLS**: Enabled  
**Purpose**: Maps users to permissions (PBAC)

**Columns**:
- `id` (uuid, PK) - Mapping ID
- `user_id` (uuid, FK → user_profiles.id) - User ID
- `permission_name` (varchar) - Permission name
- `granted_at` (timestamptz, default: now()) - Grant timestamp
- `granted_by` (varchar, nullable) - Granter user ID

**Indexes**:
- Primary key on `id`
- Index on `user_id`

---

## Security Tables

### 8. login_attempts
**Status**: ✅ EXISTS (0 rows)  
**RLS**: Enabled  
**Purpose**: Tracks login attempts for security monitoring

**Columns**:
- `id` (uuid, PK) - Attempt ID
- `email` (varchar) - Email attempted
- `user_id` (uuid, nullable) - User ID (if found)
- `ip_address` (varchar) - IP address
- `user_agent` (text, nullable) - User agent
- `success` (boolean, default: false) - Success status
- `failure_reason` (text, nullable) - Failure reason
- `attempted_at` (timestamptz, default: now()) - Attempt timestamp
- `created_at` (timestamptz, default: now()) - Creation timestamp

**Indexes**:
- Primary key on `id`
- Index on `email`
- Index on `user_id`
- Index on `attempted_at`

---

### 9. password_policies
**Status**: ✅ EXISTS (1 row)  
**RLS**: Enabled  
**Purpose**: Stores password policy configurations

**Columns**:
- `id` (uuid, PK) - Policy ID
- `min_length` (integer, default: 8) - Minimum length (6-128)
- `require_uppercase` (boolean, default: true) - Require uppercase
- `require_lowercase` (boolean, default: true) - Require lowercase
- `require_numbers` (boolean, default: true) - Require numbers
- `require_special_chars` (boolean, default: false) - Require special chars
- `expiration_days` (integer, nullable) - Expiration days (1-365)
- `prevent_reuse` (integer, default: 3) - Prevent reuse count (0-24)
- `is_active` (boolean, default: true) - Active status
- `created_at` (timestamptz, default: now()) - Creation timestamp
- `updated_at` (timestamptz, default: now()) - Update timestamp
- `updated_by` (varchar) - Updater user ID

**Indexes**:
- Primary key on `id`
- Index on `is_active`

---

### 10. password_reset_tokens
**Status**: ✅ EXISTS (0 rows)  
**RLS**: Enabled  
**Purpose**: Stores password reset tokens

**Columns**:
- `id` (uuid, PK) - Token ID
- `user_id` (uuid, FK → user_profiles.id) - User ID
- `token_hash` (text, unique) - Token hash
- `expires_at` (timestamptz) - Expiration timestamp
- `used_at` (timestamptz, nullable) - Usage timestamp
- `created_at` (timestamptz, default: now()) - Creation timestamp

**Indexes**:
- Primary key on `id`
- Unique on `token_hash`
- Index on `user_id`

---

## Audit Tables

### 11. audit_logs
**Status**: ✅ EXISTS (0 rows)  
**RLS**: Enabled  
**Purpose**: Stores audit logs for security and compliance

**Columns**:
- `id` (uuid, PK) - Log ID
- `actor_id` (uuid, nullable) - Actor user ID
- `action` (varchar) - Action performed
- `resource_type` (varchar, nullable) - Resource type
- `resource_id` (varchar, nullable) - Resource ID
- `details` (jsonb, default: {}) - Details
- `severity` (varchar, default: 'info') - Severity (info, warning, error, critical)
- `ip_address` (inet, nullable) - IP address
- `user_agent` (text, nullable) - User agent
- `session_id` (varchar, nullable) - Session ID
- `success` (boolean, default: true) - Success status
- `created_at` (timestamptz, default: now()) - Creation timestamp
- `actor_info` (jsonb, nullable) - Actor information

**Indexes**:
- Primary key on `id`
- Index on `actor_id`
- Index on `action`
- Index on `created_at`

---

## Recovery Tables

### 12. recovery_methods
**Status**: ✅ EXISTS (0 rows)  
**RLS**: Enabled  
**Purpose**: Stores user recovery methods

**Columns**:
- `id` (uuid, PK) - Method ID
- `user_id` (uuid, unique, FK → auth.users.id) - User ID
- `recovery_email` (text, nullable) - Recovery email
- `recovery_email_verified` (boolean, default: false) - Verification status
- `recovery_email_verified_at` (timestamptz, nullable) - Verification timestamp
- `last_updated_at` (timestamptz, default: now()) - Last update timestamp
- `updated_by` (uuid, nullable, FK → auth.users.id) - Updater user ID
- `created_at` (timestamptz, default: now()) - Creation timestamp

**Indexes**:
- Primary key on `id`
- Unique on `user_id`

---

### 13. recovery_history
**Status**: ✅ EXISTS (0 rows)  
**RLS**: Enabled  
**Purpose**: Logs password recovery attempts

**Columns**:
- `id` (uuid, PK) - History ID
- `user_id` (uuid, FK → auth.users.id) - User ID
- `recovery_method` (text) - Recovery method (primary_email, recovery_email)
- `attempt_type` (text) - Attempt type (request_reset, verify_token, reset_password)
- `success` (boolean) - Success status
- `failure_reason` (text, nullable) - Failure reason
- `ip_address` (text, nullable) - IP address
- `user_agent` (text, nullable) - User agent
- `attempted_at` (timestamptz, default: now()) - Attempt timestamp

**Indexes**:
- Primary key on `id`
- Index on `user_id`
- Index on `attempted_at`

---

## MFA Tables

### 14. two_factor_auth
**Status**: ✅ EXISTS (0 rows)  
**RLS**: Enabled  
**Purpose**: Stores MFA settings for users

**Columns**:
- `id` (uuid, PK) - MFA ID
- `user_id` (uuid, unique) - User ID
- `is_enabled` (boolean, default: false) - Enabled status
- `method` (varchar, default: 'app') - Method (app, sms, email)
- `secret_key` (text, nullable) - TOTP secret key
- `backup_codes` (text[], nullable) - Backup codes
- `phone_number` (varchar, nullable) - Phone number
- `email` (varchar, nullable) - Email
- `created_at` (timestamptz, default: now()) - Creation timestamp
- `updated_at` (timestamptz, default: now()) - Update timestamp
- `last_used_at` (timestamptz, nullable) - Last usage timestamp

**Indexes**:
- Primary key on `id`
- Unique on `user_id`

---

### 15. two_factor_attempts
**Status**: ✅ EXISTS (0 rows)  
**RLS**: Enabled  
**Purpose**: Logs MFA verification attempts

**Columns**:
- `id` (uuid, PK) - Attempt ID
- `user_id` (uuid) - User ID
- `attempt_type` (varchar) - Attempt type (login, setup, disable)
- `method` (varchar) - Method (app, sms, email, backup)
- `code_used` (text, nullable) - Code used
- `is_successful` (boolean, default: false) - Success status
- `ip_address` (inet, nullable) - IP address
- `user_agent` (text, nullable) - User agent
- `created_at` (timestamptz, default: now()) - Creation timestamp

**Indexes**:
- Primary key on `id`
- Index on `user_id`
- Index on `created_at`

---

## Additional Tables

### 16. staff_invitations
**Status**: ✅ EXISTS (0 rows)  
**RLS**: Enabled  
**Purpose**: Manages staff invitation workflow

### 17. security_events
**Status**: ✅ EXISTS (0 rows)  
**RLS**: Enabled  
**Purpose**: Tracks security events

---

## Notes

1. **All tables exist on Supabase** - Verified on 2025-10-07
2. **RLS is enabled** on most tables for security
3. **Indexes are properly configured** for performance
4. **Foreign keys maintain referential integrity**
5. **JSONB columns** are used for flexible data storage
6. **Timestamps** use `timestamptz` for timezone awareness

---

## Migration Status

- ✅ Migration 001: auth_update_last_login_function
- ✅ Migration 002: login_attempts table
- ✅ Migration 003: auth_user_profiles_view
- ✅ Migration 004: pure_rbac_schema
- ✅ Migration 005: simplify_roles_to_5_core
- ✅ Migration 006: password_policies table
- ✅ Migration 007: recovery tables
- ✅ Migration 008: user_sessions table

---

**Last Verified**: 2025-10-07 via Supabase MCP  
**Total Tables**: 17 core tables + additional support tables

