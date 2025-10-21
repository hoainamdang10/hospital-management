# Scheduler Service - Observability Guide

## Overview

Scheduler Service implements comprehensive observability with:
- **Prometheus Metrics** - Performance and business metrics
- **Structured Logging** - JSON-formatted logs with correlation IDs
- **Distributed Tracing** - Request flow tracking (planned)

---

## Quick Start

### Prerequisites

- Docker Desktop installed and running
- Scheduler Service running on port 3025

### Start Prometheus (5 Minutes)

**Windows**:
```powershell
cd backend\services-v2\scheduler-service\monitoring
.\prometheus-setup.ps1 start
```

**Linux/macOS**:
```bash
cd backend/services-v2/scheduler-service/monitoring
chmod +x prometheus-setup.sh
./prometheus-setup.sh start
```

**Access Prometheus**:
- Prometheus UI: http://localhost:9090
- Metrics endpoint: http://localhost:3025/metrics
- Targets: http://localhost:9090/targets
- Alerts: http://localhost:9090/alerts

**For detailed setup instructions**, see [monitoring/QUICK_START.md](../monitoring/QUICK_START.md)

---

## Metrics

### Metrics Endpoint

```
GET /metrics
```

Returns Prometheus-formatted metrics for scraping.

**Example**:
```bash
curl http://localhost:3025/metrics
```

---

### Worker Metrics

#### Poll Duration
```
scheduler_worker_poll_duration_seconds{worker_id, segment}
```
**Type**: Histogram
**Description**: Duration of worker poll operations
**Labels**:
- `worker_id` - Worker instance ID
- `segment` - Segment number (or "all")

**Buckets**: 1ms, 5ms, 10ms, 50ms, 100ms, 500ms, 1s, 5s

---

#### Runs Executed
```
scheduler_worker_runs_executed_total{worker_id, status}
```
**Type**: Counter
**Description**: Total number of runs executed by workers
**Labels**:
- `worker_id` - Worker instance ID
- `status` - Run status (succeeded, failed)

---

#### Runs Failed
```
scheduler_worker_runs_failed_total{worker_id, error_type}
```
**Type**: Counter
**Description**: Total number of runs failed
**Labels**:
- `worker_id` - Worker instance ID
- `error_type` - Error type (Error name or "unknown")

---

#### Active Runs
```
scheduler_worker_active_runs{worker_id}
```
**Type**: Gauge
**Description**: Number of currently active runs
**Labels**:
- `worker_id` - Worker instance ID

---

#### Cleanup Operations
```
scheduler_worker_cleanup_operations_total{operation_type}
```
**Type**: Counter
**Description**: Total number of cleanup operations
**Labels**:
- `operation_type` - Type of cleanup (completed_runs, published_outbox, dead_letters)

---

#### Cleanup Duration
```
scheduler_worker_cleanup_duration_seconds{operation_type}
```
**Type**: Histogram
**Description**: Duration of cleanup operations
**Labels**:
- `operation_type` - Type of cleanup

**Buckets**: 100ms, 500ms, 1s, 5s, 10s, 30s, 60s

---

#### Materialization Duration
```
scheduler_worker_materialization_duration_seconds
```
**Type**: Histogram
**Description**: Duration of materialization operations

**Buckets**: 10ms, 50ms, 100ms, 500ms, 1s, 5s

---

#### Materialization Runs
```
scheduler_worker_materialization_runs_total{schedule_type}
```
**Type**: Counter
**Description**: Total number of runs materialized
**Labels**:
- `schedule_type` - Type of schedule (ONCE, CRON, RRULE)

---

### API Metrics

#### Request Duration
```
scheduler_api_request_duration_seconds{method, route, status_code}
```
**Type**: Histogram
**Description**: Duration of API requests
**Labels**:
- `method` - HTTP method (GET, POST, PUT, DELETE)
- `route` - Route path
- `status_code` - HTTP status code

**Buckets**: 1ms, 5ms, 10ms, 50ms, 100ms, 500ms, 1s, 5s

---

#### Request Total
```
scheduler_api_request_total{method, route, status_code}
```
**Type**: Counter
**Description**: Total number of API requests

---

#### Request Errors
```
scheduler_api_request_errors_total{method, route, error_type}
```
**Type**: Counter
**Description**: Total number of API request errors
**Labels**:
- `error_type` - Error type (client_error, server_error, unhandled_error)

---

### Database Metrics

#### Query Duration
```
scheduler_db_query_duration_seconds{operation, table}
```
**Type**: Histogram
**Description**: Duration of database queries
**Labels**:
- `operation` - Database operation (select, insert, update, delete)
- `table` - Table name

**Buckets**: 1ms, 5ms, 10ms, 50ms, 100ms, 500ms, 1s, 5s

---

#### Query Total
```
scheduler_db_query_total{operation, table}
```
**Type**: Counter
**Description**: Total number of database queries

---

#### Query Errors
```
scheduler_db_query_errors_total{operation, table, error_type}
```
**Type**: Counter
**Description**: Total number of database query errors

---

#### Connection Pool Size
```
scheduler_db_connection_pool_size
```
**Type**: Gauge
**Description**: Current database connection pool size

---

### Business Metrics

#### Active Schedules
```
scheduler_schedules_active{tenant_id, schedule_type}
```
**Type**: Gauge
**Description**: Number of active schedules

---

#### Schedules Total
```
scheduler_schedules_total{tenant_id, schedule_type}
```
**Type**: Counter
**Description**: Total number of schedules created

---

#### Pending Runs
```
scheduler_runs_pending{tenant_id}
```
**Type**: Gauge
**Description**: Number of pending runs

---

#### Completed Runs
```
scheduler_runs_completed_total{tenant_id, status}
```
**Type**: Counter
**Description**: Total number of completed runs

---

#### Failed Runs
```
scheduler_runs_failed_total{tenant_id, error_type}
```
**Type**: Counter
**Description**: Total number of failed runs

---

## Logging

### Log Format

**Production**: JSON format
```json
{
  "level": "info",
  "message": "Worker poll completed",
  "timestamp": "2025-01-07T10:00:00.000Z",
  "service": "scheduler-service",
  "environment": "production",
  "version": "1.0.0",
  "correlationId": "uuid-v4",
  "workerId": "worker-abc123",
  "duration": 0.123,
  "runsAcquired": 5,
  "event": "worker.poll.completed"
}
```

**Development**: Human-readable format
```
info: Worker poll completed {"correlationId":"uuid-v4","workerId":"worker-abc123","duration":0.123,"runsAcquired":5}
```

---

### Log Levels

- `error` - Errors and exceptions
- `warn` - Warnings
- `info` - Important events (default)
- `debug` - Detailed debugging information

**Configuration**:
```env
LOG_LEVEL=info  # error, warn, info, debug
```

---

### Correlation IDs

Every API request gets a unique correlation ID:
- Generated automatically by `metricsMiddleware`
- Included in response header: `X-Correlation-ID`
- Included in all logs for that request
- Used to trace request flow across services

---

### Structured Log Events

#### Worker Events
- `worker.poll.completed` - Worker poll cycle completed
- `worker.run.started` - Run execution started
- `worker.run.completed` - Run execution completed
- `worker.run.failed` - Run execution failed

#### API Events
- `api.request.completed` - API request completed
- `api.request.failed` - API request failed

#### Database Events
- `database.query.executed` - Database query executed
- `database.query.failed` - Database query failed

#### Cleanup Events
- `cleanup.operation.completed` - Cleanup operation completed

#### Materialization Events
- `materialization.cycle.completed` - Materialization cycle completed

---

## Prometheus Configuration

### Scrape Config

Add to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'scheduler-service'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:3025']
    metrics_path: '/metrics'
```

---

### Grafana Dashboards

#### Worker Performance Dashboard

**Panels**:
1. **Poll Latency** - `scheduler_worker_poll_duration_seconds`
2. **Runs Executed/sec** - `rate(scheduler_worker_runs_executed_total[1m])`
3. **Active Runs** - `scheduler_worker_active_runs`
4. **Error Rate** - `rate(scheduler_worker_runs_failed_total[1m])`

#### API Performance Dashboard

**Panels**:
1. **Request Rate** - `rate(scheduler_api_request_total[1m])`
2. **Request Latency (p50, p95, p99)** - `histogram_quantile(0.95, scheduler_api_request_duration_seconds)`
3. **Error Rate** - `rate(scheduler_api_request_errors_total[1m])`
4. **Status Code Distribution** - `scheduler_api_request_total` by status_code

#### Business Metrics Dashboard

**Panels**:
1. **Active Schedules** - `scheduler_schedules_active`
2. **Pending Runs** - `scheduler_runs_pending`
3. **Runs Completed/hour** - `rate(scheduler_runs_completed_total[1h])`
4. **Cleanup Operations** - `scheduler_worker_cleanup_operations_total`

---

## Alerting Rules

### Critical Alerts

#### High Error Rate
```yaml
- alert: SchedulerHighErrorRate
  expr: rate(scheduler_worker_runs_failed_total[5m]) > 0.1
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "High error rate in scheduler worker"
    description: "Error rate is {{ $value }} runs/sec"
```

#### Worker Down
```yaml
- alert: SchedulerWorkerDown
  expr: up{job="scheduler-service"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Scheduler worker is down"
```

#### High API Latency
```yaml
- alert: SchedulerHighAPILatency
  expr: histogram_quantile(0.95, scheduler_api_request_duration_seconds) > 1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High API latency (p95 > 1s)"
```

---

## Best Practices

### 1. Use Correlation IDs
Always include correlation IDs in logs for request tracing.

### 2. Monitor Key Metrics
- Worker poll latency
- Runs executed per second
- Error rates
- API latency

### 3. Set Up Alerts
Configure alerts for:
- High error rates
- Worker downtime
- High latency
- Database connection issues

### 4. Log Retention
- **Production**: 30 days
- **Error logs**: 90 days
- **Metrics**: 1 year

### 5. Dashboard Organization
- **Operational Dashboard**: Worker health, API performance
- **Business Dashboard**: Schedules, runs, cleanup
- **Debugging Dashboard**: Detailed logs, traces

---

## Troubleshooting

### High Poll Latency
**Symptom**: `scheduler_worker_poll_duration_seconds` > 1s

**Possible Causes**:
- Database slow queries
- Too many due runs
- Network latency

**Solution**:
- Check database query performance
- Increase worker concurrency
- Add more worker instances

---

### High Error Rate
**Symptom**: `scheduler_worker_runs_failed_total` increasing rapidly

**Possible Causes**:
- External service down
- Invalid payload
- Database connection issues

**Solution**:
- Check error logs for specific error types
- Verify external service health
- Check database connectivity

---

### Memory Leak
**Symptom**: Memory usage increasing over time

**Possible Causes**:
- Unclosed database connections
- Event listeners not removed
- Large payloads in memory

**Solution**:
- Monitor `scheduler_db_connection_pool_size`
- Check for memory leaks in worker code
- Implement connection pooling

---

## Next Steps

1. **Set up Prometheus** - Configure scraping
2. **Create Grafana Dashboards** - Visualize metrics
3. **Configure Alerts** - Set up alerting rules
4. **Implement Distributed Tracing** - Add OpenTelemetry (planned)
5. **Log Aggregation** - Set up ELK/Loki stack (planned)

