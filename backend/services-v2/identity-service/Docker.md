# Identity Service - Docker Guide

Hướng dẫn chi tiết về build, run và test Identity Service với Docker.

> **✅ Đã test thành công:** Tất cả services đã được test và chạy ổn định với Docker Compose
> 
> **Thời gian build:** ~2-3 phút (no-cache build)
> 
> **Thời gian startup:** ~60 giây (bao gồm health checks)

## Prerequisites

- Docker >= 20.10
- Docker Compose >= 2.0 (hoặc Docker Desktop trên Windows/Mac)
- Node.js >= 18.0.0 (chỉ cần cho development, không cần cho Docker deployment)

## Quick Start

### 1. Cấu hình Environment Variables

Tạo file `.env` trong thư mục `backend/services-v2/identity-service/`:

```bash
cp .env.example .env
```

Cập nhật các giá trị sau trong file `.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Security
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Hospital Management System

# Frontend
FRONTEND_URL=http://localhost:3000

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3101
```

### 2. Build Docker Image

Từ thư mục `backend/services-v2/`:

```bash
# Build với --no-cache để đảm bảo build mới hoàn toàn
docker build --no-cache -f identity-service/Dockerfile -t identity-service:latest .
```

**Lưu ý**: Build context phải là `backend/services-v2/` để có thể access cả `identity-service` và `shared` folders.

### 3. Khởi động Services với Docker Compose

Từ thư mục `backend/services-v2/`:

```bash
# Khởi động toàn bộ stack (Identity Service + Redis + RabbitMQ)
docker compose -f identity-service/compose.yml --env-file .env up -d
```

Hoặc từ thư mục `backend/services-v2/identity-service/`:

```bash
# Copy .env từ parent directory
cp ../.env .env

# Khởi động services
docker compose up -d
```

### 4. Verify Services ✅

Sau khi services đã start (~60 giây), kiểm tra trạng thái:

#### A. Kiểm tra Container Status

```bash
# Xem tất cả containers
docker ps --filter "name=identity-"

# Expected output:
# - identity-service (status: healthy)
# - identity-redis (status: healthy)
# - identity-rabbitmq (status: healthy)
```

#### B. Kiểm tra Identity Service Health

```bash
# PowerShell (Windows)
curl http://localhost:3021/health

# Bash/Linux/Mac
curl -f http://localhost:3021/health

# Expected response:
# {
#   "overall": "HEALTHY",
#   "components": {
#     "database": {"status": "HEALTHY"},
#     "cache": {"status": "HEALTHY"},
#     "eventBus": {"status": "HEALTHY"}
#   }
# }
```

#### C. Kiểm tra Redis

```bash
# PowerShell (Windows) - không dùng -it flag
docker exec identity-redis redis-cli ping
# Expected: PONG

# Test write/read
docker exec identity-redis redis-cli SET test "Hello"
docker exec identity-redis redis-cli GET test
# Expected: Hello
```

#### D. Kiểm tra RabbitMQ

```bash
# Kiểm tra RabbitMQ Management UI
curl http://localhost:15672

# Hoặc mở browser:
# URL: http://localhost:15672
# Username: admin
# Password: admin
```

#### E. Xem Logs

```bash
# Tất cả services
docker compose logs -f

# Specific service
docker compose logs -f identity-service
docker compose logs -f redis
docker compose logs -f rabbitmq

# Chỉ xem 100 dòng cuối
docker compose logs --tail=100 identity-service
```

## Architecture

### Multi-Stage Build

Dockerfile sử dụng 3 stages để tối ưu kích thước image:

1. **Dependencies Stage**: Cài đặt tất cả dependencies (bao gồm devDependencies)
2. **Builder Stage**: Build TypeScript code
3. **Production Stage**: Chỉ chứa production dependencies và compiled code

### Services trong Docker Compose

- **identity-service**: Main application (Port 3021)
- **redis**: Cache layer (Port 6379)
- **rabbitmq**: Message broker (Ports 5672, 15672)

## Commands Reference

### Build Commands

```bash
# Build từ scratch (no cache)
cd backend/services-v2
docker build --no-cache -f identity-service/Dockerfile -t identity-service:latest .

# Build với cache
docker build -f identity-service/Dockerfile -t identity-service:latest .

# Build specific stage
docker build --target builder -f identity-service/Dockerfile -t identity-service:builder .
```

### Run Commands

```bash
# Start all services
docker compose -f identity-service/compose.yml up -d

# Start specific service
docker compose -f identity-service/compose.yml up -d identity-service

# Stop all services
docker compose -f identity-service/compose.yml down

# Stop and remove volumes
docker compose -f identity-service/compose.yml down -v

# Restart service
docker compose -f identity-service/compose.yml restart identity-service
```

### Logs & Debugging

```bash
# View logs
docker compose -f identity-service/compose.yml logs -f

# View specific service logs
docker compose -f identity-service/compose.yml logs -f identity-service

# Execute command in container
docker exec -it identity-service sh

# View container stats
docker stats identity-service
```

### Testing

```bash
# Health check
curl http://localhost:3021/health

# Test API endpoints
curl -X POST http://localhost:3021/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "fullName": "Test User",
    "role": "PATIENT"
  }'

# Check Redis connection
docker exec -it identity-redis redis-cli
> PING
> KEYS *

# Check RabbitMQ queues
# Open http://localhost:15672 in browser
```

## Testing Endpoints 🧪

### 1. Test User Registration

```bash
# PowerShell
$body = @{
    email = "test@example.com"
    password = "SecurePass123!"
    fullName = "Test User"
    role = "PATIENT"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3021/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

# Bash/curl
curl -X POST http://localhost:3021/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "fullName": "Test User",
    "role": "PATIENT"
  }'
```

### 2. Test User Login

```bash
# PowerShell
$body = @{
    email = "test@example.com"
    password = "SecurePass123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3021/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

# Bash/curl
curl -X POST http://localhost:3021/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### 3. Test Swagger Documentation

```bash
# Mở browser
http://localhost:3021/api-docs
```

## Troubleshooting 🔧

### 1. Port Already in Use

**Vấn đề:** Port 3021, 6379, hoặc 5672 đã được sử dụng

```bash
# Windows PowerShell
netstat -ano | findstr :3021
netstat -ano | findstr :6379
netstat -ano | findstr :5672

# macOS/Linux
lsof -i :3021
lsof -i :6379
lsof -i :5672

# Giải pháp 1: Kill process đang dùng port
# Windows (với PID từ netstat)
taskkill /PID <PID> /F

# macOS/Linux
kill -9 <PID>

# Giải pháp 2: Đổi port trong .env
IDENTITY_SERVICE_PORT=3022
REDIS_PORT=6380
RABBITMQ_PORT=5673
```

### 2. Container Won't Start (Unhealthy)

**Vấn đề:** Container start nhưng health check fail

#### Redis Unhealthy

```bash
# Check logs
docker logs identity-redis

# Common issue: Password configuration
# Solution: Đảm bảo Redis không có password trong dev environment
# Kiểm tra compose.yml, không có --requirepass flag

# Restart Redis
docker compose restart redis
```

#### RabbitMQ Unhealthy

```bash
# Check logs  
docker logs identity-rabbitmq

# Common issue: Deprecated environment variables
# Solution: Đã fix trong compose.yml (không dùng RABBITMQ_VM_MEMORY_HIGH_WATERMARK)

# Restart RabbitMQ
docker compose restart rabbitmq

# Check if RabbitMQ is ready
docker exec identity-rabbitmq rabbitmq-diagnostics ping
```

#### Identity Service Unhealthy

```bash
# Check detailed logs
docker logs identity-service --tail=100

# Common issues:
# 1. Supabase connection failed
# 2. Redis connection failed
# 3. RabbitMQ connection failed

# Check environment variables
docker exec identity-service printenv | grep -E "SUPABASE|REDIS|RABBITMQ"

# Restart service
docker compose restart identity-service
```

### 3. Build Errors

**Vấn đề:** Docker build thất bại

#### Error: Cannot find module 'uuid'

```bash
# Solution: Đã fix trong Dockerfile
# Dockerfile install uuid trong shared module và identity-service

# Rebuild với no-cache
cd backend/services-v2
docker build --no-cache -f identity-service/Dockerfile -t identity-service:latest .
```

#### Error: "/shared": not found

```bash
# Problem: .dockerignore blocking shared directory
# Solution: Kiểm tra backend/services-v2/.dockerignore

# Đảm bảo shared directory KHÔNG bị exclude
# shared/ should NOT be in .dockerignore

# Rebuild
docker build --no-cache -f identity-service/Dockerfile -t identity-service:latest .
```

#### Error: npm ci failed - no package-lock.json

```bash
# Problem: package-lock.json bị exclude bởi .dockerignore
# Solution: Update .dockerignore

# Đảm bảo identity-service/package-lock.json được include
# Chỉ exclude package-lock.json của các service khác

# Clean và rebuild
docker builder prune -a
docker build --no-cache -f identity-service/Dockerfile -t identity-service:latest .
```

### 4. Database Connection Issues

**Vấn đề:** Identity Service không kết nối được Supabase

```bash
# Verify Supabase credentials
cat .env | grep SUPABASE  # Linux/Mac
Select-String -Path .env -Pattern "SUPABASE"  # PowerShell

# Required variables:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY (nếu cần)
# - SUPABASE_SERVICE_ROLE_KEY
# - SUPABASE_JWT_SECRET

# Test từ container
docker exec identity-service node -e "console.log(process.env.SUPABASE_URL)"

# Restart với updated .env
docker compose down
docker compose up -d
```

### 5. Permission Denied Errors

**Vấn đề:** Container không có quyền ghi logs

```bash
# Check volume permissions
docker volume inspect identity-logs

# Recreate volume
docker compose down -v
docker compose up -d

# Logs directory được tạo tự động với user 'identity' (UID 1001)
```

### 6. Clean Slate - Reset Everything

**Khi nào dùng:** Khi mọi thứ bị lộn xộn và muốn start lại từ đầu

```bash
# CẢNH BÁO: Lệnh này sẽ xóa TẤT CẢ containers, volumes, và data

# Stop và remove tất cả
cd backend/services-v2/identity-service
docker compose down -v

# Remove image
docker rmi identity-service:latest

# Clean Docker cache
docker builder prune -a

# Rebuild và restart
cd ..
docker build --no-cache -f identity-service/Dockerfile -t identity-service:latest .
cd identity-service
docker compose up -d

# Wait và verify
Start-Sleep -Seconds 60  # PowerShell
sleep 60  # Bash

docker ps --filter "name=identity-"
curl http://localhost:3021/health
```

## Production Deployment

### Security Checklist

- [ ] Update all secrets in `.env`
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Enable log aggregation
- [ ] Configure backup strategy
- [ ] Review and update CORS settings
- [ ] Enable rate limiting
- [ ] Set up health checks

### Performance Optimization

```yaml
# Add resource limits in compose.yml
services:
  identity-service:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Monitoring

```bash
# View metrics
curl http://localhost:3021/metrics

# Prometheus integration
# Add Prometheus scrape config:
# - job_name: 'identity-service'
#   static_configs:
#     - targets: ['identity-service:3021']
```

## Additional Resources

- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Identity Service README](./README.md)
- [API Documentation](./docs/api/)

## Best Practices 📋

### Development

1. **Always use docker compose** thay vì docker run
   - Đảm bảo tất cả dependencies (Redis, RabbitMQ) được start
   - Network và volumes được config đúng

2. **Check health before testing**
   ```bash
   # Wait for all services healthy
   docker ps --filter "name=identity-"
   
   # All should show (healthy) status
   ```

3. **Use logs for debugging**
   ```bash
   # Real-time logs
   docker compose logs -f
   
   # Specific timeframe
   docker compose logs --since 5m identity-service
   ```

4. **Clean up regularly**
   ```bash
   # Remove unused images và containers
   docker system prune -a
   
   # Remove volumes (CAREFUL: deletes data)
   docker compose down -v
   ```

### Production

1. **Environment Variables**
   - NEVER commit `.env` files
   - Use secrets management (Docker Secrets, Kubernetes Secrets, AWS Secrets Manager)
   - Rotate credentials regularly

2. **Resource Limits**
   - Deploy resources đã được config trong `compose.yml`
   - Monitor và adjust dựa trên actual usage

3. **Health Checks**
   - All services có health checks
   - Configure orchestrator (Docker Swarm, Kubernetes) restart policies

4. **Monitoring**
   - Prometheus metrics: `http://localhost:3021/metrics`
   - Set up Grafana dashboards
   - Configure alerts

5. **Logging**
   - Use centralized logging (ELK, Loki, CloudWatch)
   - Set log retention policies
   - Don't log sensitive data (passwords, tokens)

## Common Workflows 🔄

### Daily Development

```bash
# 1. Start services
cd backend/services-v2/identity-service
docker compose up -d

# 2. Verify health
docker ps
curl http://localhost:3021/health

# 3. Develop và test
# ... your development work ...

# 4. Check logs nếu có issue
docker compose logs -f identity-service

# 5. Stop khi done
docker compose down
```

### After Code Changes

```bash
# Rebuild và restart service
docker compose up --build -d identity-service

# Verify new version
docker logs identity-service --tail=50
curl http://localhost:3021/health
```

### Testing Full Stack

```bash
# 1. Start all infrastructure
docker compose up -d

# 2. Run tests
npm test

# 3. Test API endpoints
# (See Testing Endpoints section above)

# 4. Clean up
docker compose down -v
```

## Performance Tips ⚡

1. **Docker Build Cache**
   ```bash
   # Use cache for faster builds
   docker build -f identity-service/Dockerfile -t identity-service:latest .
   
   # Only use --no-cache khi cần
   docker build --no-cache -f identity-service/Dockerfile -t identity-service:latest .
   ```

2. **Multi-stage Build Optimization**
   - Dependencies stage: cached nếu package.json không thay đổi
   - Builder stage: cached nếu source code không thay đổi
   - Production stage: luôn mới với compiled code

3. **Volume Mounting cho Development**
   ```yaml
   # Thêm vào compose.yml cho hot reload
   volumes:
     - ./src:/app/identity-service/src:ro
   ```

4. **Resource Monitoring**
   ```bash
   # Real-time resource usage
   docker stats identity-service identity-redis identity-rabbitmq
   ```

## Service Architecture 🏗️

```
┌─────────────────────────────────────────┐
│         Identity Service (3021)          │
│  ┌────────────────────────────────────┐ │
│  │  Presentation Layer (Controllers)  │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Application Layer (Use Cases)     │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Domain Layer (Entities, VOs)      │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Infrastructure Layer              │ │
│  │  - Database: Supabase              │ │
│  │  - Cache: Redis                    │ │
│  │  - Events: RabbitMQ                │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
           ↓           ↓          ↓
    ┌──────────┐  ┌────────┐  ┌──────────┐
    │ Supabase │  │ Redis  │  │ RabbitMQ │
    │ (Cloud)  │  │ (6379) │  │  (5672)  │
    └──────────┘  └────────┘  └──────────┘
```

## Quick Reference Card 📇

### Essential Commands

| Task | Command |
|------|---------|
| Build image | `docker build --no-cache -f identity-service/Dockerfile -t identity-service:latest .` |
| Start all | `docker compose up -d` |
| Stop all | `docker compose down` |
| Reset all | `docker compose down -v` |
| View logs | `docker compose logs -f` |
| Check health | `curl http://localhost:3021/health` |
| Check status | `docker ps --filter "name=identity-"` |
| Redis test | `docker exec identity-redis redis-cli ping` |
| RabbitMQ UI | `http://localhost:15672` (admin/admin) |

### Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Identity API | http://localhost:3021 | N/A |
| Health Check | http://localhost:3021/health | N/A |
| Swagger Docs | http://localhost:3021/api-docs | N/A |
| Prometheus Metrics | http://localhost:3021/metrics | N/A |
| Redis | localhost:6379 | None (dev) |
| RabbitMQ AMQP | localhost:5672 | admin/admin |
| RabbitMQ Management | http://localhost:15672 | admin/admin |

## Support

Nếu gặp vấn đề:

1. **Check logs first**: `docker compose logs -f`
2. **Verify environment variables**: Kiểm tra `.env` file
3. **Check network connectivity**: Đảm bảo ports không bị block
4. **Review health endpoints**: `curl http://localhost:3021/health`
5. **Try clean restart**: `docker compose down -v && docker compose up -d`
6. **Check documentation**: [README.md](./README.md), [API Documentation](./docs/api/)

## Changelog

### Version 2.0.0 (2025-10-26)

- ✅ Multi-stage Dockerfile với optimization
- ✅ Docker Compose với Redis + RabbitMQ
- ✅ Health checks cho tất cả services
- ✅ Resource limits và monitoring
- ✅ Comprehensive troubleshooting guide
- ✅ Windows PowerShell support
- ✅ Production-ready configuration

