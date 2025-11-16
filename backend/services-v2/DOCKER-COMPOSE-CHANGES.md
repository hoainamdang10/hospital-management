# Docker Compose V2 - Changes After Notifications Refactor

## Summary

Updated `docker-compose.v2.yml` to align with Notifications Service refactor:
- Removed separate notifications-consumer (functionality moved to cron job)
- Fixed database schema name
- Added missing environment variables
- Removed duplicate API Gateway

---

## Changes Made

### 1. Notifications Service (Lines 521-570)

**Fixed:**
```yaml
# Before:
- DATABASE_SCHEMA=notification_schema  # ❌ Wrong

# After:
- DATABASE_SCHEMA=notifications_schema  # ✅ Correct
```

**Added Environment Variables:**
```yaml
# SendGrid Email Configuration
- SENDGRID_API_KEY=${SENDGRID_API_KEY}
- SENDGRID_FROM_EMAIL=${SENDGRID_FROM_EMAIL}
- SENDGRID_FROM_NAME=${SENDGRID_FROM_NAME}

# Twilio SMS Configuration
- TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
- TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
- TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER}

# Reminder Cron Job Configuration
- REMINDER_CRON_ENABLED=true
- REMINDER_CRON_EXPRESSION=*/5 * * * *
- REMINDER_BATCH_SIZE=100
```

**Added Health Check:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3011/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

---

### 2. Notifications Consumer (Lines 556-582)

**Status**: ARCHIVED - Commented out

**Reason**: 
- Scheduler service removed from architecture
- Cron job now runs inside notifications-service container
- No need for separate consumer container

**Code**:
```yaml
# ARCHIVED - Notifications Consumer (Replaced by ReminderCronJob in Notifications Service)
# The cron job now runs inside notifications-service container
# Uncomment if need to revert to separate consumer architecture
# notifications-consumer:
#   ...
```

---

### 3. API Gateway V2 (Lines 584-619)

**Status**: REMOVED

**Reason**: Duplicate of main `api-gateway` service (Lines 53-144)

**Code**:
```yaml
# REMOVED - Duplicate API Gateway V2 (consolidated with api-gateway service above)
# All gateway functionality is in the main api-gateway service
```

---

## Docker Profiles

### Unchanged Profiles:

- **infrastructure**: Redis, RabbitMQ
- **core**: Identity, Patient, Provider, Department
- **business**: Appointments, Billing
- **supporting**: Notifications
- **gateway**: API Gateway
- **dev**: All core services
- **full**: All services

### Usage:

```bash
# Start infrastructure
docker-compose -f docker-compose.v2.yml --profile infrastructure up -d

# Start core services
docker-compose -f docker-compose.v2.yml --profile core up -d

# Start supporting services (includes notifications)
docker-compose -f docker-compose.v2.yml --profile supporting up -d

# Start everything
docker-compose -f docker-compose.v2.yml --profile full up -d
```

---

## Environment File Updates

### .env.example Changes:

**Added:**
```env
# Notifications Service
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@hospital.vn
SENDGRID_FROM_NAME=Bệnh viện Đa khoa
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+84xxx
```

**Removed:**
```env
# EMAIL_SERVICE_API_KEY - Replaced by SENDGRID_API_KEY
# SMS_SERVICE_API_KEY - Replaced by TWILIO_* vars
# FIREBASE_* - Out of MVP scope
```

---

## Verification Checklist

After deploying changes, verify:

- [ ] Notifications service starts successfully
- [ ] Database schema is `notifications_schema`
- [ ] RabbitMQ consumers connect (check logs)
- [ ] Cron job starts (check logs every 5 minutes)
- [ ] Health check passes: `curl http://localhost:3011/health`
- [ ] No notifications-consumer container running
- [ ] Only one api-gateway container running

---

## Rollback Plan

If issues arise, revert by:

1. Restore old `docker-compose.v2.yml` from git:
   ```bash
   git checkout HEAD -- docker-compose.v2.yml
   ```

2. Restart services:
   ```bash
   docker-compose -f docker-compose.v2.yml down
   docker-compose -f docker-compose.v2.yml --profile full up -d
   ```

---

## Impact Analysis

| Service | Status | Impact |
|---------|--------|--------|
| notifications-service | ✅ Modified | Updated env vars, healthcheck added |
| notifications-consumer | ❌ Removed | Functionality moved to cron job |
| api-gateway-v2 | ❌ Removed | Duplicate, use main api-gateway |
| api-gateway | ✅ Unchanged | No changes |
| identity-service | ✅ Unchanged | No changes |
| patient-registry-service | ✅ Unchanged | No changes |
| appointments-service | ✅ Unchanged | No changes |
| billing-service | ✅ Unchanged | No changes |

---

## Related Documentation

- [DOCKER-SETUP.md](./notifications-service/DOCKER-SETUP.md) - Detailed Notifications Service setup
- [README.md](./notifications-service/README.md) - Service overview
- [AGENTS.md](../AGENTS.md) - Project agent guidelines

---

**Version**: 2.0.0  
**Date**: 2025-01-11  
**Author**: Hospital Management Team
