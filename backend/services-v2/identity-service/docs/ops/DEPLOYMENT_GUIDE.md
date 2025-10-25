# Identity Service - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Migrations](#database-migrations)
4. [Docker Deployment](#docker-deployment)
5. [Health Checks](#health-checks)
6. [Monitoring Setup](#monitoring-setup)
7. [Troubleshooting](#troubleshooting)
8. [Production Checklist](#production-checklist)

---

## Prerequisites

### Required Software
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Docker**: >= 20.10.0
- **Docker Compose**: >= 2.0.0
- **Supabase Account**: Active project with service role key

### Required Services
- **Supabase**: PostgreSQL database with RLS enabled
- **Redis**: Version 7.x (for caching)
- **RabbitMQ**: Version 3.x (for event bus)

### Network Requirements
- Port 3021: Identity Service HTTP API
- Port 6380: Redis (internal)
- Port 5673: RabbitMQ (internal)
- Port 15673: RabbitMQ Management UI

---

## Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd hospital-management-V2/backend/services-v2/identity-service
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

Create `.env` file in `backend/services-v2/` directory:

```env
# ==================== SUPABASE CONFIGURATION ====================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase

# ==================== SERVICE CONFIGURATION ====================
NODE_ENV=production
PORT=3021
SERVICE_NAME=identity-service
VERSION=2.0.0

# JWT Configuration
JWT_SECRET=your-strong-jwt-secret-min-32-chars
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# ==================== INFRASTRUCTURE ====================
# Redis (auto-configured in docker-compose)
REDIS_URL=redis://redis-v2:6379
REDIS_TTL=300

# RabbitMQ (auto-configured in docker-compose)
RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672
RABBITMQ_EXCHANGE=hospital.events
RABBITMQ_QUEUE=identity.events

# ==================== EMAIL CONFIGURATION ====================
SENDGRID_API_KEY=SG.your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@hospital.com
SENDGRID_FROM_NAME=Hospital Management System

# ==================== SECURITY ====================
# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://app.hospital.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Password Policy
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL_CHARS=true
PASSWORD_MAX_AGE_DAYS=90
PASSWORD_PREVENT_REUSE_COUNT=5

# Account Lockout
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=30

# ==================== MONITORING ====================
LOG_LEVEL=info
ENABLE_METRICS=true
ENABLE_HEALTH_CHECKS=true
```

### 4. Secure Environment Variables

**⚠️ SECURITY WARNINGS:**
- Never commit `.env` files to version control
- Use different secrets for each environment (dev, staging, prod)
- Rotate secrets regularly (every 90 days)
- Store production secrets in secure vault (AWS Secrets Manager, HashiCorp Vault)

**Generate Strong Secrets:**
```bash
# Generate JWT_SECRET (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate SUPABASE_JWT_SECRET (from Supabase dashboard)
# Settings > API > JWT Settings > JWT Secret
```

---

## Database Migrations

### 1. Verify Supabase Connection
```bash
# Test connection
curl -H "apikey: YOUR_ANON_KEY" \
  https://YOUR_PROJECT.supabase.co/rest/v1/
```

### 2. Run Migrations

**Manual Migration (Recommended for Production):**
```bash
# Navigate to migrations directory
cd migrations

# Run migrations in order
psql -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -f 001_create_auth_schema.sql

psql -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -f 002_create_event_inbox.sql

# ... run all migrations in sequence
```

**Automated Migration (Development):**
```bash
# Using Supabase CLI
supabase db push

# Or using custom script
npm run migrate:up
```

### 3. Verify Migrations
```sql
-- Check schema exists
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'auth_schema';

-- Check tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth_schema';

-- Verify RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'auth_schema';
```

### 4. Rollback (if needed)
```bash
# Rollback last migration
psql -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -f migrations/rollback/002_rollback_event_inbox.sql
```

---

## Docker Deployment

### 1. Build Docker Image
```bash
# From identity-service directory
docker build -t identity-service:2.0.0 .

# Verify image
docker images | grep identity-service
```

### 2. Start Infrastructure Services
```bash
# From backend/services-v2 directory
cd ../..

# Start Redis + RabbitMQ
npm run dev:infrastructure

# Verify services
docker ps | grep -E "redis-v2|rabbitmq-v2"
```

### 3. Start Identity Service
```bash
# Start identity service only
docker-compose -f docker-compose.v2.yml up -d identity-service

# Or start all core services
npm run dev:core

# View logs
npm run logs:identity
```

### 4. Verify Deployment
```bash
# Check container status
docker ps | grep identity-service

# Check logs
docker logs hospital-identity-service-v2 --tail 100

# Test health endpoint
curl http://localhost:3021/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "identity-service",
  "version": "2.0.0",
  "timestamp": "2025-01-07T10:00:00.000Z",
  "components": {
    "database": "HEALTHY",
    "cache": "HEALTHY",
    "eventBus": "HEALTHY",
    "circuitBreaker": "CLOSED"
  }
}
```

---

## Health Checks

### 1. Service Health
```bash
# Basic health check
curl http://localhost:3021/health

# Detailed health check
curl http://localhost:3021/health/detailed
```

### 2. Component Health Checks

**Database:**
```bash
# Check Supabase connection
curl -H "apikey: YOUR_ANON_KEY" \
  https://YOUR_PROJECT.supabase.co/rest/v1/
```

**Redis:**
```bash
# Connect to Redis
docker exec -it hospital-redis-v2 redis-cli

# Test connection
PING
# Expected: PONG

# Check keys
KEYS *
```

**RabbitMQ:**
```bash
# Access management UI
open http://localhost:15673

# Login: admin / admin

# Check queues
curl -u admin:admin http://localhost:15673/api/queues
```

### 3. Automated Health Monitoring
```bash
# Add to cron (every 5 minutes)
*/5 * * * * curl -f http://localhost:3021/health || echo "Identity Service is down" | mail -s "Alert" ops@hospital.com
```

---

## Monitoring Setup

### 1. Prometheus Configuration

Create `prometheus.yml`:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'identity-service'
    static_configs:
      - targets: ['identity-service:3021']
    metrics_path: '/metrics'
```

### 2. Start Prometheus
```bash
docker run -d \
  --name prometheus \
  --network hospital-network \
  -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

### 3. Grafana Setup

**Start Grafana:**
```bash
docker run -d \
  --name grafana \
  --network hospital-network \
  -p 3001:3000 \
  grafana/grafana
```

**Import Dashboard:**
1. Open http://localhost:3001 (admin/admin)
2. Add Prometheus data source: http://prometheus:9090
3. Import dashboard from `monitoring/grafana-identity-dashboard.json`

### 4. Alerting Setup

**Configure Alertmanager:**
```bash
# Copy alerting rules
cp monitoring/prometheus-alerts.yml /etc/prometheus/alerts.yml

# Restart Prometheus
docker restart prometheus
```

**Test Alerts:**
```bash
# Trigger high error rate
for i in {1..100}; do
  curl -X POST http://localhost:3021/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"invalid","password":"wrong"}'
done

# Check Prometheus alerts
open http://localhost:9090/alerts
```

---

## Troubleshooting

### Common Issues

#### 1. Service Won't Start
```bash
# Check logs
docker logs hospital-identity-service-v2

# Common causes:
# - Missing environment variables
# - Supabase connection failed
# - Port already in use

# Fix port conflict
lsof -i :3021
kill -9 <PID>
```

#### 2. Database Connection Failed
```bash
# Verify Supabase credentials
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test connection
curl -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  $SUPABASE_URL/rest/v1/

# Check firewall rules
# Supabase Dashboard > Settings > Database > Connection Pooling
```

#### 3. Redis Connection Failed
```bash
# Check Redis is running
docker ps | grep redis-v2

# Test connection
docker exec -it hospital-redis-v2 redis-cli PING

# Restart Redis
docker restart hospital-redis-v2
```

#### 4. RabbitMQ Connection Failed
```bash
# Check RabbitMQ is running
docker ps | grep rabbitmq-v2

# Check management UI
open http://localhost:15673

# Restart RabbitMQ
docker restart hospital-rabbitmq-v2
```

#### 5. High Memory Usage
```bash
# Check memory usage
docker stats hospital-identity-service-v2

# If > 1.5GB, restart service
docker restart hospital-identity-service-v2

# Check for memory leaks
npm run test:memory-leak
```

#### 6. Event Processing Stuck
```bash
# Check inbox queue
psql -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -c "SELECT status, COUNT(*) FROM auth_schema.event_inbox GROUP BY status;"

# If many PENDING events, check event consumer
docker logs hospital-identity-service-v2 | grep "Event consumer"

# Restart event consumer
docker restart hospital-identity-service-v2
```

---

## Production Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Secrets rotated and stored securely
- [ ] Database migrations tested in staging
- [ ] Load testing completed (>1000 req/s)
- [ ] Security audit passed
- [ ] HIPAA compliance verified
- [ ] Backup strategy in place
- [ ] Rollback plan documented

### Deployment
- [ ] Deploy to staging first
- [ ] Run smoke tests
- [ ] Verify health checks
- [ ] Check Prometheus metrics
- [ ] Monitor error rates
- [ ] Verify event processing
- [ ] Test critical user flows (login, register, MFA)

### Post-Deployment
- [ ] Monitor logs for 1 hour
- [ ] Check Grafana dashboards
- [ ] Verify no alerts triggered
- [ ] Test rollback procedure
- [ ] Update documentation
- [ ] Notify team of deployment

### Security Checklist
- [ ] JWT secrets rotated
- [ ] HTTPS enabled (TLS 1.3)
- [ ] Rate limiting configured
- [ ] CORS whitelist updated
- [ ] Helmet.js security headers enabled
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Audit logging enabled
- [ ] RLS policies verified

### Performance Checklist
- [ ] Redis caching enabled
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Circuit breakers tested
- [ ] Load balancer configured
- [ ] CDN for static assets
- [ ] Compression enabled
- [ ] Response time < 200ms (p95)

### Monitoring Checklist
- [ ] Prometheus scraping metrics
- [ ] Grafana dashboards configured
- [ ] Alerting rules active
- [ ] Log aggregation setup (ELK/Loki)
- [ ] Error tracking (Sentry)
- [ ] APM enabled (New Relic/Datadog)
- [ ] Uptime monitoring (Pingdom)

---

## Rollback Procedure

### 1. Immediate Rollback (< 5 minutes)
```bash
# Stop current version
docker stop hospital-identity-service-v2

# Start previous version
docker run -d \
  --name hospital-identity-service-v2 \
  --network hospital-network \
  -p 3021:3021 \
  --env-file .env \
  identity-service:1.9.0

# Verify health
curl http://localhost:3021/health
```

### 2. Database Rollback
```bash
# Rollback migrations
psql -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -f migrations/rollback/latest.sql

# Verify rollback
psql -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -c "SELECT version FROM auth_schema.schema_migrations ORDER BY version DESC LIMIT 1;"
```

### 3. Post-Rollback
- [ ] Verify service health
- [ ] Check error rates
- [ ] Monitor user reports
- [ ] Document rollback reason
- [ ] Plan fix for next deployment

---

## Support

**Documentation**: https://docs.hospital.com/identity-service
**Runbooks**: https://docs.hospital.com/runbooks/identity
**Slack**: #identity-service-support
**On-Call**: ops@hospital.com

**Emergency Contacts**:
- DevOps Lead: +84-xxx-xxx-xxx
- Backend Lead: +84-xxx-xxx-xxx
- Security Team: security@hospital.com
