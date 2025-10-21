# Scheduler Platform

**Version**: 1.0.0  
**Status**: 🚧 In Development  
**Architecture**: Control-Plane / Data-Plane  
**Pattern**: Transactional Outbox + Multi-tenant

---

## 📋 OVERVIEW

Scheduler Platform là infrastructure service độc lập, "mù domain", cung cấp time-driven scheduling cho toàn bộ Hospital Management System.

### Key Features

- ✅ **Multi-tenant** - Isolated scheduling per tenant
- ✅ **Flexible Scheduling** - ONCE, CRON, RRULE (RFC 5545)
- ✅ **Transactional Outbox** - Reliable messaging
- ✅ **Idempotency** - Deduplication + Inbox pattern
- ✅ **Distributed** - Horizontal scaling với segment partitioning
- ✅ **Observable** - Metrics, tracing, SLO

---

## 🏗️ ARCHITECTURE

### Control-Plane / Data-Plane

```
[Domain Services: Appointments, Billing, Notifications...]
        |  (HTTP/gRPC - JWT ngắn hạn)
        v
        ┌───────────────────────────────┐
        │      SCHEDULER PLATFORM      │
        │  (Service độc lập, multi-tenant)
        ├───────────────┬──────────────┤
        │  Control-Plane│  Data-Plane  │
        │  (API)        │              │
        │  - create/    │- materializer│
        │    update     │- worker      │
        │  - cancel     │- publisher   │
        │  - backfill   │- cleaner     │
        └───────┬───────┴───────┬──────┘
                |               |
           [DB: scheduler]  [RabbitMQ]
```

### Components

**Control-Plane (API)**:
- REST API cho schedule management
- Authentication & authorization
- Rate limiting & quota management

**Data-Plane**:
- **Materializer**: Tính next occurrence, tạo schedule_runs
- **Worker**: Poll due runs, acquire lease, execute
- **Publisher**: Publish outbox to message bus
- **Cleaner**: Cleanup old data, expired leases

---

## 🚀 QUICK START

### 1. Prerequisites

```bash
# Required
Node.js >= 18.0.0
PostgreSQL (Supabase)
RabbitMQ
Redis

# Check versions
node --version
npm --version
```

### 2. Installation

```bash
# Install dependencies
cd backend/services-v2/scheduler-service
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials
```

### 3. Database Setup

```bash
# Run migration on Supabase
# Option 1: Supabase Dashboard
# - Go to SQL Editor
# - Copy content from migrations/001_create_scheduler_schema.sql
# - Execute

# Option 2: psql
psql -h db.ciasxktujslgsdgylimv.supabase.co \
     -U postgres \
     -d postgres \
     -f migrations/001_create_scheduler_schema.sql
```

### 4. Development

```bash
# Start API (Control-Plane)
npm run dev

# Or start specific component
COMPONENT=api npm run dev
COMPONENT=materializer npm run dev
COMPONENT=worker npm run dev
COMPONENT=publisher npm run dev
```

### 5. Production (Docker Compose)

```bash
# Start all services (Scheduler + Prometheus + Grafana)
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f scheduler-api

# Stop all services
docker-compose down
```

**Services Started**:
- Scheduler API (Port 3030)
- Materializer Worker
- Execution Workers (3 instances)
- Outbox Publisher
- Prometheus (Port 9090)
- Grafana (Port 3001)
- RabbitMQ (Port 5673, Management: 15673)
- Redis (Port 6380)

**Access UIs**:
- Scheduler API: http://localhost:3030/api/v1/health
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)
- RabbitMQ Management: http://localhost:15673 (admin/admin)

---

## 📊 MONITORING & OBSERVABILITY

### Quick Start

**Start with Docker Compose** (includes Prometheus + Grafana):
```bash
docker-compose up -d
```

**Access Monitoring**:
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **Metrics Endpoint**: http://localhost:3030/metrics

### Metrics

**22+ Prometheus Metrics**:
- Worker metrics (poll duration, runs executed, active runs)
- API metrics (request rate, latency, errors)
- Database metrics (query duration, errors)
- Business metrics (active schedules, pending runs, completed runs)
- **Messaging metrics** ⭐ NEW:
  - `scheduler_unroutable_messages_total` - Unroutable messages by routing_key and exchange
  - `scheduler_unroutable_messages_by_exchange_total` - Unroutable messages by exchange

**Example Queries**:
```promql
# Worker poll latency (P95)
histogram_quantile(0.95,
  sum(rate(scheduler_worker_poll_duration_seconds_bucket[5m])) by (le, worker_id)
)

# API request rate
rate(scheduler_api_request_total[5m])

# Pending runs
scheduler_runs_pending_total
```

### Alerts

**18+ Alert Rules**:
- Service down
- High error rate
- High latency
- Worker not processing
- Too many pending runs
- **Unroutable messages alerts** ⭐ NEW:
  - `UnroutableMessagesDetected` - Any unroutable messages detected (Warning)
  - `HighUnroutableMessageRate` - Rate > 1 msg/s (Critical)
  - `TooManyUnroutableMessages` - Total > 100 (Critical)

**View Alerts**: http://localhost:9090/alerts

### Grafana Dashboards

**5 Pre-configured Dashboards** (auto-load with Docker Compose):

1. **Scheduler Service - Overview**
   - Active schedules
   - Pending runs
   - API request rate

2. **Worker Performance**
   - Worker poll latency (P50, P95, P99)
   - Runs executed per second
   - Active runs
   - Worker success rate

3. **Database Metrics**
   - Database query latency (P50, P95, P99)
   - Database query rate
   - Database error rate
   - Active database connections
   - Database errors per second

4. **Business Metrics**
   - Active schedules
   - Pending runs
   - Completed runs (last hour)
   - Run success rate
   - Failed runs (last hour)
   - Run outcomes per second
   - Schedules & pending runs over time

5. **Unroutable Messages** ⭐ NEW
   - Unroutable messages rate (per second)
   - Total unroutable messages (gauge)
   - Unroutable messages by exchange (pie chart)
   - Unroutable messages by routing key (bar chart)

**Access**: http://localhost:3001 → Dashboards → Scheduler Service

**Features**:
- Auto-refresh every 10 seconds
- Time range: Last 1 hour (configurable)
- Export to PNG/PDF
- Share via link

### Documentation

- **Quick Start**: [monitoring/QUICK_START.md](monitoring/QUICK_START.md)
- **Complete Guide**: [monitoring/README.md](monitoring/README.md)
- **Observability Guide**: [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md)

---

## 📊 API REFERENCE

### Base URL
```
http://localhost:3030
```

### Authentication
```http
Authorization: Bearer <JWT_TOKEN>
```

### Endpoints

#### 1. Create or Update Schedule (Idempotent)

```http
POST /schedules:createOrUpdateByDedup
Content-Type: application/json

{
  "tenantId": "hospital-1",
  "ownerService": "appointments",
  "ownerResourceType": "appointment",
  "ownerResourceId": "apt_123",
  "policyTag": "reminder-24h",
  "scheduleType": "ONCE",
  "timezone": "Asia/Ho_Chi_Minh",
  "startAtUtc": "2025-10-22T02:00:00Z",
  "topicOrCommand": "Command.Appointment.SendReminder",
  "payloadJson": {
    "appointmentId": "apt_123",
    "patientId": "pat_9",
    "lang": "vi"
  },
  "dedupKey": "apt:apt_123:reminder-24h"
}
```

**Response**:
```json
{
  "schedule_id": "uuid",
  "status": "ACTIVE",
  "next_run_at": "2025-10-22T02:00:00Z"
}
```

#### 2. Cancel Schedule by Owner

```http
POST /schedules:cancelByOwner
Content-Type: application/json

{
  "tenantId": "hospital-1",
  "ownerService": "appointments",
  "ownerResourceType": "appointment",
  "ownerResourceId": "apt_123",
  "policyTag": "reminder-24h"  // optional
}
```

#### 3. Run Now (Manual Trigger)

```http
POST /schedules:runNow
Content-Type: application/json

{
  "scheduleId": "uuid"
}
```

#### 4. Backfill

```http
POST /schedules:backfill
Content-Type: application/json

{
  "scheduleId": "uuid",
  "fromUtc": "2025-10-20T00:00:00Z",
  "toUtc": "2025-10-22T00:00:00Z"
}
```

#### 5. Get Schedule

```http
GET /schedules/:id
```

#### 6. Get Schedule Runs

```http
GET /schedules/:id/runs?limit=100&offset=0
```

---

## 🔌 SDK USAGE

### Installation

```bash
npm install @hospital/scheduler-client
```

### Example (Appointments Service)

```typescript
import { SchedulerClient } from '@hospital/scheduler-client';

const schedulerClient = new SchedulerClient({
  baseUrl: 'http://scheduler-service:3030',
  authProvider: async () => {
    // Get JWT from Identity Service
    return await getServiceToken();
  }
});

// Create reminder schedule
await schedulerClient.createOrUpdateByDedup({
  tenantId: 'hospital-1',
  ownerService: 'appointments',
  ownerResourceType: 'appointment',
  ownerResourceId: appointment.id,
  policyTag: 'reminder-24h',
  scheduleType: 'ONCE',
  timezone: 'Asia/Ho_Chi_Minh',
  startAtUtc: subHours(appointment.date, 24).toISOString(),
  topicOrCommand: 'Command.Appointment.SendReminder',
  payloadJson: {
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    language: 'vi'
  },
  dedupKey: `apt:${appointment.id}:reminder-24h`
});
```

---

## 📦 MESSAGE BUS CONTRACT

### Headers (Required)

```json
{
  "correlation_id": "uuid",
  "causation_id": "schedule_id",
  "schedule_id": "uuid",
  "run_id": "uuid",
  "tenant_id": "hospital-1",
  "idempotency_key": "sched:<schedule_id>:<run_id>",
  "emitted_at": "2025-10-21T17:20:00Z"
}
```

### Payload

```json
{
  // Custom payload from schedule.payload_json
  "appointmentId": "apt_123",
  "patientId": "pat_9",
  "lang": "vi"
}
```

### Consumer Implementation (Inbox Pattern)

```typescript
// Notifications Service
async handleSendReminderCommand(command: SchedulerCommand) {
  // 1. Check idempotency
  if (await this.inbox.isProcessed(command.headers.idempotency_key)) {
    return; // Already processed
  }
  
  // 2. Process command
  await this.notificationService.sendNotification({
    recipientId: command.payload.patientId,
    templateId: 'appointment-reminder',
    channels: ['SMS', 'PUSH'],
    data: command.payload
  });
  
  // 3. Mark as processed
  await this.inbox.markProcessed(command.headers.idempotency_key);
}
```

---

## 🔧 CONFIGURATION

### Environment Variables

See `.env.example` for full list.

**Critical Variables**:
- `SUPABASE_URL` - Database connection
- `RABBITMQ_URL` - Message bus
- `REDIS_URL` - Cache & distributed lock
- `JWT_SECRET` - Service authentication

### Component-Specific

**API**:
- `PORT` - HTTP port (default: 3030)
- `RATE_LIMIT_MAX_REQUESTS` - Rate limit per tenant

**Materializer**:
- `MATERIALIZATION_INTERVAL` - How often to materialize (default: 60s)
- `MATERIALIZATION_LOOKAHEAD_HOURS` - How far ahead (default: 48h)

**Worker**:
- `WORKER_CONCURRENCY` - Max concurrent runs (default: 10)
- `WORKER_POLL_INTERVAL` - Poll frequency (default: 5s)
- `WORKER_LEASE_TTL` - Lease duration (default: 60s)

**Publisher**:
- `PUBLISH_BATCH_SIZE` - Batch size (default: 100)
- `PUBLISH_INTERVAL` - Publish frequency (default: 1s)

---

## 📊 OBSERVABILITY

### Metrics (Prometheus)

```
# Queue lag
scheduler_queue_lag_seconds{tenant_id, owner_service}

# Run counts
scheduler_runs_total{status, tenant_id, owner_service}

# Publish latency
scheduler_outbox_publish_latency_seconds

# Misfires
scheduler_misfires_total{tenant_id, owner_service, reason}
```

### Metrics Endpoint

```http
GET http://localhost:9090/metrics
```

### Grafana Dashboard

Import dashboard from `docs/grafana-dashboard.json`

### SLO

**Target**: 99% commands emit ≤ 5-10s sau due_at

**Alert**:
```yaml
- alert: SchedulerSLOViolation
  expr: |
    (
      sum(rate(scheduler_runs_total{status="SUCCEEDED"}[5m]))
      /
      sum(rate(scheduler_runs_total[5m]))
    ) < 0.99
  for: 5m
```

---

## 🐳 DOCKER DEPLOYMENT

### Docker Compose

```yaml
# docker-compose.scheduler.yml
services:
  scheduler-api:
    build: .
    command: npm run start:api
    ports: ["3030:3030"]
    environment:
      - COMPONENT=api
    deploy:
      replicas: 2
  
  scheduler-materializer:
    build: .
    command: npm run start:materializer
    environment:
      - COMPONENT=materializer
    deploy:
      replicas: 1
  
  scheduler-worker:
    build: .
    command: npm run start:worker
    environment:
      - COMPONENT=worker
      - WORKER_CONCURRENCY=10
    deploy:
      replicas: 3
  
  scheduler-publisher:
    build: .
    command: npm run start:publisher
    environment:
      - COMPONENT=publisher
    deploy:
      replicas: 2
```

### Kubernetes

See `k8s/` directory for manifests.

---

## 🧪 TESTING

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Contract tests (SDK)
cd sdk
npm test
```

---

## 📚 DOCUMENTATION

- **API Contract**: `docs/API_CONTRACT.md`
- **Database Schema**: `docs/DATABASE_SCHEMA.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Integration Guide**: `docs/INTEGRATION_GUIDE.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING.md`
- **Unroutable Messages Monitoring**: `docs/UNROUTABLE_MESSAGES_MONITORING.md` ⭐ NEW

---

## 🛠️ DEVELOPMENT ROADMAP

### Phase 1: Core (Week 1-2) ✅
- [x] Database schema
- [x] Project structure
- [ ] Domain models (Schedule, ScheduleRun, Outbox)
- [ ] Repositories (Supabase)
- [ ] API endpoints (Control-Plane)

### Phase 2: Data-Plane (Week 3-4)
- [ ] Materializer worker
- [ ] Execution worker
- [ ] Outbox publisher
- [ ] Distributed locking (Redis)

### Phase 3: Advanced (Week 5)
- [ ] Segment partitioning
- [ ] Compensating transactions
- [ ] Backfill optimization
- [ ] Metrics & tracing

### Phase 4: Production (Week 6)
- [ ] Load testing
- [ ] Security hardening
- [ ] Documentation
- [ ] SDK release

---

## 🤝 CONTRIBUTING

See `CONTRIBUTING.md`

---

## 📄 LICENSE

MIT

---

## 👥 TEAM

Hospital Management System V2 Team

---

**Last Updated**: 2025-01-20  
**Version**: 1.0.0-alpha
