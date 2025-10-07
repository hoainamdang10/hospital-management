# Identity Service - Operations Runbook

**Version**: 1.0.0  
**Last Updated**: 2025-01-06  
**Status**: 📋 Draft

---

## Overview

This runbook provides operational procedures for Identity Service, including:
- Service startup/shutdown
- Health checks
- Common troubleshooting
- Recovery procedures
- Pre-demo checklist

---

## Service Information

### Service Details
- **Name**: Identity Service
- **Port**: 3021
- **Health Endpoint**: `http://localhost:3021/health`
- **Metrics Endpoint**: `http://localhost:3021/metrics`
- **Dependencies**: Supabase (PostgreSQL), Redis, RabbitMQ

### Contact Information
- **Team**: Identity Team
- **On-Call**: [On-call rotation]
- **Slack Channel**: #identity-service
- **Email**: identity-team@hospital.com

---

## Service Startup

### Prerequisites
1. Supabase is running and accessible
2. Redis is running (port 6379)
3. RabbitMQ is running (port 5672)
4. Environment variables are configured

### Startup Procedure

#### Option 1: Docker Compose (Recommended)
```bash
cd backend/services-v2

# Start infrastructure first
docker-compose -f docker-compose.v2.yml --profile infrastructure up -d

# Wait 10 seconds for infrastructure to be ready
sleep 10

# Start identity service
docker-compose -f docker-compose.v2.yml up -d identity-service

# Check logs
docker-compose logs -f identity-service
```

#### Option 2: Local Development
```bash
cd backend/services-v2/identity-service

# Install dependencies (first time only)
npm install

# Run migrations
npm run migrate

# Start service
npm run dev
```

### Verification
```bash
# Check health
curl http://localhost:3021/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2025-01-06T10:30:00Z",
  "uptime": 123,
  "dependencies": {
    "database": "healthy",
    "redis": "healthy",
    "rabbitmq": "healthy"
  }
}
```

---

## Service Shutdown

### Graceful Shutdown

#### Docker Compose
```bash
cd backend/services-v2

# Stop identity service
docker-compose stop identity-service

# Wait for graceful shutdown (max 30 seconds)
docker-compose logs identity-service | grep "Shutting down"
```

#### Local Development
```bash
# Press Ctrl+C in terminal
# Service will gracefully shutdown

# Or send SIGTERM
kill -TERM <pid>
```

### Force Shutdown (Emergency Only)
```bash
# Docker
docker-compose kill identity-service

# Local
kill -9 <pid>
```

---

## Health Checks

### Health Check Endpoints

#### 1. Basic Health Check
```bash
curl http://localhost:3021/health
```

**Healthy Response (200)**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-06T10:30:00Z"
}
```

**Unhealthy Response (503)**:
```json
{
  "status": "unhealthy",
  "timestamp": "2025-01-06T10:30:00Z",
  "errors": ["Database connection failed"]
}
```

#### 2. Detailed Health Check
```bash
curl http://localhost:3021/health/detailed
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-06T10:30:00Z",
  "uptime": 3600,
  "dependencies": {
    "database": {
      "status": "healthy",
      "responseTime": 5
    },
    "redis": {
      "status": "healthy",
      "responseTime": 2
    },
    "rabbitmq": {
      "status": "healthy",
      "responseTime": 3
    }
  },
  "metrics": {
    "requestsPerMinute": 120,
    "averageResponseTime": 50,
    "errorRate": 0.01
  }
}
```

### Health Check Schedule
- **Kubernetes**: Every 10 seconds
- **Docker Compose**: Every 30 seconds
- **Manual**: Before and after deployments

---

## Common Issues & Troubleshooting

### Issue 1: Service Won't Start

#### Symptoms
- Service exits immediately
- Health check fails
- Error in logs: "Cannot connect to database"

#### Diagnosis
```bash
# Check logs
docker-compose logs identity-service

# Check dependencies
docker-compose ps
```

#### Solution
```bash
# 1. Check Supabase connection
curl https://your-project.supabase.co

# 2. Verify environment variables
cat .env | grep SUPABASE

# 3. Restart dependencies
docker-compose restart redis-v2 rabbitmq-v2

# 4. Restart service
docker-compose restart identity-service
```

---

### Issue 2: High Response Time

#### Symptoms
- API responses > 1 second
- Health check shows high response time
- Users complaining about slow login

#### Diagnosis
```bash
# Check metrics
curl http://localhost:3021/metrics

# Check database connections
docker-compose exec identity-service npm run db:check

# Check Redis
docker-compose exec redis-v2 redis-cli ping
```

#### Solution
```bash
# 1. Check database query performance
# Review slow query logs in Supabase

# 2. Clear Redis cache
docker-compose exec redis-v2 redis-cli FLUSHDB

# 3. Restart service
docker-compose restart identity-service

# 4. Scale horizontally (if needed)
docker-compose up -d --scale identity-service=3
```

---

### Issue 3: Authentication Failures

#### Symptoms
- Users cannot login
- Error: "Invalid credentials" for valid users
- JWT token validation fails

#### Diagnosis
```bash
# Check JWT secret
echo $JWT_SECRET

# Check Supabase JWT secret
echo $SUPABASE_JWT_SECRET

# Test login
curl -X POST http://localhost:3021/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

#### Solution
```bash
# 1. Verify JWT secrets match
# Check .env file

# 2. Check user status in database
# Login to Supabase and check auth.users table

# 3. Clear failed login attempts
# Run SQL: UPDATE auth.login_attempts SET attempts = 0

# 4. Restart service
docker-compose restart identity-service
```

---

### Issue 4: Account Locked

#### Symptoms
- User cannot login
- Error: "Account is locked"
- Too many failed login attempts

#### Diagnosis
```bash
# Check login attempts
# Query: SELECT * FROM auth.login_attempts WHERE email = 'user@example.com'
```

#### Solution
```bash
# Option 1: Wait for auto-unlock (1 hour)

# Option 2: Manual unlock (Admin)
curl -X POST http://localhost:3021/api/v1/admin/users/{userId}/unlock \
  -H "Authorization: Bearer <admin_token>"

# Option 3: Database unlock
# SQL: UPDATE auth.users SET is_locked = false WHERE email = 'user@example.com'
```

---

## Recovery Procedures

### Procedure 1: Database Connection Lost

#### Steps
1. Check Supabase status
2. Verify network connectivity
3. Check connection pool
4. Restart service
5. Verify health check

#### Commands
```bash
# 1. Check Supabase
curl https://your-project.supabase.co

# 2. Check connection pool
docker-compose exec identity-service npm run db:pool-status

# 3. Restart service
docker-compose restart identity-service

# 4. Verify
curl http://localhost:3021/health
```

---

### Procedure 2: Redis Connection Lost

#### Steps
1. Check Redis status
2. Restart Redis
3. Clear cache
4. Restart service
5. Verify health check

#### Commands
```bash
# 1. Check Redis
docker-compose exec redis-v2 redis-cli ping

# 2. Restart Redis
docker-compose restart redis-v2

# 3. Restart service
docker-compose restart identity-service

# 4. Verify
curl http://localhost:3021/health
```

---

### Procedure 3: RabbitMQ Connection Lost

#### Steps
1. Check RabbitMQ status
2. Check queue status
3. Restart RabbitMQ
4. Restart service
5. Verify event publishing

#### Commands
```bash
# 1. Check RabbitMQ
curl http://localhost:15673

# 2. Check queues
docker-compose exec rabbitmq-v2 rabbitmqctl list_queues

# 3. Restart RabbitMQ
docker-compose restart rabbitmq-v2

# 4. Restart service
docker-compose restart identity-service

# 5. Test event publishing
curl -X POST http://localhost:3021/api/v1/test/publish-event
```

---

## Pre-Demo Checklist

### 1 Day Before Demo

- [ ] Verify all services are running
- [ ] Run health checks on all dependencies
- [ ] Check database migrations are up to date
- [ ] Verify test data is seeded
- [ ] Test all critical user flows
- [ ] Check logs for errors
- [ ] Verify backup is recent

### 1 Hour Before Demo

- [ ] Restart all services
- [ ] Clear Redis cache
- [ ] Run smoke tests
- [ ] Verify health checks pass
- [ ] Check response times
- [ ] Prepare demo accounts
- [ ] Open monitoring dashboards

### Demo Accounts

```bash
# Patient Account
Email: patient.demo@hospital.com
Password: DemoPass123!
Role: PATIENT

# Doctor Account
Email: doctor.demo@hospital.com
Password: DemoPass123!
Role: DOCTOR

# Admin Account
Email: admin.demo@hospital.com
Password: DemoPass123!
Role: ADMIN
```

### Critical Flows to Test

1. **Patient Registration**
   ```bash
   POST /api/v1/auth/register/patient
   ```

2. **Patient Login**
   ```bash
   POST /api/v1/auth/login
   ```

3. **Staff Login**
   ```bash
   POST /api/v1/auth/login
   ```

4. **Token Refresh**
   ```bash
   POST /api/v1/auth/refresh
   ```

---

## Monitoring

### Key Metrics
- Request rate (requests/minute)
- Response time (p50, p95, p99)
- Error rate (%)
- Active users
- Failed login attempts
- Account lockouts

### Dashboards
- Grafana: http://localhost:3000
- RabbitMQ Management: http://localhost:15673

### Alerts
- Service down
- High error rate (> 5%)
- High response time (> 1s)
- Database connection issues

---

## Rollback Procedure

### Steps
1. Stop current version
2. Deploy previous version
3. Run health checks
4. Verify functionality
5. Monitor for issues

### Commands
```bash
# 1. Stop current
docker-compose stop identity-service

# 2. Deploy previous version
docker-compose up -d identity-service:previous

# 3. Health check
curl http://localhost:3021/health

# 4. Smoke test
npm run test:smoke
```

---

**Status**: 📋 Draft - To be updated with production procedures  
**Next Update**: Add production-specific procedures and contacts

