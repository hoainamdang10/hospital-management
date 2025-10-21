# 🐳 Scheduler Service - Docker Deployment Guide

## 📋 Tổng Quan

Scheduler Service được containerized với Docker và hỗ trợ 4 deployment modes:
- **API Server** (Control-Plane) - REST API endpoint
- **Materializer Worker** (Data-Plane) - Tính toán next occurrences
- **Execution Workers** (Data-Plane) - Thực thi scheduled runs
- **Outbox Publisher** (Data-Plane) - Publish events to RabbitMQ

## 🏗️ Kiến Trúc Docker

### Multi-Stage Build

Dockerfile sử dụng 3 stages để tối ưu image size và security:

1. **Dependencies Stage** - Install tất cả dependencies
2. **Build Stage** - Compile TypeScript → JavaScript
3. **Production Stage** - Chỉ chứa production dependencies + compiled code

**Kết quả**: Image size nhỏ, không chứa dev dependencies, source code TypeScript.

### Docker Compose Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Scheduler Service Stack                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  scheduler-api (Port 3030)          - Control-Plane          │
│  scheduler-materializer             - Data-Plane             │
│  scheduler-worker-0 (Segment 0)     - Data-Plane             │
│  scheduler-worker-1 (Segment 1)     - Data-Plane             │
│  scheduler-worker-2 (Segment 2)     - Data-Plane             │
│  scheduler-publisher                - Data-Plane             │
│                                                               │
│  rabbitmq-v2 (Ports 5673, 15673)    - Infrastructure         │
│  redis-v2 (Port 6380)               - Infrastructure         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

1. **Docker Desktop** - Phải đang chạy
2. **Environment Variables** - Tạo file `.env` trong thư mục `scheduler-service/`

### Bước 1: Tạo Environment File

Tạo file `.env`:

```bash
# Database (Supabase)
SUPABASE_URL=https://ciasxktujslgsdgylimv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here

# Authentication
JWT_SECRET=your_jwt_secret_for_service_auth
```

⚠️ **QUAN TRỌNG**: Thay thế các giá trị `your_*` bằng credentials thực tế từ Supabase.

### Bước 2: Build Docker Image

```bash
# Build image
docker build -t scheduler-service .

# Hoặc build với tag cụ thể
docker build -t scheduler-service:1.0.0 .
```

### Bước 3: Start Services

```bash
# Start tất cả services
docker-compose up -d

# Hoặc start với build
docker-compose up -d --build

# Xem logs
docker-compose logs -f

# Xem logs của service cụ thể
docker-compose logs -f scheduler-api
docker-compose logs -f scheduler-worker-0
```

### Bước 4: Verify Health

```bash
# Check API health
curl http://localhost:3030/api/v1/health

# Expected response:
# {
#   "status": "healthy",
#   "service": "scheduler-service",
#   "version": "1.0.0",
#   "timestamp": "2025-01-20T10:00:00.000Z"
# }

# Check RabbitMQ Management UI
# Open browser: http://localhost:15673
# Login: admin / admin

# Check Redis
docker exec -it redis-v2 redis-cli ping
# Expected: PONG
```

## 📦 Docker Commands

### Build & Run

```bash
# Build image
docker build -t scheduler-service .

# Run API server only
docker run -d \
  --name scheduler-api \
  -p 3030:3030 \
  --env-file .env \
  scheduler-service

# Run materializer worker
docker run -d \
  --name scheduler-materializer \
  --env-file .env \
  scheduler-service node dist/materializer.js

# Run execution worker (segment 0)
docker run -d \
  --name scheduler-worker-0 \
  --env-file .env \
  -e WORKER_SEGMENT=0 \
  scheduler-service node dist/worker.js

# Run outbox publisher
docker run -d \
  --name scheduler-publisher \
  --env-file .env \
  scheduler-service node dist/publisher.js
```

### Docker Compose Commands

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d scheduler-api

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Restart service
docker-compose restart scheduler-api

# View logs
docker-compose logs -f scheduler-api

# Scale workers (add more execution workers)
docker-compose up -d --scale scheduler-worker-0=5

# Rebuild and restart
docker-compose up -d --build
```

### Debugging

```bash
# Enter container shell
docker exec -it scheduler-api sh

# Check container logs
docker logs scheduler-api

# Check container stats
docker stats scheduler-api

# Inspect container
docker inspect scheduler-api

# Check network
docker network inspect scheduler-service_hospital-network
```

## 🔧 Configuration

### Environment Variables

Tất cả environment variables được định nghĩa trong `docker-compose.yml`. Các biến quan trọng:

**API Server**:
- `PORT=3030` - API port
- `SUPABASE_URL` - Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- `JWT_SECRET` - JWT secret for auth
- `RABBITMQ_URL` - RabbitMQ connection string
- `REDIS_URL` - Redis connection string

**Materializer Worker**:
- `MATERIALIZER_INTERVAL=60000` - Materialization interval (60s)
- `MATERIALIZER_LOOKAHEAD_HOURS=48` - Lookahead window (48h)
- `MATERIALIZER_BATCH_SIZE=100` - Batch size

**Execution Workers**:
- `WORKER_CONCURRENCY=10` - Max concurrent runs
- `WORKER_POLL_INTERVAL=5000` - Poll interval (5s)
- `WORKER_SEGMENT=0` - Segment assignment (0-9)

**Outbox Publisher**:
- `PUBLISHER_INTERVAL=1000` - Publish interval (1s)
- `PUBLISHER_BATCH_SIZE=100` - Batch size
- `PUBLISHER_MAX_RETRIES=3` - Max retry attempts

### Scaling Workers

Để scale execution workers, thêm services mới trong `docker-compose.yml`:

```yaml
scheduler-worker-3:
  # ... copy từ scheduler-worker-0
  environment:
    WORKER_SEGMENT: 3  # Segment 3
```

Hoặc sử dụng `docker-compose scale`:

```bash
docker-compose up -d --scale scheduler-worker-0=10
```

## 🔍 Monitoring

### Health Checks

Tất cả services có health checks:

```bash
# Check API health
docker-compose ps

# Expected output:
# NAME                    STATUS
# scheduler-api           Up (healthy)
# scheduler-materializer  Up
# scheduler-worker-0      Up
# rabbitmq-v2             Up (healthy)
# redis-v2                Up (healthy)
```

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f scheduler-api
docker-compose logs -f scheduler-worker-0

# View last 100 lines
docker-compose logs --tail=100 scheduler-api

# View logs since timestamp
docker-compose logs --since 2025-01-20T10:00:00 scheduler-api
```

### Metrics

RabbitMQ Management UI: http://localhost:15673
- Username: `admin`
- Password: `admin`

## 🛑 Shutdown

```bash
# Graceful shutdown (wait for running tasks)
docker-compose down

# Force shutdown
docker-compose down --timeout 0

# Remove volumes (⚠️ DATA LOSS)
docker-compose down -v
```

## 🔒 Security Best Practices

1. **Non-root User**: Container chạy với user `nodejs` (UID 1001)
2. **Minimal Image**: Sử dụng `node:18-alpine` (nhỏ, ít vulnerabilities)
3. **No Secrets in Image**: Secrets được inject qua environment variables
4. **Read-only Filesystem**: Có thể enable với `read_only: true` trong compose
5. **Resource Limits**: Nên thêm memory/CPU limits trong production

## 📝 Troubleshooting

### Issue: Container không start

```bash
# Check logs
docker-compose logs scheduler-api

# Common issues:
# 1. Missing environment variables
# 2. Supabase credentials invalid
# 3. RabbitMQ/Redis not ready
```

### Issue: Cannot connect to RabbitMQ

```bash
# Check RabbitMQ health
docker-compose ps rabbitmq-v2

# Check RabbitMQ logs
docker-compose logs rabbitmq-v2

# Restart RabbitMQ
docker-compose restart rabbitmq-v2
```

### Issue: High memory usage

```bash
# Check memory usage
docker stats

# Add memory limits in docker-compose.yml:
services:
  scheduler-api:
    deploy:
      resources:
        limits:
          memory: 512M
```

## 🚀 Production Deployment

### Recommendations

1. **Use Docker Swarm or Kubernetes** cho orchestration
2. **Enable Resource Limits**:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1'
         memory: 512M
       reservations:
         cpus: '0.5'
         memory: 256M
   ```
3. **Use External RabbitMQ/Redis** (không chạy trong Docker Compose)
4. **Enable Logging Driver**:
   ```yaml
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   ```
5. **Use Docker Secrets** thay vì environment variables

### Example Production Compose

```yaml
version: '3.8'

services:
  scheduler-api:
    image: your-registry/scheduler-service:1.0.0
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 512M
    secrets:
      - supabase_key
      - jwt_secret
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

secrets:
  supabase_key:
    external: true
  jwt_secret:
    external: true
```

---

**Last Updated**: 2025-01-20
**Version**: 1.0.0
**Maintained By**: Hospital Management System V2 Team

