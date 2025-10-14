# API Gateway - Deployment Checklist

## 📋 Pre-Deployment Checklist

### 1. Dependencies Installation
```bash
cd backend/services-v2/api-gateway
npm install
```

### 2. Environment Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Update `JWT_SECRET` (use strong random string)
- [ ] Update `SUPABASE_URL`
- [ ] Update `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Update `ALLOWED_ORIGINS` (production domains)
- [ ] Verify all service URLs

### 3. Database Setup (Supabase)
- [ ] Create `auth_schema` schema if not exists
- [ ] Create `user_permissions` table
- [ ] Create `user_roles` table
- [ ] Create `role_permissions` table
- [ ] Run `database/functions/check_user_permission.sql`
- [ ] Grant permissions to service_role

### 4. Build & Test
```bash
# Build
npm run build

# Run tests
npm test

# Check for TypeScript errors
npx tsc --noEmit

# Lint
npm run lint
```

### 5. Docker Build
```bash
# Build image
docker build -t api-gateway:latest .

# Test locally
docker run -p 3101:3101 --env-file .env api-gateway:latest
```

### 6. Integration Testing
- [ ] Test authentication with Identity Service
- [ ] Test proxying to Patient Registry Service
- [ ] Test proxying to Provider Staff Service
- [ ] Test health endpoints
- [ ] Test rate limiting
- [ ] Test error handling

## 🚀 Deployment Steps

### Option 1: Docker Compose (Recommended)

```bash
cd backend/services-v2

# Start with gateway profile
docker-compose -f docker-compose.v2.yml --profile gateway up -d

# Or start full stack
docker-compose -f docker-compose.v2.yml --profile full up -d

# Check logs
docker-compose -f docker-compose.v2.yml logs -f api-gateway

# Check health
curl http://localhost:3101/health
```

### Option 2: Standalone

```bash
cd backend/services-v2/api-gateway

# Install production dependencies
npm ci --only=production

# Build
npm run build

# Start
npm start
```

## ✅ Post-Deployment Verification

### 1. Health Checks
```bash
# Overall health
curl http://localhost:3101/health

# Readiness
curl http://localhost:3101/health/ready

# Liveness
curl http://localhost:3101/health/live
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-01-10T12:00:00.000Z",
  "services": [
    {
      "service": "identity-service",
      "healthy": true,
      "url": "http://identity-service:3001"
    },
    {
      "service": "patient-registry-service",
      "healthy": true,
      "url": "http://patient-registry-service:3003"
    }
  ]
}
```

### 2. Authentication Test
```bash
# 1. Get JWT token from Identity Service
curl -X POST http://localhost:3101/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# 2. Use token to access protected endpoint
curl -X GET http://localhost:3101/api/v1/patients \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Proxy Test
```bash
# Test each service route
curl http://localhost:3101/api/v1/auth/health
curl http://localhost:3101/api/v1/patients/health
curl http://localhost:3101/api/v1/providers/health
curl http://localhost:3101/api/v1/appointments/health
curl http://localhost:3101/api/v1/clinical/health
curl http://localhost:3101/api/v1/billing/health
```

### 4. Rate Limiting Test
```bash
# Send 1000+ requests rapidly
for i in {1..1100}; do
  curl http://localhost:3101/api/v1/patients
done

# Should get 429 Too Many Requests after 1000 requests
```

### 5. Error Handling Test
```bash
# Test 404
curl http://localhost:3101/api/v1/nonexistent

# Test 401 (no token)
curl http://localhost:3101/api/v1/patients

# Test 401 (invalid token)
curl http://localhost:3101/api/v1/patients \
  -H "Authorization: Bearer invalid-token"
```

## 📊 Monitoring

### Logs
```bash
# Docker Compose
docker-compose -f docker-compose.v2.yml logs -f api-gateway

# Standalone
tail -f logs/api-gateway.log
```

### Metrics to Monitor
- Request count per service
- Response time per service
- Error rate per service
- Circuit breaker state
- Rate limit hits
- Authentication failures

## 🔧 Troubleshooting

### Issue: API Gateway not starting
**Check**:
- Environment variables are set
- Port 3101 is not in use
- Dependencies are installed
- Build completed successfully

### Issue: Authentication failing
**Check**:
- JWT_SECRET matches Identity Service
- JWT_ISSUER and JWT_AUDIENCE are correct
- Token is not expired
- Token format is correct (Bearer <token>)

### Issue: Proxy not working
**Check**:
- Downstream service is running
- Service URL is correct
- Network connectivity
- Health check passing

### Issue: Permission check failing
**Check**:
- Supabase RPC function exists
- User has permissions in database
- SUPABASE_SERVICE_ROLE_KEY is correct
- Database schema is correct

## 🔐 Security Checklist

- [ ] JWT_SECRET is strong and unique
- [ ] SUPABASE_SERVICE_ROLE_KEY is kept secret
- [ ] ALLOWED_ORIGINS is restricted to production domains
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] Helmet security headers are enabled
- [ ] Error messages don't leak sensitive information
- [ ] Logs don't contain sensitive data

## 📝 Rollback Plan

If deployment fails:

```bash
# Stop API Gateway
docker-compose -f docker-compose.v2.yml stop api-gateway

# Remove container
docker-compose -f docker-compose.v2.yml rm -f api-gateway

# Revert to previous version
git checkout <previous-commit>

# Rebuild and restart
docker-compose -f docker-compose.v2.yml --profile gateway up -d --build
```

## ✅ Deployment Complete

Once all checks pass:
- [ ] Update documentation
- [ ] Notify team
- [ ] Monitor for 24 hours
- [ ] Update runbook if needed

---

**Last Updated**: 2025-01-10  
**Version**: 1.0.0  
**Status**: Ready for Deployment

