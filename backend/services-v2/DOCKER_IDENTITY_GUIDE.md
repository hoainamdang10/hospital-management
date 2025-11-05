# Docker Identity Service - Hướng Dẫn Sử Dụng

> **Identity Service với Docker Compose - Production-Ready Setup**

## 📋 Tổng Quan

Hướng dẫn này mô tả cách build và chạy Identity Service bằng Docker Compose với đầy đủ infrastructure (Redis, RabbitMQ).

### Tính Năng

- ✅ Multi-stage build cho production
- ✅ Non-root user security
- ✅ Health checks tự động
- ✅ Circuit breakers & monitoring
- ✅ RabbitMQ event-driven architecture
- ✅ Redis caching & session management
- ✅ Graceful shutdown
- ✅ HIPAA-compliant logging

---

## 🔧 Yêu Cầu Hệ Thống

### Phần Mềm

- **Docker**: >= 20.10.0
- **Docker Compose**: >= 2.0.0
- **Node.js**: >= 18.0.0 (cho development)
- **npm**: >= 9.0.0

### Kiểm Tra Cài Đặt

```bash
docker --version
# Docker version 28.3.2, build 578ccf6

docker-compose --version
# Docker Compose version v2.39.1
```

### Tài Nguyên

- **CPU**: 2 cores minimum
- **RAM**: 4GB minimum
- **Disk**: 10GB available space

---

## 📦 Cấu Trúc Docker

### Services

| Service | Port | Container Name | Purpose |
|---------|------|----------------|---------|
| identity-service | 3021:3001 | hospital-identity-service-v2 | Main service |
| redis-v2 | 6380:6379 | hospital-redis-v2 | Cache & session |
| rabbitmq-v2 | 5673:5672<br>15673:15672 | hospital-rabbitmq-v2 | Event bus |

### Volumes

- `services-v2_redis-v2-data`: Redis persistent data
- `services-v2_rabbitmq-v2-data`: RabbitMQ persistent data

### Networks

- `services-v2_hospital-v2-network`: Bridge network

---

## 🚀 Quick Start

### Option 1: Sử Dụng Script (Khuyến Nghị)

```bash
# 1. Build service
cd backend/services-v2
./scripts/docker-identity.sh build

# 2. Start service (tự động start infrastructure)
./scripts/docker-identity.sh start

# 3. Kiểm tra health
./scripts/docker-identity.sh health
```

### Option 2: Docker Compose Trực Tiếp

```bash
cd backend/services-v2

# 1. Build image
docker-compose -f docker-compose.v2.yml build identity-service

# 2. Start infrastructure
docker-compose -f docker-compose.v2.yml --profile infrastructure up -d

# 3. Wait for RabbitMQ (important!)
sleep 10

# 4. Start identity service
docker-compose -f docker-compose.v2.yml up -d identity-service

# 5. Check health
curl http://localhost:3021/health
```

---

## 📖 Hướng Dẫn Chi Tiết

### Bước 1: Chuẩn Bị Environment

```bash
# Copy và cấu hình .env file
cd backend/services-v2
cp .env.example .env

# Chỉnh sửa .env với các thông tin cần thiết:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - SUPABASE_JWT_SECRET
# - JWT_SECRET
```

**⚠️ Lưu Ý**: Không commit file `.env` vào Git!

### Bước 2: Build Docker Image

```bash
# Clean build (khuyến nghị cho lần đầu)
./scripts/docker-identity.sh build

# Hoặc rebuild với --no-cache
docker-compose -f docker-compose.v2.yml build --no-cache identity-service
```

**Build stages**:
1. `dependencies`: Install npm packages
2. `builder`: Compile TypeScript
3. `production`: Optimize & minimize image

**Build time**: ~2-3 phút (tùy máy)

### Bước 3: Start Infrastructure

```bash
# Start Redis + RabbitMQ
docker-compose -f docker-compose.v2.yml --profile infrastructure up -d

# Verify infrastructure is running
docker-compose -f docker-compose.v2.yml ps
```

**Important**: Đợi 10 giây để RabbitMQ khởi động hoàn toàn trước khi start identity service.

### Bước 4: Start Identity Service

```bash
# Start service
docker-compose -f docker-compose.v2.yml up -d identity-service

# Check logs
docker-compose -f docker-compose.v2.yml logs -f identity-service
```

**Quan sát logs để xác nhận**:
- ✅ "Identity Service started successfully on port 3001"
- ✅ "Successfully connected to RabbitMQ"
- ✅ "Identity Service is ready to accept requests"

### Bước 5: Verify Service

```bash
# Health check
curl http://localhost:3021/health

# Expected response:
{
  "overall": "HEALTHY",
  "status": "HEALTHY",
  "components": {
    "database": { "status": "HEALTHY" },
    "authentication": { "status": "HEALTHY" },
    "authorization": { "status": "HEALTHY" },
    ...
  }
}
```

---

## 🛠️ Script Quản Lý

File: `scripts/docker-identity.sh`

### Các Lệnh

```bash
# Build
./scripts/docker-identity.sh build

# Start (auto-start infrastructure)
./scripts/docker-identity.sh start

# Stop
./scripts/docker-identity.sh stop

# Restart
./scripts/docker-identity.sh restart

# Logs (follow mode)
./scripts/docker-identity.sh logs

# Health check
./scripts/docker-identity.sh health

# Status (overview)
./scripts/docker-identity.sh status

# Rebuild (clean build)
./scripts/docker-identity.sh rebuild

# Clean up (stop all + remove volumes)
./scripts/docker-identity.sh clean

# Help
./scripts/docker-identity.sh help
```

### Examples

```bash
# View last 100 log lines
./scripts/docker-identity.sh logs 100

# Quick restart after code changes
./scripts/docker-identity.sh restart

# Full rebuild
./scripts/docker-identity.sh rebuild
```

---

## 📊 Monitoring & Health Check

### Health Check Endpoint

```bash
# Basic health check
curl http://localhost:3021/health

# With formatted output (requires jq)
curl -s http://localhost:3021/health | jq '.'
```

### Metrics Endpoint (Protected)

```bash
# Requires authentication
curl -H "X-Metrics-Auth: your-secret-key" \
     http://localhost:3021/metrics
```

### RabbitMQ Management UI

```
URL: http://localhost:15673
Username: admin
Password: admin
```

### Container Logs

```bash
# Follow logs
docker logs -f hospital-identity-service-v2

# Last 50 lines
docker logs --tail=50 hospital-identity-service-v2

# With timestamps
docker logs -t hospital-identity-service-v2
```

### Container Stats

```bash
# Real-time stats
docker stats hospital-identity-service-v2

# CPU, Memory, Network usage
docker stats --no-stream hospital-identity-service-v2
```

---

## 🔧 Các Lệnh Docker Compose Thường Dùng

### Service Management

```bash
# Start services
docker-compose -f docker-compose.v2.yml up -d identity-service

# Stop services
docker-compose -f docker-compose.v2.yml stop identity-service

# Restart services
docker-compose -f docker-compose.v2.yml restart identity-service

# Remove containers
docker-compose -f docker-compose.v2.yml rm -f identity-service
```

### Logs & Debugging

```bash
# View logs
docker-compose -f docker-compose.v2.yml logs identity-service

# Follow logs
docker-compose -f docker-compose.v2.yml logs -f identity-service

# Tail last 100 lines
docker-compose -f docker-compose.v2.yml logs --tail=100 identity-service
```

### Status & Info

```bash
# List all services
docker-compose -f docker-compose.v2.yml ps

# Show running containers
docker-compose -f docker-compose.v2.yml ps --all

# Service details
docker inspect hospital-identity-service-v2
```

### Exec Commands

```bash
# Execute command in container
docker exec -it hospital-identity-service-v2 sh

# Check Node version
docker exec hospital-identity-service-v2 node --version

# Check environment variables
docker exec hospital-identity-service-v2 env
```

---

## 🐛 Troubleshooting

### 1. Container Exit Immediately

**Symptom**: Container starts and exits with code 1

```bash
# Check logs
docker logs hospital-identity-service-v2

# Common causes:
# - Missing environment variables
# - Database connection failed
# - Port already in use
```

**Solution**:
```bash
# Verify .env file exists and is configured
cat backend/services-v2/.env

# Check port availability
netstat -ano | findstr :3021  # Windows
lsof -i :3021                  # macOS/Linux
```

### 2. RabbitMQ Connection Error

**Symptom**: "connect ECONNREFUSED" or "PRECONDITION_FAILED"

```bash
# Error in logs:
# Error: connect ECONNREFUSED 172.19.0.3:5672
# PRECONDITION_FAILED - inequivalent arg 'type' for exchange
```

**Solution**:
```bash
# 1. Stop all services
docker-compose -f docker-compose.v2.yml down

# 2. Remove RabbitMQ volume
docker volume rm services-v2_rabbitmq-v2-data

# 3. Restart infrastructure
docker-compose -f docker-compose.v2.yml --profile infrastructure up -d

# 4. Wait 10 seconds
sleep 10

# 5. Start identity service
docker-compose -f docker-compose.v2.yml up -d identity-service
```

### 3. Supabase Connection Failed

**Symptom**: Database health check fails

**Solution**:
```bash
# Verify Supabase credentials in .env
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test connection manually
curl -H "apikey: YOUR_KEY" \
     https://YOUR_PROJECT.supabase.co/rest/v1/
```

### 4. Port Already in Use

**Symptom**: "address already in use"

**Solution**:
```bash
# Find process using port
netstat -ano | findstr :3021  # Windows
lsof -i :3021                  # macOS/Linux

# Kill process
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                  # macOS/Linux

# Or change port in docker-compose.v2.yml
```

### 5. Build Fails

**Symptom**: npm install errors, TypeScript errors

**Solution**:
```bash
# Clean build
docker-compose -f docker-compose.v2.yml build --no-cache identity-service

# Remove old images
docker image prune -f

# Check disk space
docker system df
```

### 6. Container Unhealthy

**Symptom**: Health check fails, container shows as unhealthy

```bash
# Check health check logs
docker inspect --format='{{json .State.Health}}' hospital-identity-service-v2

# Manual health check
docker exec hospital-identity-service-v2 \
  curl -f http://localhost:3001/health
```

---

## 🔒 Security Best Practices

### 1. Non-Root User

Container runs as non-root user `identity:1001` for security.

### 2. Environment Variables

```bash
# Never commit .env files
echo ".env" >> .gitignore

# Use secrets management for production
# - AWS Secrets Manager
# - HashiCorp Vault
# - Docker Secrets
```

### 3. Network Isolation

Services communicate via internal Docker network, not exposed to host.

### 4. Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3
```

---

## 📈 Production Considerations

### 1. Resource Limits

Add to `docker-compose.v2.yml`:

```yaml
identity-service:
  deploy:
    resources:
      limits:
        cpus: '1.0'
        memory: 1G
      reservations:
        cpus: '0.5'
        memory: 512M
```

### 2. Restart Policy

```yaml
identity-service:
  restart: unless-stopped
```

### 3. Logging Driver

```yaml
identity-service:
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

### 4. Monitoring

- Prometheus metrics: http://localhost:3021/metrics
- Health checks: http://localhost:3021/health
- RabbitMQ UI: http://localhost:15673

### 5. Backup

```bash
# Backup Redis data
docker exec hospital-redis-v2 redis-cli SAVE
docker cp hospital-redis-v2:/data/dump.rdb ./backup/

# Backup RabbitMQ data
docker exec hospital-rabbitmq-v2 rabbitmqctl export_definitions /tmp/definitions.json
docker cp hospital-rabbitmq-v2:/tmp/definitions.json ./backup/
```

---

## 📚 Tài Liệu Tham Khảo

### Internal Docs

- [README.md](./README.md) - Project overview
- [AGENTS.md](../../AGENTS.md) - Development guide
- [PORT-MAPPING.md](./PORT-MAPPING.md) - Port configuration
- [identity-service/README.md](./identity-service/README.md) - Service details

### External Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Health Checks](https://docs.docker.com/engine/reference/builder/#healthcheck)

---

## 🆘 Support

### Common Commands Cheat Sheet

```bash
# Quick restart
./scripts/docker-identity.sh restart

# View logs
./scripts/docker-identity.sh logs

# Health check
./scripts/docker-identity.sh health

# Clean up everything
./scripts/docker-identity.sh clean

# Full rebuild
./scripts/docker-identity.sh rebuild
```

### Getting Help

```bash
# Script help
./scripts/docker-identity.sh help

# Docker Compose help
docker-compose --help

# Service logs for debugging
docker-compose -f docker-compose.v2.yml logs -f identity-service
```

---

## 📝 Notes

- **Build Time**: ~2-3 phút cho lần đầu
- **Startup Time**: ~10-15 giây
- **Memory Usage**: ~200-400MB khi idle
- **Port Mapping**: 3021 (host) -> 3001 (container)

---

**Version**: 2.0.0  
**Last Updated**: 2025-11-03  
**Maintainer**: Hospital Management Team

🏥 **Happy Building!**