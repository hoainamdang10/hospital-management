# Database Entity Relationship Diagram (ERD)

**Last Updated**: 2025-10-07  
**Database**: Supabase (PostgreSQL)  
**Schema**: auth_schema

> ⚠️ **IMPORTANT**: This ERD reflects the ACTUAL database schema on Supabase.  
> All tables and relationships shown here exist and are verified.

---

## ERD Diagram

```mermaid
erDiagram
    %% Core Tables
    user_profiles ||--o{ user_sessions : "has many"
    user_profiles ||--o{ user_roles : "has many"
    user_profiles ||--o{ user_permissions : "has many"
    user_profiles ||--o{ password_reset_tokens : "has many"
    user_profiles ||--o{ login_attempts : "has many"
    
    %% RBAC Relationships
    healthcare_roles ||--o{ role_permissions : "has many"
    user_roles }o--|| healthcare_roles : "references"
    
    %% MFA Relationships
    user_profiles ||--o| two_factor_auth : "has one"
    user_profiles ||--o{ two_factor_attempts : "has many"
    
    %% Recovery Relationships
    user_profiles ||--o| recovery_methods : "has one"
    user_profiles ||--o{ recovery_history : "has many"
    
    %% Audit Relationships
    user_profiles ||--o{ audit_logs : "creates"
    
    %% Staff Invitations
    user_profiles ||--o{ staff_invitations : "invites"
    user_profiles ||--o{ staff_invitations : "accepts"
    
    %% Core Tables Definitions
    user_profiles {
        uuid id PK
        text email UK
        text username UK
        text full_name
        varchar phone_number
        text role_type
        boolean is_active
        boolean is_verified
        varchar citizen_id UK
        date date_of_birth
        text gender
        timestamptz created_at
        timestamptz updated_at
    }
    
    user_sessions {
        uuid id PK
        uuid user_id FK
        text session_token UK
        jsonb device_info
        inet ip_address
        text user_agent
        timestamptz expires_at
        boolean is_active
        timestamptz created_at
        timestamptz last_accessed_at
    }
    
    %% RBAC Tables
    healthcare_roles {
        uuid id PK
        text role_name UK
        text role_description
        jsonb permissions
        boolean is_active
        timestamptz created_at
    }
    
    permissions {
        uuid id PK
        text permission_name UK
        text resource_type
        text action
        text description
        boolean is_active
        timestamptz created_at
    }
    
    role_permissions {
        uuid id PK
        uuid role_id FK
        text permission_name
        text resource_type
        text_array actions
        jsonb conditions
        boolean is_active
        timestamptz created_at
    }
    
    user_roles {
        uuid id PK
        uuid user_id FK
        varchar role_name
        timestamptz assigned_at
        varchar assigned_by
    }
    
    user_permissions {
        uuid id PK
        uuid user_id FK
        varchar permission_name
        timestamptz granted_at
        varchar granted_by
    }
    
    %% Security Tables
    login_attempts {
        uuid id PK
        varchar email
        uuid user_id FK
        varchar ip_address
        text user_agent
        boolean success
        text failure_reason
        timestamptz attempted_at
    }
    
    password_policies {
        uuid id PK
        integer min_length
        boolean require_uppercase
        boolean require_lowercase
        boolean require_numbers
        boolean require_special_chars
        integer expiration_days
        integer prevent_reuse
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }
    
    password_reset_tokens {
        uuid id PK
        uuid user_id FK
        text token_hash UK
        timestamptz expires_at
        timestamptz used_at
        timestamptz created_at
    }
    
    %% Audit Tables
    audit_logs {
        uuid id PK
        uuid actor_id FK
        varchar action
        varchar resource_type
        varchar resource_id
        jsonb details
        varchar severity
        inet ip_address
        text user_agent
        varchar session_id
        boolean success
        timestamptz created_at
    }
    
    %% Recovery Tables
    recovery_methods {
        uuid id PK
        uuid user_id FK UK
        text recovery_email
        boolean recovery_email_verified
        timestamptz recovery_email_verified_at
        timestamptz last_updated_at
        uuid updated_by FK
        timestamptz created_at
    }
    
    recovery_history {
        uuid id PK
        uuid user_id FK
        text recovery_method
        text attempt_type
        boolean success
        text failure_reason
        text ip_address
        text user_agent
        timestamptz attempted_at
    }
    
    %% MFA Tables
    two_factor_auth {
        uuid id PK
        uuid user_id FK UK
        boolean is_enabled
        varchar method
        text secret_key
        text_array backup_codes
        varchar phone_number
        varchar email
        timestamptz created_at
        timestamptz updated_at
        timestamptz last_used_at
    }
    
    two_factor_attempts {
        uuid id PK
        uuid user_id FK
        varchar attempt_type
        varchar method
        text code_used
        boolean is_successful
        inet ip_address
        text user_agent
        timestamptz created_at
    }
    
    %% Staff Management
    staff_invitations {
        uuid id PK
        varchar email
        varchar role
        varchar department_id
        uuid invited_by FK
        varchar invitation_token UK
        timestamptz expires_at
        timestamptz accepted_at
        uuid accepted_by FK
        varchar status
        jsonb invitation_data
        timestamptz created_at
        timestamptz updated_at
    }
```

---

## Table Relationships Summary

### Core Relationships
1. **user_profiles → user_sessions**: One-to-Many (User can have multiple active sessions)
2. **user_profiles → user_roles**: One-to-Many (User can have multiple roles)
3. **user_profiles → user_permissions**: One-to-Many (User can have multiple permissions)

### RBAC Relationships
4. **healthcare_roles → role_permissions**: One-to-Many (Role has many permissions)
5. **user_roles → healthcare_roles**: Many-to-One (Role assignment references healthcare role)

### Security Relationships
6. **user_profiles → login_attempts**: One-to-Many (User has many login attempts)
7. **user_profiles → password_reset_tokens**: One-to-Many (User can request multiple resets)

### MFA Relationships
8. **user_profiles → two_factor_auth**: One-to-One (User has one MFA config)
9. **user_profiles → two_factor_attempts**: One-to-Many (User has many MFA attempts)

### Recovery Relationships
10. **user_profiles → recovery_methods**: One-to-One (User has one recovery method config)
11. **user_profiles → recovery_history**: One-to-Many (User has many recovery attempts)

### Audit Relationships
12. **user_profiles → audit_logs**: One-to-Many (User creates many audit logs)

---

## Key Constraints

### Primary Keys
- All tables use `uuid` as primary key
- Generated using `gen_random_uuid()` or `uuid_generate_v4()`

### Unique Constraints
- `user_profiles.email` - Unique
- `user_profiles.username` - Unique
- `user_profiles.citizen_id` - Unique
- `user_sessions.session_token` - Unique
- `healthcare_roles.role_name` - Unique
- `permissions.permission_name` - Unique
- `password_reset_tokens.token_hash` - Unique
- `two_factor_auth.user_id` - Unique
- `recovery_methods.user_id` - Unique
- `staff_invitations.invitation_token` - Unique

### Foreign Keys
- All foreign keys reference `user_profiles.id` or `healthcare_roles.id`
- Cascade delete on user deletion (for sessions, tokens, etc.)
- Maintain referential integrity

---

## Indexes

### Performance Indexes
- `user_sessions`: (user_id, is_active), session_token, expires_at
- `login_attempts`: email, user_id, attempted_at
- `audit_logs`: actor_id, action, created_at
- `user_roles`: user_id
- `user_permissions`: user_id
- `role_permissions`: role_id
- `two_factor_attempts`: user_id, created_at
- `recovery_history`: user_id, attempted_at

---

## RLS (Row Level Security)

### Enabled Tables
- ✅ user_profiles
- ✅ user_sessions
- ✅ user_roles
- ✅ user_permissions
- ✅ role_permissions
- ✅ login_attempts
- ✅ password_policies
- ✅ password_reset_tokens
- ✅ audit_logs
- ✅ recovery_methods
- ✅ recovery_history
- ✅ two_factor_auth
- ✅ two_factor_attempts
- ✅ staff_invitations

### Disabled Tables
- ❌ healthcare_roles (system table)
- ❌ permissions (system table)

---

## Notes

1. **All relationships are verified** on Supabase (2025-10-07)
2. **Foreign keys maintain referential integrity**
3. **Indexes optimize query performance**
4. **RLS policies enforce security**
5. **JSONB columns provide flexibility**
6. **Timestamps use timestamptz for timezone awareness**

---

**Last Verified**: 2025-10-07 via Supabase MCP  
**Total Tables**: 17 core tables  
**Total Relationships**: 12+ foreign key relationships

