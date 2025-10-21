# Prometheus Monitoring Setup for Scheduler Service

> **Complete guide for setting up Prometheus monitoring for the Scheduler Service**

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Usage](#usage)
- [Metrics Reference](#metrics-reference)
- [Alerts Reference](#alerts-reference)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)

---

## 🎯 Overview

This monitoring setup provides:

- **Prometheus** - Metrics collection and alerting
- **20+ Metrics** - Worker, API, database, and business metrics
- **15+ Alert Rules** - Critical and warning alerts
- **Docker Compose** - Easy deployment
- **Setup Scripts** - Automated setup for Linux/macOS and Windows

### Architecture

```
┌─────────────────────┐
│ Scheduler Service   │
│   Port: 3025        │
│   /metrics endpoint │
└──────────┬──────────┘
           │
           │ HTTP Scrape (15s interval)
           │
           ▼
┌─────────────────────┐
│   Prometheus        │
│   Port: 9090        │
│   - Metrics Storage │
│   - Alert Evaluation│
└─────────────────────┘
```

---

## ✅ Prerequisites

### Required

- **Docker** >= 20.10.0
- **Docker Compose** >= 2.0.0
- **Scheduler Service** running on port 3025

### Optional

- **promtool** - For configuration validation
- **Node Exporter** - For system metrics
- **Postgres Exporter** - For database metrics

### Installation

**Docker Desktop** (Windows/macOS):
- Download from https://www.docker.com/products/docker-desktop

**Docker Engine** (Linux):
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

**promtool** (Optional):
```bash
# macOS
brew install prometheus

# Linux
wget https://github.com/prometheus/prometheus/releases/download/v2.48.0/prometheus-2.48.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
sudo cp prometheus-*/promtool /usr/local/bin/
```

---

## 🚀 Quick Start

### Linux/macOS

```bash
# 1. Navigate to monitoring directory
cd backend/services-v2/scheduler-service/monitoring

# 2. Make script executable
chmod +x prometheus-setup.sh

# 3. Start Prometheus
./prometheus-setup.sh start

# 4. Check status
./prometheus-setup.sh status

# 5. Open Prometheus UI
# http://localhost:9090
```

### Windows (PowerShell)

```powershell
# 1. Navigate to monitoring directory
cd backend\services-v2\scheduler-service\monitoring

# 2. Start Prometheus
.\prometheus-setup.ps1 start

# 3. Check status
.\prometheus-setup.ps1 status

# 4. Open Prometheus UI
# http://localhost:9090
```

### Manual Start (Docker Compose)

```bash
cd backend/services-v2/scheduler-service/monitoring
docker-compose -f docker-compose.prometheus.yml up -d
```

---

## ⚙️ Configuration

### Prometheus Configuration

**File**: `prometheus/prometheus.yml`

Key settings:
- **Scrape Interval**: 15 seconds
- **Scrape Timeout**: 10 seconds
- **Evaluation Interval**: 15 seconds
- **Retention**: 30 days

### Alert Rules

**File**: `prometheus/alerts.yml`

Alert groups:
1. **Service Availability** - Service down, high error rate
2. **Performance** - High latency, slow operations
3. **Worker Health** - Worker errors, stuck runs
4. **Database** - Database errors, slow queries
5. **Business Logic** - Pending runs, failure rate
6. **Cleanup Worker** - Cleanup operations

### Customization

Edit `prometheus/prometheus.yml` to:
- Change scrape interval
- Add new targets
- Configure remote storage
- Enable additional exporters

Edit `prometheus/alerts.yml` to:
- Adjust alert thresholds
- Add new alert rules
- Change severity levels
- Customize annotations

---

## 📖 Usage

### Setup Scripts

**Linux/macOS** (`prometheus-setup.sh`):
```bash
./prometheus-setup.sh start      # Start Prometheus
./prometheus-setup.sh stop       # Stop Prometheus
./prometheus-setup.sh restart    # Restart Prometheus
./prometheus-setup.sh status     # Show status
./prometheus-setup.sh logs       # Show logs (follow mode)
./prometheus-setup.sh reload     # Reload configuration
./prometheus-setup.sh validate   # Validate configuration
./prometheus-setup.sh cleanup    # Remove all data
./prometheus-setup.sh help       # Show help
```

**Windows** (`prometheus-setup.ps1`):
```powershell
.\prometheus-setup.ps1 start      # Start Prometheus
.\prometheus-setup.ps1 stop       # Stop Prometheus
.\prometheus-setup.ps1 restart    # Restart Prometheus
.\prometheus-setup.ps1 status     # Show status
.\prometheus-setup.ps1 logs       # Show logs (follow mode)
.\prometheus-setup.ps1 reload     # Reload configuration
.\prometheus-setup.ps1 validate   # Validate configuration
.\prometheus-setup.ps1 cleanup    # Remove all data
.\prometheus-setup.ps1 help       # Show help
```

### Prometheus UI

**Access**: http://localhost:9090

**Key Pages**:
- **Graph** - Query and visualize metrics
- **Targets** - View scrape targets and health
- **Alerts** - View active and pending alerts
- **Status** - Configuration and runtime info

### Example Queries

**Worker Performance**:
```promql
# Worker poll latency (P95)
histogram_quantile(0.95, 
  sum(rate(scheduler_worker_poll_duration_seconds_bucket[5m])) by (le, worker_id)
)

# Runs executed per second
rate(scheduler_worker_runs_executed_total[5m])

# Active runs
scheduler_worker_active_runs
```

**API Performance**:
```promql
# API request rate
rate(scheduler_api_request_total[5m])

# API latency (P95)
histogram_quantile(0.95,
  sum(rate(scheduler_api_request_duration_seconds_bucket[5m])) by (le, route)
)

# API error rate
rate(scheduler_api_request_total{status_code=~"5.."}[5m])
```

**Business Metrics**:
```promql
# Active schedules
scheduler_schedules_active_total

# Pending runs
scheduler_runs_pending_total

# Run completion rate
rate(scheduler_runs_completed_total[5m])
```

---

## 📊 Metrics Reference

See [../docs/OBSERVABILITY.md](../docs/OBSERVABILITY.md#metrics-reference) for complete metrics reference.

**Quick Summary**:
- **8 Worker Metrics** - Poll duration, runs executed, active runs, etc.
- **3 API Metrics** - Request duration, request total, errors
- **4 Database Metrics** - Query duration, query total, errors, pool
- **5 Business Metrics** - Active schedules, pending runs, completed runs, etc.

---

## 📊 Grafana Dashboards

### Pre-configured Dashboards

**All dashboards auto-load when starting with Docker Compose!**

#### 1. Scheduler Service - Overview
**Location**: Dashboards → Scheduler Service → Scheduler Service - Overview

**Panels** (3):
- **Active Schedules** (Stat) - Current number of active schedules
- **Pending Runs** (Stat) - Current pending runs with thresholds
- **API Request Rate** (Time Series) - Requests per second by method and route

**Use Case**: Quick health check, overall system status

#### 2. Worker Performance
**Location**: Dashboards → Scheduler Service → Worker Performance

**Panels** (4):
- **Worker Poll Latency (P50, P95, P99)** - Worker poll duration percentiles
- **Runs Executed per Second** - Execution rate by worker and status
- **Active Runs (All Workers)** - Total active runs with thresholds
- **Worker Success Rate** - Percentage of successful runs

**Use Case**: Monitor worker performance, identify slow workers

#### 3. Database Metrics
**Location**: Dashboards → Scheduler Service → Database Metrics

**Panels** (5):
- **Database Query Latency (P50, P95, P99)** - Query duration percentiles
- **Database Query Rate** - Queries per second by operation
- **Database Error Rate** - Percentage of failed queries
- **Active Database Connections** - Current active connections
- **Database Errors per Second** - Error rate by operation

**Use Case**: Monitor database performance, identify slow queries

#### 4. Business Metrics
**Location**: Dashboards → Scheduler Service → Business Metrics

**Panels** (7):
- **Active Schedules** - Current active schedules
- **Pending Runs** - Current pending runs
- **Completed Runs (Last Hour)** - Total completed
- **Run Success Rate** - Success percentage
- **Failed Runs (Last Hour)** - Total failures
- **Run Outcomes per Second** - Completed/failed/cancelled
- **Schedules & Pending Runs Over Time** - Trend analysis

**Use Case**: Business KPIs, SLA monitoring, capacity planning

### Accessing Dashboards

1. Open http://localhost:3001
2. Login: admin/admin
3. Navigate to "Dashboards" → "Scheduler Service"
4. Select desired dashboard

**Dashboard Features**:
- ✅ Auto-refresh every 10 seconds
- ✅ Time range: Last 1 hour (configurable)
- ✅ Dark theme
- ✅ Export to PNG/PDF
- ✅ Share via link

---

## 🚨 Alerts Reference

See [prometheus/alerts.yml](prometheus/alerts.yml) for complete alert rules.

**Critical Alerts**:
- `SchedulerServiceDown` - Service is down for >1 minute
- `HighAPILatencyP99` - API P99 latency >2 seconds
- `HighWorkerErrorRate` - Worker error rate >10%
- `HighDatabaseErrorRate` - Database error rate >5%
- `HighRunFailureRate` - Run failure rate >20%

**Warning Alerts**:
- `HighAPIErrorRate` - API error rate >5%
- `HighAPILatencyP95` - API P95 latency >1 second
- `SlowWorkerPoll` - Worker poll P95 >5 seconds
- `WorkerNotProcessingRuns` - Worker idle for >15 minutes
- `TooManyPendingRuns` - >10,000 pending runs

---

## 🔧 Troubleshooting

### Prometheus Won't Start

**Check Docker**:
```bash
docker info
```

**Check Logs**:
```bash
docker logs scheduler-prometheus
```

**Common Issues**:
- Port 9090 already in use
- Configuration file syntax error
- Docker not running

### Metrics Not Showing

**Check Target Health**:
- Open http://localhost:9090/targets
- Verify scheduler-service-api target is UP
- Check "Last Scrape" timestamp

**Check Scheduler Service**:
```bash
# Test metrics endpoint
curl http://localhost:3025/metrics

# Should return Prometheus-formatted metrics
```

**Check Network**:
```bash
# Verify Prometheus can reach scheduler service
docker exec scheduler-prometheus wget -O- http://host.docker.internal:3025/metrics
```

### Alerts Not Firing

**Check Alert Rules**:
- Open http://localhost:9090/alerts
- Verify rules are loaded
- Check evaluation time

**Validate Rules**:
```bash
promtool check rules prometheus/alerts.yml
```

**Check Metrics**:
- Verify metrics exist in Prometheus
- Test alert expression in Graph page

---

## 🔬 Advanced Configuration

### Add Alertmanager

Uncomment in `docker-compose.prometheus.yml`:
```yaml
alertmanager:
  image: prom/alertmanager:v0.26.0
  # ... configuration
```

Create `alertmanager/alertmanager.yml`:
```yaml
route:
  receiver: 'email'
  
receivers:
  - name: 'email'
    email_configs:
      - to: 'alerts@hospital-management.com'
        from: 'prometheus@hospital-management.com'
        smarthost: 'smtp.gmail.com:587'
```

### Add Node Exporter

Uncomment in `docker-compose.prometheus.yml`:
```yaml
node-exporter:
  image: prom/node-exporter:v1.7.0
  # ... configuration
```

### Remote Storage

Add to `prometheus/prometheus.yml`:
```yaml
remote_write:
  - url: 'http://cortex:9009/api/v1/push'
```

### Federation

Add to `prometheus/prometheus.yml`:
```yaml
scrape_configs:
  - job_name: 'federate'
    scrape_interval: 15s
    honor_labels: true
    metrics_path: '/federate'
    params:
      'match[]':
        - '{job="scheduler-service-api"}'
    static_configs:
      - targets:
        - 'prometheus-central:9090'
```

---

## 📚 Additional Resources

- **Prometheus Documentation**: https://prometheus.io/docs/
- **PromQL Guide**: https://prometheus.io/docs/prometheus/latest/querying/basics/
- **Alert Rules**: https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/
- **Observability Guide**: [../docs/OBSERVABILITY.md](../docs/OBSERVABILITY.md)

---

**Last Updated**: 2025-10-21
**Version**: 1.0.0
**Maintained By**: Hospital Management System V2 Team

