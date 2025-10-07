# Database Migrations - Identity Service

This directory contains SQL migration scripts for the Identity Service database schema.

## 📁 Migration Files

| File | Purpose | Status | Dependencies |
|------|---------|--------|--------------|
| `001_create_auth_update_last_login_function.sql` | Create function to update last login timestamp | ✅ Ready | `auth_schema.user_profiles` |
| `002_create_login_attempts_table.sql` | Create table for tracking login attempts | ✅ Ready | None |
| `003_create_auth_user_profiles_view.sql` | Create view for user profiles with roles/permissions | ✅ Ready | `auth_schema.user_profiles`, `auth_schema.roles`, `auth_schema.permissions` |
| `remove_user_profile_trigger.sql` | Remove trigger that auto-creates user profiles | ✅ Ready | None |

---

## 🚀 How to Run Migrations

### **Option 1: Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the migration SQL
4. Click **Run** to execute

### **Option 2: Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migration
supabase db push --file migrations/001_create_auth_update_last_login_function.sql
supabase db push --file migrations/002_create_login_attempts_table.sql
supabase db push --file migrations/003_create_auth_user_profiles_view.sql
```

### **Option 3: psql Command Line**

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run migrations
\i migrations/001_create_auth_update_last_login_function.sql
\i migrations/002_create_login_attempts_table.sql
\i migrations/003_create_auth_user_profiles_view.sql
```

---

## 📋 Migration Order

**IMPORTANT**: Run migrations in this order:

1. ✅ `001_create_auth_update_last_login_function.sql`
2. ✅ `002_create_login_attempts_table.sql`
3. ✅ `003_create_auth_user_profiles_view.sql`
4. ✅ `remove_user_profile_trigger.sql` (if trigger exists)

---

## 🔍 Verification

After running migrations, verify they were successful:

```sql
-- Check function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'auth_update_user_last_login';

-- Check table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'login_attempts';

-- Check view exists
SELECT table_name, table_schema 
FROM information_schema.views 
WHERE table_name = 'auth_user_profiles_view';

-- Test function
SELECT auth_update_user_last_login('00000000-0000-0000-0000-000000000000');

-- Test view
SELECT * FROM public.auth_user_profiles_view LIMIT 1;

-- Test login_attempts table
INSERT INTO auth_schema.login_attempts (email, ip_address, success) 
VALUES ('test@example.com', '192.168.1.1', true);

SELECT * FROM auth_schema.login_attempts ORDER BY attempted_at DESC LIMIT 1;
```

---

## 🛠️ Rollback

If you need to rollback migrations:

```sql
-- Rollback 003: Drop view
DROP VIEW IF EXISTS public.auth_user_profiles_view CASCADE;
DROP FUNCTION IF EXISTS public.get_user_profile_by_id(UUID);
DROP FUNCTION IF EXISTS public.get_user_profile_by_email(VARCHAR);

-- Rollback 002: Drop table
DROP TABLE IF EXISTS auth_schema.login_attempts CASCADE;
DROP FUNCTION IF EXISTS auth_schema.cleanup_old_login_attempts();

-- Rollback 001: Drop function
DROP FUNCTION IF EXISTS auth_update_user_last_login(UUID);
```

---

## 📝 Migration Details

### **001: auth_update_user_last_login Function**

**Purpose**: Update user's last login timestamp  
**Used by**: `SupabaseAuthClient.updateLastLogin()`  
**Security**: SECURITY DEFINER (runs with function owner's privileges)

**Example Usage**:
```typescript
await this.supabaseClient.rpc('auth_update_user_last_login', { 
  user_id: userId 
});
```

---

### **002: login_attempts Table**

**Purpose**: Track all login attempts for security and audit  
**Used by**: `SupabaseAuthClient.updateLastLogin()`  
**Schema**: `auth_schema.login_attempts`

**Columns**:
- `id` (UUID): Primary key
- `email` (VARCHAR): Email used in login attempt
- `user_id` (UUID): Optional link to user_profiles
- `ip_address` (VARCHAR): Client IP address
- `user_agent` (TEXT): Client user agent
- `success` (BOOLEAN): Whether login succeeded
- `failure_reason` (TEXT): Reason for failure
- `attempted_at` (TIMESTAMPTZ): When attempt occurred

**Indexes**:
- `idx_login_attempts_email`
- `idx_login_attempts_user_id`
- `idx_login_attempts_attempted_at`
- `idx_login_attempts_ip_address`
- `idx_login_attempts_success`
- `idx_login_attempts_email_attempted_at`

**Example Usage**:
```typescript
await this.supabaseClient
  .from('login_attempts')
  .insert({
    email: 'user@example.com',
    ip_address: '192.168.1.1',
    success: true,
    attempted_at: new Date().toISOString()
  });
```

---

### **003: auth_user_profiles_view View**

**Purpose**: Unified view of user profiles with roles and permissions  
**Used by**: `SupabaseAuthClient.getUserProfile()`  
**Schema**: `public.auth_user_profiles_view`

**Returns**:
- All user profile fields
- `roles` (JSON array): User's roles
- `permissions` (JSON array): User's permission codes
- `permission_details` (JSON array): Full permission details

**Example Usage**:
```typescript
const { data, error } = await this.supabaseClient
  .from('auth_user_profiles_view')
  .select('*')
  .eq('id', userId)
  .single();
```

**Helper Functions**:
- `get_user_profile_by_id(user_id UUID)`: Get profile by ID
- `get_user_profile_by_email(user_email VARCHAR)`: Get profile by email

---

## 🔒 Security Considerations

1. **SECURITY DEFINER Functions**: Run with function owner's privileges
   - `auth_update_user_last_login`
   - `get_user_profile_by_id`
   - `get_user_profile_by_email`

2. **Row Level Security (RLS)**:
   - `login_attempts` table has RLS enabled
   - Service role can manage all records
   - Users can only view their own login attempts

3. **Permissions**:
   - `authenticated` role: Can execute functions and view data
   - `service_role`: Full access to all objects

---

## 📚 References

- **Architecture Debt Analysis**: `../ARCHITECTURE_DEBT_ANALYSIS.md`
- **Trigger Analysis**: `../TRIGGER_ANALYSIS.md`
- **Bug Fix Report**: `../FINAL_BUG_FIX_REPORT.md`

---

## ⚠️ Important Notes

1. **Run migrations before deploying code** that depends on these objects
2. **Test migrations in development** before running in production
3. **Backup database** before running migrations in production
4. **Monitor performance** after creating indexes and views
5. **Clean up old login attempts** periodically using `cleanup_old_login_attempts()`

---

## 🎯 Success Criteria

- [ ] All migrations run without errors
- [ ] All objects created successfully
- [ ] Verification queries return expected results
- [ ] Application code works with new objects
- [ ] No performance degradation
- [ ] RLS policies working correctly

---

**Last Updated**: 2025-01-XX  
**Maintainer**: Hospital Management Team  
**Version**: 2.0.0

