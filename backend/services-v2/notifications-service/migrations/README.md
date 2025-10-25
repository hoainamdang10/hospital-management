# Notifications Service - Database Migrations

## 📋 Migration Files Overview

| File | Description | Tables Created | Status |
|------|-------------|----------------|--------|
| `001_create_inbox_table.sql` | Inbox Pattern for event deduplication | `inbox` | ✅ Applied |
| `002_create_notifications_table.sql` | Main notifications table | `notifications` | 🔄 Pending |
| `003_create_notification_templates_table.sql` | Vietnamese healthcare templates | `notification_templates` | 🔄 Pending |
| `004_create_notification_preferences_table.sql` | User preferences & opt-outs | `notification_preferences` | 🔄 Pending |
| `005_create_delivery_results_table.sql` | Channel delivery tracking | `notification_delivery_results` | 🔄 Pending |
| `006_create_notification_analytics_table.sql` | Aggregated analytics | `notification_analytics` | 🔄 Pending |
| `007_create_channel_health_table.sql` | Channel health monitoring | `channel_health` | 🔄 Pending |
| `008_create_notification_audit_log_table.sql` | HIPAA audit trail | `notification_audit_log` | 🔄 Pending |
| `009_create_indexes_and_performance.sql` | Performance indexes | N/A | 🔄 Pending |
| `010_create_cleanup_and_maintenance.sql` | Maintenance functions | N/A | 🔄 Pending |

---

## 🗄️ Database Schema Structure

```
notifications_schema
├── inbox (Inbox Pattern)
│   ├── idempotency_key (unique)
│   ├── event_type
│   └── status (PENDING/PROCESSING/COMPLETED/FAILED)
│
├── notifications (Main Table)
│   ├── notification_id (business key)
│   ├── recipient_id, recipient_type
│   ├── template_type, subject, body
│   ├── channels[], status, priority
│   ├── scheduled_at, sent_at, delivered_at
│   ├── healthcare_context (JSONB)
│   └── retry_count, next_retry_at
│
├── notification_templates
│   ├── template_id, template_type
│   ├── language (vi/en)
│   ├── subject_template, body_template, html_template
│   ├── sms_template, push_template
│   ├── supported_channels[]
│   ├── placeholders (JSONB)
│   ├── is_vietnamese_healthcare_compliant
│   └── usage_count, avg_success_rate
│
├── notification_preferences
│   ├── user_id (unique)
│   ├── preferred_channels[], enabled_channels[]
│   ├── opt_out_* (marketing, reminders, emergency)
│   ├── preferred_language, timezone
│   ├── quiet_hours_start, quiet_hours_end
│   └── max_notifications_per_day
│
├── notification_delivery_results
│   ├── notification_id, channel
│   ├── status, success, delivered_at
│   ├── failure_reason, error_message
│   ├── provider_id, provider_message_id
│   ├── delivery_time_ms, cost_amount
│   └── opened_at, clicked_at (engagement)
│
├── notification_analytics
│   ├── date, hour, day_of_week
│   ├── channel, template_type, recipient_type
│   ├── total_sent, total_delivered, total_failed
│   ├── delivery_rate, avg_delivery_time_ms
│   └── total_cost
│
├── channel_health
│   ├── channel (EMAIL/SMS/PUSH/IN_APP/VOICE)
│   ├── is_healthy, health_status
│   ├── success_rate, avg_delivery_time_ms
│   ├── rate_limit_max_requests, rate_limit_remaining
│   └── last_successful_delivery, last_failure
│
└── notification_audit_log (HIPAA Compliance)
    ├── event_type (NOTIFICATION_*, PREFERENCES_*, OPT_*)
    ├── notification_id, user_id, actor_id
    ├── healthcare_context, phi_accessed
    ├── ip_address, user_agent, session_id
    └── old_values, new_values
```

---

## 🚀 How to Apply Migrations

### Option 1: Manual Application (Supabase Dashboard)

1. Go to Supabase Dashboard → SQL Editor
2. Copy & paste each migration file in order
3. Execute one by one
4. Verify with:
   ```sql
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'notifications_schema' 
   ORDER BY tablename;
   ```

### Option 2: Using Supabase CLI

```bash
# From project root
cd backend/services-v2/notifications-service

# Apply all migrations
for file in migrations/*.sql; do
  supabase db execute --file "$file"
done
```

### Option 3: Using psql

```bash
# Set connection string
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[HOST]:[PORT]/postgres"

# Apply all migrations
cd backend/services-v2/notifications-service
for file in migrations/*.sql; do
  psql $DATABASE_URL -f "$file"
done
```

### Option 4: Using MCP Tool (Programmatic)

```typescript
// Apply via Supabase MCP
await mcp_supabase_apply_migration({
  project_id: "your-project-id",
  name: "create_notifications_table",
  query: fs.readFileSync('migrations/002_create_notifications_table.sql', 'utf8')
});
```

---

## 🧪 Verification Queries

After applying migrations, run these queries to verify:

### Check All Tables Created
```sql
SELECT tablename, tableowner 
FROM pg_tables 
WHERE schemaname = 'notifications_schema' 
ORDER BY tablename;
```

Expected output (10 tables):
- `channel_health`
- `inbox`
- `notification_analytics`
- `notification_audit_log`
- `notification_delivery_results`
- `notification_preferences`
- `notification_templates`
- `notifications`

### Check Row Level Security
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'notifications_schema';
```

All tables should have `rowsecurity = TRUE`.

### Check Indexes
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'notifications_schema' 
ORDER BY tablename, indexname;
```

Should see 50+ indexes.

### Check Functions
```sql
SELECT proname, prosrc 
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'notifications_schema'
ORDER BY proname;
```

Should see 20+ functions including:
- `mark_notification_as_sent`
- `mark_notification_as_failed`
- `get_notifications_for_retry`
- `can_user_receive_notification`
- `increment_template_usage`
- `calculate_channel_health`
- `run_daily_maintenance`

### Check Default Data
```sql
-- Vietnamese healthcare templates
SELECT template_id, name, language, is_active 
FROM notifications_schema.notification_templates
WHERE language = 'vi';
```

Should see 4 templates:
- `appointment-confirmation-vi`
- `appointment-reminder-vi`
- `test-results-ready-vi`
- `payment-reminder-vi`

```sql
-- Channel health
SELECT channel, is_healthy, provider_id 
FROM notifications_schema.channel_health;
```

Should see 5 channels initialized.

---

## 📊 Key Features

### 1. Inbox Pattern (Idempotent Event Processing)
```sql
-- Check for duplicate events
SELECT * FROM notifications_schema.process_event_idempotent(
  'event-123',
  'schedule.run.due',
  '{"recipient": {...}}'::JSONB,
  '{"idempotency_key": "event-123"}'::JSONB
);
```

### 2. Vietnamese Healthcare Templates
```sql
-- Get active Vietnamese template
SELECT * FROM notifications_schema.get_active_template(
  'APPOINTMENT_CONFIRMATION',
  'vi'
);
```

### 3. User Preferences & Opt-Outs (GDPR Compliant)
```sql
-- Check if user can receive notification
SELECT notifications_schema.can_user_receive_notification(
  'user-123',
  'SMS',
  'appointment',
  'NORMAL'
);
```

### 4. Retry Mechanism with Exponential Backoff
```sql
-- Get notifications due for retry
SELECT * FROM notifications_schema.get_notifications_for_retry(100);
```

### 5. Channel Health Monitoring
```sql
-- Calculate channel health (last 24 hours)
SELECT * FROM notifications_schema.calculate_channel_health('EMAIL', 24);
```

### 6. Analytics & Reporting
```sql
-- Get delivery stats by channel (last 30 days)
SELECT * FROM notifications_schema.get_delivery_stats_by_channel(
  NOW() - INTERVAL '30 days',
  NOW()
);
```

### 7. Automated Maintenance
```sql
-- Run daily maintenance job
SELECT * FROM notifications_schema.run_daily_maintenance();
```

---

## 🔧 Maintenance Schedule

### Daily Jobs (2:00 AM)
```sql
SELECT * FROM notifications_schema.run_daily_maintenance();
```

This includes:
- Cleanup old notifications (90 days retention)
- Cleanup old delivery results (180 days retention)
- Cleanup old audit logs (365 days for non-PHI)
- Update template statistics
- Update channel health status
- Expire old scheduled notifications
- Aggregate yesterday's analytics

### Weekly Jobs
```sql
-- Archive old analytics (run weekly)
SELECT notifications_schema.archive_old_analytics(365);

-- Update all statistics
ANALYZE notifications_schema.notifications;
ANALYZE notifications_schema.notification_delivery_results;
```

---

## 🛡️ Security & Compliance

### HIPAA Compliance
- ✅ Audit logging for all PHI access
- ✅ Row Level Security (RLS) enabled
- ✅ Healthcare context tracking
- ✅ Soft deletes (no hard deletes)
- ✅ Retention policies

### GDPR Compliance
- ✅ User preferences with opt-out
- ✅ Right to be forgotten (soft delete)
- ✅ Data portability (export functions)
- ✅ Consent tracking

### Vietnamese Healthcare Standards
- ✅ Vietnamese language templates
- ✅ BHYT/BHTN insurance support
- ✅ Ministry of Health compliance flags
- ✅ Local timezone (Asia/Ho_Chi_Minh)

---

## 🐛 Troubleshooting

### Issue: Migrations fail with "schema does not exist"
**Solution:**
```sql
CREATE SCHEMA IF NOT EXISTS notifications_schema;
```

### Issue: Permission denied
**Solution:**
```sql
GRANT ALL ON SCHEMA notifications_schema TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA notifications_schema TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA notifications_schema TO service_role;
```

### Issue: Foreign key constraints fail
**Solution:** Run migrations in order (001 → 010).

### Issue: RLS blocking queries
**Solution:** Use `service_role` key, not `anon` key.

---

## 📚 Related Documentation

- [Notification Service Architecture](../README.md)
- [API Documentation](../docs/API.md)
- [AGENTS.md](../../../AGENTS.md) - Development guidelines
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🔄 Migration History

| Date | Version | Changes | Applied By |
|------|---------|---------|------------|
| 2025-10-25 | 1.0.0 | Initial 10 migrations created | System |
| TBD | 1.1.0 | Apply to Supabase | Manual |

---

**Next Steps:**
1. ✅ Migration files created
2. 🔄 Review migrations
3. ⏳ Apply to Supabase
4. ⏳ Verify with test queries
5. ⏳ Implement repositories
6. ⏳ Implement use cases
7. ⏳ Test end-to-end

**Total Database Objects Created:**
- 📊 **8 Tables** (+ 1 existing inbox)
- 🔍 **50+ Indexes**
- ⚙️ **20+ Functions**
- 🛡️ **10+ RLS Policies**
- 📝 **4 Default Templates**
- 🏥 **5 Channel Configurations**

