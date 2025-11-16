# Hospital Management System V2 - Deployment Guide

**Version**: 2.0.0
**Last Updated**: 2025-11-14
**Status**: 3 services production-ready, phased deployment recommended

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Environment Configuration](#environment-configuration)
4. [Phased Deployment Strategy](#phased-deployment-strategy)
5. [Service-Specific Deployment](#service-specific-deployment)
6. [Monitoring & Observability](#monitoring--observability)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Minimum:**
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 50 GB SSD
- **Network**: 100 Mbps

**Recommended (Production):**
- **CPU**: 8+ cores
- **RAM**: 16+ GB
- **Storage**: 100+ GB SSD
- **Network**: 1 Gbps
- **Load Balancer**: NGINX or similar
- **Reverse Proxy**: Configured for HTTPS

### Software Dependencies

```bash
# Required
Node.js >= 18.0.0
npm >= 9.0.0
Docker >= 24.0.0
Docker Compose >= 2.20.0

# Optional (for local development)
Git >= 2.30.0
Redis CLI (for debugging)
PostgreSQL Client (for database debugging via Supabase)
```

### External Services

1. **Supabase Account** (Required)
   - Free tier supports up to 60 connections
   - **Warning**: 8 services × 15 connections = 120 potential connections
   - Consider upgrading to Pro tier ($25/month) for production

2. **SendGrid Account** (Required for emails)
   - Free tier: 100 emails/day
   - Essentials tier: $19.95/month for 50,000 emails

3. **Twilio Account** (Optional, for SMS)
   - Pay-as-you-go pricing
   - ~$0.0079/SMS for Vietnam

4. **PayOS Account** (Required for billing - Vietnam only)
   - Vietnamese payment gateway
   - Contact: https://payos.vn

---

## Infrastructure Setup

### 1. Docker Infrastructure (Redis + RabbitMQ)

```bash
# Navigate to services directory
cd backend/services-v2

# Start infrastructure only
npm run dev:infrastructure

# Verify infrastructure
docker ps | grep -E "redis|rabbitmq"

# Check Redis
redis-cli -p 6379 ping
# Expected output: PONG

# Check RabbitMQ
curl http://localhost:15672
# Should open RabbitMQ management UI (admin/admin)
```

### 2. Supabase Setup

**Create Schemas:**

```sql
-- Connect to your Supabase project and run:

-- Core Services (Production-Ready)
CREATE SCHEMA IF NOT EXISTS auth_schema;
CREATE SCHEMA IF NOT EXISTS patient_schema;
CREATE SCHEMA IF NOT EXISTS provider_schema;

-- Business Services (In Development)
CREATE SCHEMA IF NOT EXISTS appointments_schema;
CREATE SCHEMA IF NOT EXISTS clinical_schema;
CREATE SCHEMA IF NOT EXISTS billing_schema;
CREATE SCHEMA IF NOT EXISTS notifications_schema;
CREATE SCHEMA IF NOT EXISTS department_schema;

-- Grant permissions (replace 'postgres' with your service role if different)
GRANT ALL PRIVILEGES ON SCHEMA auth_schema TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA patient_schema TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA provider_schema TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA appointments_schema TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA clinical_schema TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA billing_schema TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA notifications_schema TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA department_schema TO postgres;
```

**Run Migrations:**

```bash
# Identity Service (21 migrations)
cd identity-service
npm run migrate:up
# or use Supabase migration tools

# Patient Registry (10 migrations)
cd ../patient-registry-service
npm run migrate:up

# Provider/Staff (migrations)
cd ../provider-staff-service
npm run migrate:up

# Appointments (13 migrations)
cd ../appointments-service
npm run migrate:up

# Other services...
```

---

## Environment Configuration

### 1. Create Environment Files

```bash
# From backend/services-v2/
cp .env.example .env.local
cp .env.example .env.docker

# Edit .env.local for local development
nano .env.local

# Edit .env.docker for Docker deployment
nano .env.docker
```

### 2. Required Environment Variables

**Critical Variables to Set:**

```env
# Supabase (Get from Supabase Dashboard > Settings > API)
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase

# Security (Generate secure random strings)
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters

# SendGrid (Get from SendGrid Dashboard)
SENDGRID_API_KEY=SG.your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Hospital Management System

# PayOS (Vietnam Payment Gateway - Get from PayOS Dashboard)
PAYOS_CLIENT_ID=your-payos-client-id
PAYOS_API_KEY=your-payos-api-key
PAYOS_CHECKSUM_KEY=your-payos-checksum-key

# Frontend URL (for email verification links)
FRONTEND_URL=https://yourdomain.com
```

### 3. Switch Environment

```bash
# For local development (services on host, infra in docker)
npm run env:local

# For full Docker deployment
npm run env:docker

# Verify current environment
npm run env:status
```

---

## Phased Deployment Strategy

### Overview

| Phase | Services | Timeline | Prerequisites | Risk Level |
|-------|----------|----------|---------------|------------|
| **Phase 1** | Identity, Patient, Provider | Now | Infrastructure setup | Low ⬇️ |
| **Phase 2** | Appointments | +3-4 weeks | Phase 1 deployed | Medium ⚠️ |
| **Phase 3** | Notifications | +5-6 weeks | Phase 1 deployed | Low ⬇️ |
| **Phase 4** | Clinical EMR + Billing | +10-12 weeks | Phases 1-3 deployed | High ⬆️ |
| **Phase 5** | Department (Optional) | +8-10 weeks | Phase 1 deployed | Low ⬇️ |

---

### Phase 1: Core Services (Production-Ready) ✅

**Services:**
- Identity Service (95% complete)
- Patient Registry (90% complete)
- Provider/Staff Service (88% complete)

**Go-Live Checklist:**

```bash
# 1. Infrastructure Health Check
curl http://localhost:6379  # Redis should be accessible
curl http://localhost:15672 # RabbitMQ management UI

# 2. Run All Tests
cd identity-service && npm test
cd ../patient-registry-service && npm test
cd ../provider-staff-service && npm test

# 3. Build Services
npm run build:identity
npm run build:patient
npm run build:provider

# 4. Health Checks
npm run dev:core  # Start services

curl http://localhost:3001/health  # Identity
curl http://localhost:3003/health  # Patient
curl http://localhost:3002/health  # Provider

# 5. Verify Event Bus
# Check RabbitMQ exchanges and queues
curl -u admin:admin http://localhost:15672/api/exchanges/%2F

# 6. Monitor Logs
docker-compose -f docker-compose.v2.yml logs -f identity-service
docker-compose -f docker-compose.v2.yml logs -f patient-registry-service
docker-compose -f docker-compose.v2.yml logs -f provider-staff-service
```

**Deployment Steps:**

1. **Database Migration:**
   ```bash
   # Run migrations for each service
   cd identity-service && npm run migrate:up
   cd ../patient-registry-service && npm run migrate:up
   cd ../provider-staff-service && npm run migrate:up
   ```

2. **Start Services:**
   ```bash
   # Option A: Docker (recommended for production)
   npm run env:docker
   npm run dev:core

   # Option B: Local (for development)
   npm run env:local
   cd identity-service && npm run dev &
   cd patient-registry-service && npm run dev &
   cd provider-staff-service && npm run dev &
   ```

3. **Verify Deployment:**
   ```bash
   # Test authentication flow
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test1234!","fullName":"Test User"}'

   # Test patient registration
   curl -X POST http://localhost:3003/api/patients \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"fullName":"Patient Test","dateOfBirth":"1990-01-01","gender":"MALE"}'

   # Test staff registration
   curl -X POST http://localhost:3002/api/staff \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"fullName":"Dr. Test","role":"DOCTOR"}'
   ```

4. **Monitor Initial Traffic:**
   ```bash
   # Watch logs for errors
   tail -f logs/*.log

   # Monitor Supabase connections
   # Check Supabase Dashboard > Database > Connections
   # Should be under 60 for free tier
   ```

**Success Criteria:**
- ✅ All health checks return 200 OK
- ✅ User registration and login working
- ✅ Patient CRUD operations working
- ✅ Staff CRUD operations working
- ✅ Events publishing to RabbitMQ
- ✅ No critical errors in logs
- ✅ Database connections under limit

**Rollback Plan:**
```bash
# Stop services
npm run dev:stop

# Rollback database migrations
cd identity-service && npm run migrate:down
cd ../patient-registry-service && npm run migrate:down
cd ../provider-staff-service && npm run migrate:down

# Restore previous Docker images (if applicable)
docker-compose -f docker-compose.v2.yml down
docker pull previous-identity-image:tag
docker pull previous-patient-image:tag
docker pull previous-provider-image:tag
```

---

### Phase 2: Appointments Service (+3-4 weeks) 🔄

**Prerequisites:**
- Phase 1 deployed and stable
- Notifications service stub/mock ready (for reminders)

**Completion Requirements (Currently 75%):**

1. **Integration with Notifications** (Missing)
   - Implement appointment reminder cron jobs
   - OR mock notification service for Phase 2

2. **Integration with Billing** (Missing)
   - Verify invoice creation on appointment completion
   - Test event flow: Appointment.Completed → Invoice.Created

3. **Integration with Clinical EMR** (Missing)
   - Verify medical record creation on appointment completion
   - Test event flow: Appointment.Completed → MedicalRecord.Created

4. **End-to-End Testing**
   - Appointment booking → Confirmation → Check-in → Completion workflow
   - Queue management for walk-ins
   - Conflict detection under load

**Deployment Steps:**

```bash
# 1. Run migrations
cd appointments-service && npm run migrate:up

# 2. Start service
docker-compose -f docker-compose.v2.yml up -d appointments-service

# 3. Health check
curl http://localhost:3004/health

# 4. Test appointment booking
curl -X POST http://localhost:3004/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "patientId": "uuid",
    "providerId": "uuid",
    "appointmentType": "CONSULTATION",
    "scheduledStartTime": "2025-12-01T10:00:00Z",
    "scheduledEndTime": "2025-12-01T10:30:00Z"
  }'
```

**Success Criteria:**
- ✅ Appointment booking working
- ✅ Conflict detection preventing double-bookings
- ✅ Queue management for walk-ins
- ✅ Events publishing to Notifications (even if mocked)
- ✅ Integration with Patient and Provider services

---

### Phase 3: Notifications Service (+5-6 weeks) 🔄

**Prerequisites:**
- Phase 1 deployed and stable
- SendGrid API key configured
- (Optional) Twilio API credentials for SMS

**Completion Requirements (Currently 65%):**

1. **Scheduled Notifications** (Missing)
   - Implement cron jobs for appointment reminders
   - Schedule: Send reminder 24 hours before appointment

2. **Delivery Status Tracking** (Missing)
   - Implement SendGrid webhook handler
   - Implement Twilio webhook handler
   - Update notification status in database

3. **Throttling & Rate Limiting** (Missing)
   - Prevent spam (max 10 emails/hour per user)
   - Quiet hours support (no notifications 10 PM - 7 AM)

4. **Unsubscribe Mechanism** (Missing)
   - Add unsubscribe links to emails
   - Preference management API

**Deployment Steps:**

```bash
# 1. Start service
docker-compose -f docker-compose.v2.yml up -d notifications-service

# 2. Health check
curl http://localhost:3011/health

# 3. Test email notification
curl -X POST http://localhost:3011/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "recipientId": "user-uuid",
    "channel": "EMAIL",
    "template": "APPOINTMENT_REMINDER",
    "data": {
      "appointmentDate": "2025-12-01T10:00:00Z",
      "doctorName": "Dr. Smith"
    }
  }'

# 4. Verify email received
# Check recipient inbox
```

**Success Criteria:**
- ✅ Email delivery working (SendGrid)
- ✅ SMS delivery working (Twilio) - if configured
- ✅ Appointment reminders sending automatically
- ✅ Delivery status tracking working
- ✅ Unsubscribe mechanism working

---

### Phase 4: Clinical EMR + Billing (+10-12 weeks) 🔄⚠️

**High Risk Phase** - These services are critical for revenue and compliance.

#### Clinical EMR Service (60% complete)

**Completion Requirements:**

1. **Presentation Layer** (Missing)
   - Implement all controllers
   - Create REST API routes
   - Add Swagger documentation

2. **FHIR R4 Compliance** (Missing)
   - Implement FHIR resource mappings
   - FHIR API endpoints (if needed for external integration)

3. **Clinical Coding** (Missing)
   - ICD-10 diagnosis coding
   - Vietnamese drug database integration

4. **Vietnamese Compliance** (Missing)
   - E-prescription standards
   - Medical records law compliance
   - Digital signature for prescriptions

**Deployment Steps:**

```bash
# 1. Run migrations
cd clinical-emr-service && npm run migrate:up

# 2. Verify FHIR compliance
npm run test:fhir  # (to be implemented)

# 3. Start service
docker-compose -f docker-compose.v2.yml up -d clinical-emr-service

# 4. Health check
curl http://localhost:3007/health

# 5. Test medical record creation
curl -X POST http://localhost:3007/api/medical-records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "patientId": "uuid",
    "providerId": "uuid",
    "appointmentId": "uuid",
    "chiefComplaint": "Headache",
    "diagnosis": "Migraine",
    "icdCode": "G43.9"
  }'
```

#### Billing Service (50% complete)

**Completion Requirements:**

1. **Domain Model Completion** (Missing)
   - Payment plans and installments
   - Discount/coupon system
   - Late fee calculation
   - Tax calculation (Vietnamese VAT)

2. **Testing** (Critical)
   - Increase from 13 to 80+ test files
   - Integration tests with Appointments and Clinical

3. **Production Infrastructure** (Missing)
   - Health checks
   - Prometheus metrics
   - Circuit breakers for PayOS

4. **Vietnamese Compliance** (Missing)
   - VAT calculation (10% standard rate)
   - Invoice numbering per Vietnamese law
   - E-invoice integration (if required)

**Deployment Steps:**

```bash
# 1. Run migrations
cd billing-service && npm run migrate:up

# 2. Verify PayOS integration
npm run test:payos  # (to be implemented)

# 3. Start service
docker-compose -f docker-compose.v2.yml up -d billing-service

# 4. Health check
curl http://localhost:3009/health

# 5. Test invoice creation
curl -X POST http://localhost:3009/api/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "patientId": "uuid",
    "appointmentId": "uuid",
    "items": [
      {
        "description": "Consultation",
        "quantity": 1,
        "unitPrice": 500000,
        "currency": "VND"
      }
    ]
  }'

# 6. Test payment processing
curl -X POST http://localhost:3009/api/invoices/{invoiceId}/pay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "paymentMethod": "PAYOS",
    "amount": 500000
  }'
```

**Success Criteria (Phase 4):**
- ✅ Medical records CRUD working
- ✅ Prescription generation working
- ✅ FHIR R4 compliance verified
- ✅ ICD-10 coding working
- ✅ Invoice creation working
- ✅ Payment processing working (PayOS)
- ✅ VAT calculation correct
- ✅ Integration: Appointment → Clinical → Billing flow working

---

### Phase 5: Department Service (+8-10 weeks, Optional) ❌

**Current Status**: Skeleton only (15% complete)

**Recommendation**: **Skip for MVP**, implement post-launch based on user feedback.

**If Required:**

1. **Complete Implementation** (Missing 85%)
   - Domain modeling
   - Use case implementation
   - Repository implementation
   - Testing

2. **Integration**
   - Provider/Staff service (department assignments)
   - Appointments service (department-based scheduling)

**Deployment Steps:** TBD (not ready)

---

## Service-Specific Deployment

### Identity Service Deployment

**Port**: 3001
**Schema**: `auth_schema`
**Status**: Production-Ready (95%)

```bash
# Build
cd identity-service
npm install
npm run build

# Run migrations
npm run migrate:up

# Start
npm run start  # Production mode
# OR
npm run dev    # Development mode

# Health check
curl http://localhost:3001/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-11-14T10:00:00Z",
  "checks": {
    "database": "ok",
    "auth": "ok",
    "authorization": "ok",
    "sessions": "ok",
    "audit": "ok",
    "circuitBreakers": "ok"
  }
}
```

**Environment Variables:**
```env
PORT=3001
NODE_ENV=production
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
JWT_SECRET=xxx
SENDGRID_API_KEY=xxx
REDIS_URL=redis://redis-v2:6379
RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672
```

---

### Patient Registry Deployment

**Port**: 3003
**Schema**: `patient_schema`
**Status**: Production-Ready (90%)

```bash
# Build
cd patient-registry-service
npm install
npm run build

# Run migrations
npm run migrate:up

# Start
npm run start

# Health check
curl http://localhost:3003/health
```

**Environment Variables:**
```env
PORT=3003
NODE_ENV=production
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
REDIS_URL=redis://redis-v2:6379
RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672
```

---

### Provider/Staff Deployment

**Port**: 3002
**Schema**: `provider_schema`
**Status**: Production-Ready (88%)

```bash
# Build
cd provider-staff-service
npm install
npm run build

# Run migrations
npm run migrate:up

# Start
npm run start

# Health check
curl http://localhost:3002/health
```

**Environment Variables:**
```env
PORT=3002
NODE_ENV=production
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
REDIS_URL=redis://redis-v2:6379
RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672
DEPARTMENT_SERVICE_URL=http://department-service:3025  # If Department service deployed
```

---

## Monitoring & Observability

### Health Checks

**Automated Health Check Script:**

```bash
#!/bin/bash
# health-check-all.sh

services=(
  "Identity:3001"
  "Patient:3003"
  "Provider:3002"
  "Appointments:3004"
  "Clinical:3007"
  "Billing:3009"
  "Notifications:3011"
  "Department:3025"
  "Gateway:3101"
)

for service in "${services[@]}"; do
  name="${service%%:*}"
  port="${service##*:}"

  echo "Checking $name on port $port..."

  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/health)

  if [ "$response" -eq 200 ]; then
    echo "✅ $name is healthy"
  else
    echo "❌ $name is unhealthy (HTTP $response)"
  fi
done
```

### Prometheus Metrics

**Identity Service Metrics:**
```bash
# Metrics endpoint (requires authentication)
curl http://localhost:3001/metrics \
  -H "Authorization: Bearer METRICS_TOKEN"
```

**Key Metrics to Monitor:**
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- `auth_login_attempts_total` - Login attempts
- `auth_login_failures_total` - Failed logins
- `circuit_breaker_state` - Circuit breaker status

### Log Aggregation

**Centralized Logging (Recommended):**

```bash
# Option 1: ELK Stack (Elasticsearch + Logstash + Kibana)
docker-compose -f docker-compose.elk.yml up -d

# Option 2: Loki + Grafana
docker-compose -f docker-compose.loki.yml up -d

# Option 3: CloudWatch (AWS)
# Configure in docker-compose.v2.yml
```

**Log Levels:**
- `debug` - Development only
- `info` - Production default
- `warn` - Warnings
- `error` - Errors
- `fatal` - Critical errors

### Grafana Dashboard

**Setup:**

```bash
# Start Grafana
docker run -d -p 3030:3000 grafana/grafana

# Add Prometheus data source
# URL: http://prometheus:9090

# Import dashboard
# Dashboard ID: TBD (create custom dashboard)
```

**Key Dashboards:**
1. **Service Health** - All service health statuses
2. **Request Rate** - Requests per second by service
3. **Error Rate** - Error percentage by service
4. **Latency** - p50, p95, p99 latencies
5. **Database Connections** - Supabase connection usage

---

## Rollback Procedures

### Emergency Rollback (All Services)

```bash
# 1. Stop all services immediately
docker-compose -f docker-compose.v2.yml down

# 2. Restore previous Docker images
docker-compose -f docker-compose.v2.yml pull

# 3. Start services with previous version
docker-compose -f docker-compose.v2.yml up -d

# 4. Verify health
./health-check-all.sh
```

### Service-Specific Rollback

```bash
# Example: Rollback Identity Service

# 1. Stop service
docker-compose -f docker-compose.v2.yml stop identity-service

# 2. Rollback database migrations
cd identity-service
npm run migrate:down  # Rollback last migration
# OR
npm run migrate:down -- --to=20250101000000  # Rollback to specific version

# 3. Restore previous Docker image
docker-compose -f docker-compose.v2.yml pull identity-service

# 4. Restart service
docker-compose -f docker-compose.v2.yml up -d identity-service

# 5. Verify health
curl http://localhost:3001/health
```

### Database Rollback

```bash
# List migration history
cd identity-service
npm run migrate:status

# Rollback specific migration
npm run migrate:down -- --to=20250101000000

# Verify schema
psql -h YOUR_SUPABASE_HOST -U postgres -d postgres -c "\dn auth_schema.*"
```

---

## Troubleshooting

### Common Issues

#### 1. Service Won't Start

**Symptom**: Service exits immediately after starting

**Diagnosis:**
```bash
# Check logs
docker-compose -f docker-compose.v2.yml logs identity-service

# Common errors:
# - "Port 3001 already in use" → Another process using port
# - "ECONNREFUSED redis" → Redis not running
# - "ECONNREFUSED rabbitmq" → RabbitMQ not running
# - "Invalid JWT secret" → Environment variable not set
```

**Solution:**
```bash
# Kill process using port
lsof -ti:3001 | xargs kill -9

# Restart infrastructure
npm run dev:infrastructure

# Verify environment variables
npm run env:status
cat .env | grep JWT_SECRET
```

#### 2. Database Connection Errors

**Symptom**: "Too many connections" or "Connection timeout"

**Diagnosis:**
```bash
# Check Supabase connection count
# Go to Supabase Dashboard > Database > Connections
# Free tier limit: 60 connections

# Check service connection pool sizes
grep -r "poolSize" backend/services-v2/*/src/
```

**Solution:**
```bash
# Option 1: Reduce connection pool sizes
# Edit shared/infrastructure/database/optimized-supabase-client.ts
# Reduce from 15 to 10 per service

# Option 2: Upgrade Supabase tier
# Go to Supabase Dashboard > Settings > Billing
# Upgrade to Pro ($25/month) for 500 connections

# Option 3: Stop unused services
docker-compose -f docker-compose.v2.yml stop clinical-emr-service billing-service
```

#### 3. RabbitMQ Connection Errors

**Symptom**: "ECONNREFUSED rabbitmq-v2:5672"

**Diagnosis:**
```bash
# Check RabbitMQ status
docker ps | grep rabbitmq
curl http://localhost:15672  # Management UI

# Check RabbitMQ logs
docker-compose -f docker-compose.v2.yml logs rabbitmq-v2
```

**Solution:**
```bash
# Restart RabbitMQ
docker-compose -f docker-compose.v2.yml restart rabbitmq-v2

# If still failing, recreate
docker-compose -f docker-compose.v2.yml down rabbitmq-v2
docker-compose -f docker-compose.v2.yml up -d rabbitmq-v2
```

#### 4. Event Not Being Consumed

**Symptom**: Events published but not consumed by other services

**Diagnosis:**
```bash
# Check RabbitMQ queues
curl -u admin:admin http://localhost:15672/api/queues/%2F

# Check if consumers registered
curl -u admin:admin http://localhost:15672/api/consumers/%2F

# Check service logs for consumer startup
docker-compose logs identity-service | grep "Consumer registered"
```

**Solution:**
```bash
# Restart consuming service
docker-compose restart patient-registry-service

# Verify consumer registration in logs
docker-compose logs -f patient-registry-service | grep "EventConsumer"

# Manually consume messages (debugging)
# Use RabbitMQ Management UI > Queues > Get Messages
```

#### 5. Supabase Schema Not Found

**Symptom**: "schema 'auth_schema' does not exist"

**Diagnosis:**
```bash
# Check if schema exists
# Go to Supabase Dashboard > SQL Editor
SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE '%schema';
```

**Solution:**
```bash
# Create missing schema
# Run in Supabase SQL Editor:
CREATE SCHEMA IF NOT EXISTS auth_schema;
GRANT ALL PRIVILEGES ON SCHEMA auth_schema TO postgres;

# Run migrations
cd identity-service
npm run migrate:up
```

#### 6. Email Not Sending

**Symptom**: Email verification not received

**Diagnosis:**
```bash
# Check SendGrid API key
echo $SENDGRID_API_KEY

# Check Identity service logs
docker-compose logs identity-service | grep -i sendgrid

# Test SendGrid API directly
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [{"to": [{"email": "test@example.com"}]}],
    "from": {"email": "noreply@yourdomain.com"},
    "subject": "Test",
    "content": [{"type": "text/plain", "value": "Test"}]
  }'
```

**Solution:**
```bash
# Verify SendGrid API key is valid
# Go to SendGrid Dashboard > Settings > API Keys

# Verify sender email is verified
# Go to SendGrid Dashboard > Settings > Sender Authentication

# Check spam folder
# SendGrid emails may be marked as spam initially

# Enable SendGrid activity feed
# Go to SendGrid Dashboard > Activity Feed
```

---

## Performance Tuning

### Database Connection Pooling

**Current Settings:**
- Development: 15 connections per service
- Production: 20 connections per service

**Optimization:**
```typescript
// shared/infrastructure/database/optimized-supabase-client.ts

// For services with high read traffic (Patient, Provider)
poolSize: 20

// For services with low traffic (Department, Notifications)
poolSize: 5

// Total: 3×20 + 5×5 = 85 connections (still under Pro tier limit)
```

### Redis Caching Strategy

**Cache Keys:**
```
user:permissions:{userId}        TTL: 3600s (1 hour)
patient:profile:{patientId}      TTL: 1800s (30 min)
provider:schedule:{providerId}   TTL: 900s (15 min)
appointment:availability:{date}  TTL: 300s (5 min)
```

**Cache Invalidation:**
```typescript
// On user role change
await redis.del(`user:permissions:${userId}`);

// On patient update
await redis.del(`patient:profile:${patientId}`);
```

### Load Balancing

**NGINX Configuration:**
```nginx
upstream identity_service {
    least_conn;
    server identity-service-1:3001;
    server identity-service-2:3001;
    server identity-service-3:3001;
}

upstream patient_service {
    least_conn;
    server patient-service-1:3003;
    server patient-service-2:3003;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location /api/auth {
        proxy_pass http://identity_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/patients {
        proxy_pass http://patient_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Security Checklist

### Pre-Deployment Security

- [ ] All environment variables secured (no hardcoded secrets)
- [ ] JWT secrets rotated (minimum 32 characters)
- [ ] Supabase service role key secured
- [ ] SendGrid API key secured
- [ ] PayOS credentials secured
- [ ] HTTPS enabled (production only)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] CSRF protection enabled
- [ ] Row Level Security (RLS) enabled on Supabase tables
- [ ] Audit logging enabled
- [ ] Password policy enforced (minimum 8 characters, 1 uppercase, 1 lowercase, 1 number)

### Post-Deployment Security

- [ ] Regular security audits scheduled
- [ ] Dependency vulnerability scanning (npm audit)
- [ ] Penetration testing completed
- [ ] HIPAA compliance verified
- [ ] Data encryption at rest (Supabase default)
- [ ] Data encryption in transit (HTTPS)
- [ ] Access logs monitored
- [ ] Suspicious activity alerts configured
- [ ] Backup and disaster recovery plan tested

---

## Support & Escalation

### Issue Severity Levels

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| **P0 - Critical** | System down, data loss | 15 minutes | All services down, database corrupted |
| **P1 - High** | Major feature broken | 1 hour | Authentication broken, appointments failing |
| **P2 - Medium** | Minor feature broken | 4 hours | Email not sending, UI bug |
| **P3 - Low** | Cosmetic issue | 1 day | Typo, styling issue |

### Escalation Path

1. **Developer** → Fix attempt (15-30 min)
2. **Tech Lead** → Review and guidance (30-60 min)
3. **DevOps Engineer** → Infrastructure investigation (1-2 hours)
4. **CTO** → Executive decision on rollback/downtime

### Emergency Contacts

```
Developer On-Call: [Phone Number]
Tech Lead: [Phone Number]
DevOps Engineer: [Phone Number]
CTO: [Phone Number]

Supabase Support: support@supabase.io
SendGrid Support: support@sendgrid.com
```

---

## Conclusion

This deployment guide covers the phased deployment of the Hospital Management System V2. Follow the phases sequentially to minimize risk and ensure stable rollouts.

**Next Steps:**
1. Complete Phase 1 deployment (Core Services)
2. Monitor for 1-2 weeks
3. Begin Phase 2 development (Appointments)
4. Repeat for subsequent phases

**Questions?** Contact the development team or refer to:
- [CLAUDE.md](../CLAUDE.md) - Project overview
- [README.md](../README.md) - Getting started
- [SERVICE_COMPARISON.md](SERVICE_COMPARISON.md) - Service details
