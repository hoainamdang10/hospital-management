# Pending Registration Cleanup Guide

## Overview

This document describes the cleanup system for pending registrations in the Identity Service. The system prevents orphaned records and ensures database cleanliness.

## Problem Statement

When user registration fails (e.g., email sending fails), pending registration records can become "orphaned" - stuck in the database and blocking future registration attempts with the same email.

## Solution Architecture

### 1. Status Column

Added `status` column to track registration state:

- `PENDING` - Created, email not sent yet
- `EMAIL_SENT` - Email sent successfully
- `VERIFIED` - User verified email
- `FAILED` - Email sending failed
- `EXPIRED` - Token expired

### 2. Enhanced Error Handling

**RegisterUserUseCase** now includes:
- Try-catch for rollback delete operation
- Fallback to mark as `FAILED` if delete fails
- Detailed logging for debugging

### 3. Cleanup Scripts

Three scripts for managing pending registrations:

#### a. Check Orphaned Records
```bash
npm run check:orphaned
```

**Purpose**: Inspect database for orphaned records

**Output**:
- Summary of all pending registrations
- Categorized by status (Active, Orphaned, Expired, Used)
- JSON report saved to `scripts/orphaned-report-{timestamp}.json`

**When to use**:
- Before implementing fixes
- After deployment to verify cleanup
- Debugging registration issues

#### b. Manual Cleanup
```bash
npm run cleanup:pending-registrations
```

**Purpose**: One-time cleanup of stale records

**What it does**:
- Deletes `VERIFIED` records
- Deletes `EXPIRED` records
- Deletes `FAILED` records
- Deletes `EMAIL_SENT` records that have expired
- Logs audit event

**When to use**:
- After fixing orphaned records issue
- Before deployment
- Manual database maintenance

#### c. Cron Job Cleanup
```bash
npm run cron:cleanup
```

**Purpose**: Continuous cleanup running every hour

**What it does**:
- Runs cleanup every 60 minutes
- Tracks statistics (total runs, total deleted)
- Logs audit events
- Graceful shutdown on SIGINT/SIGTERM

**When to use**:
- Production environment (run as background service)
- Development environment (optional)

## Database Migration

### Migration 010: Add Status Column

**File**: `migrations/010_add_status_to_pending_registrations.sql`

**Changes**:
1. Add `status` column with CHECK constraint
2. Update existing records based on current state
3. Update unique constraint to use status
4. Create indexes for status-based queries
5. Update cleanup function
6. Add `mark_pending_registration_failed()` function

**To apply**:
```bash
# Using Supabase CLI
supabase db push

# Or manually via SQL editor
# Copy content from migration file and execute
```

**Rollback**:
```sql
-- See rollback script at end of migration file
```

## Usage Examples

### Scenario 1: Check for Orphaned Records

```bash
# Run check script
npm run check:orphaned

# Review output
# If orphaned records found, run cleanup
npm run cleanup:pending-registrations
```

### Scenario 2: Production Deployment

```bash
# 1. Apply migration
supabase db push

# 2. Check current state
npm run check:orphaned

# 3. Clean up existing orphaned records
npm run cleanup:pending-registrations

# 4. Start cron job (in production)
npm run cron:cleanup
# Or use PM2:
pm2 start npm --name "cleanup-cron" -- run cron:cleanup
```

### Scenario 3: Debugging Registration Issues

```bash
# 1. User reports "email already exists" error
# 2. Check for orphaned records
npm run check:orphaned

# 3. Review JSON report
cat scripts/orphaned-report-*.json

# 4. If orphaned record found, clean up
npm run cleanup:pending-registrations

# 5. User can now register again
```

## Monitoring

### Audit Logs

All cleanup operations are logged to `auth_schema.audit_logs`:

```sql
SELECT * FROM auth_schema.audit_logs
WHERE action IN (
  'CLEANUP_PENDING_REGISTRATIONS',
  'CRON_CLEANUP_PENDING_REGISTRATIONS',
  'PENDING_REGISTRATION_STATUS_UPDATED'
)
ORDER BY created_at DESC
LIMIT 10;
```

### Metrics to Track

1. **Orphaned Records Count**
   ```sql
   SELECT COUNT(*) FROM auth_schema.pending_registrations
   WHERE status IN ('PENDING', 'EMAIL_SENT')
   AND created_at < NOW() - INTERVAL '1 hour';
   ```

2. **Failed Registrations**
   ```sql
   SELECT COUNT(*) FROM auth_schema.pending_registrations
   WHERE status = 'FAILED';
   ```

3. **Cleanup Effectiveness**
   ```sql
   SELECT 
     action,
     details->>'deletedCount' as deleted_count,
     created_at
   FROM auth_schema.audit_logs
   WHERE action = 'CRON_CLEANUP_PENDING_REGISTRATIONS'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

## Production Setup

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start cron job
pm2 start npm --name "identity-cleanup-cron" -- run cron:cleanup

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Using Systemd (Linux)

Create `/etc/systemd/system/identity-cleanup.service`:

```ini
[Unit]
Description=Identity Service Cleanup Cron
After=network.target

[Service]
Type=simple
User=nodejs
WorkingDirectory=/path/to/identity-service
ExecStart=/usr/bin/npm run cron:cleanup
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable identity-cleanup
sudo systemctl start identity-cleanup
sudo systemctl status identity-cleanup
```

### Using Docker Compose

Add to `docker-compose.yml`:

```yaml
services:
  identity-cleanup-cron:
    build:
      context: ./identity-service
      dockerfile: Dockerfile
    command: npm run cron:cleanup
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    restart: unless-stopped
    depends_on:
      - identity-service
```

## Troubleshooting

### Issue: Cron job not deleting records

**Check**:
1. Verify migration applied: `SELECT * FROM auth_schema.pending_registrations LIMIT 1;`
2. Check status column exists
3. Review audit logs for errors
4. Verify Supabase credentials

### Issue: Too many orphaned records

**Solution**:
1. Run manual cleanup: `npm run cleanup:pending-registrations`
2. Check email service health
3. Review error logs for email sending failures
4. Consider increasing cleanup frequency

### Issue: Cleanup deleting active registrations

**Check**:
1. Verify unique constraint: 
   ```sql
   SELECT * FROM information_schema.table_constraints
   WHERE table_name = 'pending_registrations'
   AND constraint_name = 'pending_registrations_email_active_unique';
   ```
2. Check status values are correct
3. Review cleanup logic in script

## Best Practices

1. **Run check before cleanup**: Always run `check:orphaned` before `cleanup:pending-registrations`
2. **Monitor audit logs**: Regularly review cleanup audit logs
3. **Alert on high orphaned count**: Set up alerts if orphaned records > 10
4. **Test in staging first**: Test cleanup scripts in staging before production
5. **Backup before migration**: Always backup database before applying migration
6. **Review JSON reports**: Keep JSON reports for debugging

## Related Files

- `migrations/010_add_status_to_pending_registrations.sql` - Database migration
- `scripts/check-orphaned-pending-registrations.ts` - Check script
- `scripts/cleanup-pending-registrations.ts` - Manual cleanup script
- `scripts/cron-cleanup-pending-registrations.ts` - Cron job script
- `src/domain/entities/PendingRegistration.ts` - Domain entity with status
- `src/infrastructure/repositories/SupabasePendingRegistrationRepository.ts` - Repository with status support
- `src/application/use-cases/RegisterUserUseCase.ts` - Enhanced error handling
- `src/application/use-cases/VerifyEmailUseCase.ts` - Status update on verification

## Version History

- **v1.0.0** (2025-10-18) - Initial implementation
  - Added status column
  - Created cleanup scripts
  - Enhanced error handling
  - Added cron job support

---

**Author**: Hospital Management Team
**Last Updated**: 2025-10-18
**Status**: Production Ready
