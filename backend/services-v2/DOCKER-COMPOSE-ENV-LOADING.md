# Docker Compose Environment Loading

## 🎯 Overview

Docker Compose now **automatically loads** `.env.docker` files for each service without requiring manual copying.

## 🔧 Implementation

### What Changed

**Before:**
```bash
# Had to manually copy first
npm run env:docker
docker-compose up
```

**After (Now):**
```bash
# Just run directly - auto-loads .env.docker
docker-compose -f docker-compose.v2.yml --profile full up -d
```

### How It Works

Each service in `docker-compose.v2.yml` now has:

```yaml
services:
  identity-service:
    env_file:
      - .env.docker                      # Root shared configs
      - ./identity-service/.env.docker   # Service-specific configs
    environment:
      # Explicit overrides (optional)
      - NODE_ENV=production
      - PORT=3001
```

### Loading Priority

Docker Compose merges environment variables in this order (last wins):

1. **`.env.docker`** (root) - Shared configs like SUPABASE_URL, Redis, RabbitMQ
2. **`./service/.env.docker`** - Service-specific configs
3. **`environment` section** - Explicit overrides in docker-compose.yml
4. **Shell environment** - Variables set in terminal

```
┌─────────────────────────────────────────────────────────┐
│  Priority (Last Wins):                                  │
│                                                         │
│  1. .env.docker (root)           ← Lowest priority     │
│  2. service/.env.docker          ↑                     │
│  3. environment: section         ↑                     │
│  4. Shell env (export VAR=...)   ← Highest priority    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 📋 Configuration Structure

### Root `.env.docker`

Shared configurations for all services:

```bash
# backend/services-v2/.env.docker
SUPABASE_URL=https://...
REDIS_URL=redis://redis-v2:6379
RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672

# Service URLs (Docker network names)
IDENTITY_SERVICE_URL=http://identity-service:3001
PATIENT_SERVICE_URL=http://patient-registry-service:3003
```

### Service `.env.docker`

Service-specific configurations:

```bash
# backend/services-v2/identity-service/.env.docker
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
SERVICE_NAME=identity-service
DATABASE_SCHEMA=auth_schema
```

### Docker Compose `environment`

Explicit overrides (when needed):

```yaml
environment:
  - NODE_ENV=production  # Override if different from .env.docker
  - PORT=3001            # Explicit for clarity
```

## 🚀 Usage

### Start Services

```bash
# All services
npm run dev:all

# Specific profile
docker-compose -f docker-compose.v2.yml --profile core up -d

# With rebuild
npm run dev:full:build
```

### No Manual Env Switching Required

```bash
# ❌ Old way (no longer needed)
npm run env:docker
docker-compose up

# ✅ New way (direct)
docker-compose -f docker-compose.v2.yml --profile full up -d
```

### Check Loaded Variables

```bash
# Inside running container
docker exec -it hospital-identity-service-v2 env | grep NODE_ENV
docker exec -it hospital-identity-service-v2 env | grep REDIS_URL
```

## 🔍 Verification

### Test Environment Loading

```bash
# 1. Start a service
docker-compose -f docker-compose.v2.yml up identity-service -d

# 2. Check environment
docker exec hospital-identity-service-v2 env | grep -E "NODE_ENV|REDIS_URL|PORT"

# Expected output:
# NODE_ENV=production
# PORT=3001
# REDIS_URL=redis://redis-v2:6379
```

### Debug Missing Variables

If a variable is not loaded:

```bash
# 1. Check .env.docker exists
ls -la .env.docker
ls -la identity-service/.env.docker

# 2. Check docker-compose.yml has env_file
grep -A2 "env_file" docker-compose.v2.yml

# 3. Check variable in file
grep "REDIS_URL" .env.docker
```

## ⚙️ Advanced

### Override for Specific Service

```bash
# Override single variable
docker-compose -f docker-compose.v2.yml up -d \
  -e REDIS_URL=redis://custom-redis:6379 \
  identity-service
```

### Use Different Env File

```bash
# Use .env.staging instead
docker-compose -f docker-compose.v2.yml \
  --env-file .env.staging \
  up -d
```

### Multiple Env Files

```yaml
# docker-compose.v2.yml
services:
  identity-service:
    env_file:
      - .env.docker          # Shared
      - .env.secrets         # Secrets (gitignored)
      - ./identity-service/.env.docker  # Service-specific
```

## 🔒 Security

### What's in Git

```bash
# ✅ Committed
.env.example
**/.env.example

# ❌ NOT in Git (ignored)
.env
.env.local
.env.docker
**/.env
**/.env.local
**/.env.docker
```

### Secrets Management

For production:

```bash
# Option 1: Use .env.secrets (gitignored)
env_file:
  - .env.docker
  - .env.secrets  # Contains sensitive keys

# Option 2: Docker secrets
secrets:
  - supabase_key
  - jwt_secret

# Option 3: Environment variables from CI/CD
# Set in GitHub Actions, GitLab CI, etc.
```

## 🐛 Troubleshooting

### Problem: Variable not loaded

**Check:**
1. File exists: `ls -la .env.docker service/.env.docker`
2. Correct syntax: `KEY=value` (no spaces around `=`)
3. No quotes issues: Use `KEY="value with spaces"`
4. File encoding: Should be UTF-8, LF line endings

### Problem: Wrong value loaded

**Check priority:**
```bash
# Which value wins?
# 1. Check .env.docker (root)
grep REDIS_URL .env.docker

# 2. Check service/.env.docker
grep REDIS_URL identity-service/.env.docker

# 3. Check environment: section
grep -A5 "environment:" docker-compose.v2.yml | grep REDIS_URL

# Last one found = value used
```

### Problem: Service can't connect

**Symptoms:**
```
Error: connect ECONNREFUSED redis-v2:6379
```

**Solution:**
```bash
# 1. Check network
docker network inspect hospital-v2-network

# 2. Check service is running
docker ps | grep redis-v2

# 3. Check environment in container
docker exec hospital-identity-service-v2 env | grep REDIS_URL

# Should be: redis://redis-v2:6379 (NOT localhost!)
```

## 📚 Best Practices

### 1. Use env_file for Defaults

```yaml
# ✅ Good
env_file:
  - .env.docker
environment:
  - NODE_ENV=production  # Only explicit overrides

# ❌ Avoid
environment:
  - SUPABASE_URL=https://...  # Should be in .env.docker
  - REDIS_URL=redis://...     # Should be in .env.docker
```

### 2. Keep Service Files Focused

```bash
# service/.env.docker should contain ONLY service-specific configs
PORT=3001
LOG_LEVEL=info
DATABASE_SCHEMA=auth_schema

# NOT shared configs (put in root .env.docker)
# SUPABASE_URL=...  ❌
# REDIS_URL=...     ❌
```

### 3. Document Required Variables

```yaml
# docker-compose.yml comment
services:
  identity-service:
    # Required in .env.docker:
    # - SUPABASE_URL
    # - JWT_SECRET
    # - REDIS_URL
    env_file:
      - .env.docker
```

## ✅ Benefits

### Before (Manual Copy)
- ❌ Had to run `npm run env:docker` first
- ❌ Easy to forget
- ❌ `.env` file could be stale
- ❌ Switching between environments required manual steps

### After (Auto-Load)
- ✅ Docker Compose loads `.env.docker` automatically
- ✅ Always uses correct environment
- ✅ No manual steps required
- ✅ Consistent across all developers

## 🎓 Summary

| Aspect | Local Development | Docker Compose |
|--------|------------------|----------------|
| Env File | `.env.local` | `.env.docker` |
| Loading | Manual `npm run env:local` | Automatic via `env_file` |
| Redis URL | `localhost:6379` | `redis-v2:6379` |
| Service URLs | `localhost:PORT` | `service-name:PORT` |
| Node Env | `development` | `production` |

**Key Takeaway:** Docker Compose now handles environment loading automatically! 🎉
