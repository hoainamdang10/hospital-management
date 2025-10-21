# Prometheus Quick Start Guide

> **Get Prometheus monitoring up and running in 5 minutes**

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- [ ] **Docker Desktop** installed and **RUNNING**
  - Windows: Check system tray for Docker icon
  - macOS: Check menu bar for Docker icon
  - Linux: Run `docker info` to verify
  
- [ ] **Scheduler Service** running on port 3025
  - Test: `curl http://localhost:3025/health`
  - Should return: `{"status":"healthy"}`

- [ ] **Port 9090** available (not in use)
  - Windows: `netstat -ano | findstr :9090`
  - Linux/macOS: `lsof -i :9090`

---

## 🚀 Quick Start (2 Minutes)

### Method 1: Start Everything with Docker Compose (Recommended)

**Step 1: Start Docker Desktop**

**Windows**:
1. Press `Windows Key`
2. Type "Docker Desktop"
3. Click "Docker Desktop"
4. Wait for Docker icon in system tray to show "Docker Desktop is running"

**macOS**:
1. Press `Cmd + Space`
2. Type "Docker"
3. Click "Docker"
4. Wait for Docker icon in menu bar to show "Docker Desktop is running"

**Linux**:
```bash
sudo systemctl start docker
```

**Step 2: Start All Services (Scheduler + Prometheus + Grafana)**

```bash
cd backend/services-v2/scheduler-service
docker-compose up -d
```

**Expected Output**:
```
Creating network "scheduler-service_hospital-network" done
Creating rabbitmq-v2 ... done
Creating redis-v2 ... done
Creating scheduler-api ... done
Creating scheduler-prometheus ... done
Creating scheduler-grafana ... done
Creating scheduler-materializer ... done
Creating scheduler-worker-0 ... done
Creating scheduler-worker-1 ... done
Creating scheduler-worker-2 ... done
Creating scheduler-publisher ... done
```

**Step 3: Verify Services are Running**

```bash
docker-compose ps
```

**Expected Output**:
```
NAME                    STATUS              PORTS
scheduler-api           Up (healthy)        0.0.0.0:3030->3030/tcp
scheduler-prometheus    Up (healthy)        0.0.0.0:9090->9090/tcp
scheduler-grafana       Up (healthy)        0.0.0.0:3001->3000/tcp
scheduler-materializer  Up
scheduler-worker-0      Up
scheduler-worker-1      Up
scheduler-worker-2      Up
scheduler-publisher     Up
rabbitmq-v2            Up (healthy)        0.0.0.0:5673->5672/tcp, 0.0.0.0:15673->15672/tcp
redis-v2               Up (healthy)        0.0.0.0:6380->6379/tcp
```

**Step 4: Access Monitoring UIs**

- **Scheduler API**: http://localhost:3030/api/v1/health
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **RabbitMQ Management**: http://localhost:15673 (admin/admin)

**Step 5: Check Prometheus Targets**

- URL: http://localhost:9090/targets
- Should see `scheduler-service-api` target with status **UP**

**Step 6: View Grafana Dashboards**

1. Open http://localhost:3001
2. Login: admin/admin (change password on first login if prompted)
3. Navigate to "Dashboards" → "Scheduler Service"
4. **4 Pre-configured Dashboards Available**:
   - **Scheduler Service - Overview** - Quick health check
   - **Worker Performance** - Worker metrics and execution rate
   - **Database Metrics** - Database performance and errors
   - **Business Metrics** - Business KPIs and SLA monitoring
5. All dashboards auto-refresh every 10 seconds

---

### Method 2: Start Prometheus Standalone (For Local Development)

**Use this method if you're running Scheduler Service locally (not in Docker)**

**Step 1: Update Prometheus Configuration**

Edit `monitoring/prometheus/prometheus.yml`:
```yaml
static_configs:
  # Comment out Docker target
  # - targets: ['scheduler-api:3030']

  # Uncomment localhost target
  - targets: ['localhost:3025']
```

**Step 2: Start Prometheus**

**Windows (PowerShell)**:
```powershell
cd backend\services-v2\scheduler-service\monitoring
.\prometheus-setup.ps1 start
```

**Linux/macOS (Bash)**:
```bash
cd backend/services-v2/scheduler-service/monitoring
chmod +x prometheus-setup.sh
./prometheus-setup.sh start
```

**Expected Output**:
```
========================================
Checking Docker
========================================
✓ Docker is running
========================================
Checking Configuration Files
========================================
✓ prometheus.yml found
✓ alerts.yml found
========================================
Starting Prometheus
========================================
ℹ Waiting for Prometheus to be healthy...
✓ Prometheus is healthy
✓ Prometheus started successfully
ℹ Prometheus UI: http://localhost:9090
ℹ Metrics endpoint: http://localhost:3025/metrics
```

**Step 3: Verify Prometheus is Running**

**Open Prometheus UI**:
- URL: http://localhost:9090
- Should see Prometheus web interface

**Check Targets**:
- URL: http://localhost:9090/targets
- Should see `scheduler-service-api` target with status **UP**

**Check Metrics**:
- URL: http://localhost:9090/graph
- Try query: `scheduler_api_request_total`
- Should see metrics data

---

## 🎯 What's Next?

### 1. Explore Metrics

**Worker Metrics**:
```promql
# Worker poll latency (P95)
histogram_quantile(0.95, 
  sum(rate(scheduler_worker_poll_duration_seconds_bucket[5m])) by (le, worker_id)
)

# Runs executed per second
rate(scheduler_worker_runs_executed_total[5m])
```

**API Metrics**:
```promql
# API request rate
rate(scheduler_api_request_total[5m])

# API latency (P95)
histogram_quantile(0.95,
  sum(rate(scheduler_api_request_duration_seconds_bucket[5m])) by (le, route)
)
```

### 2. Check Alerts

- URL: http://localhost:9090/alerts
- View configured alert rules
- Check for any firing alerts

### 3. Create Grafana Dashboards

See [README.md](README.md#advanced-configuration) for Grafana setup instructions.

---

## 🔧 Troubleshooting

### Docker Desktop Not Running

**Symptoms**:
```
✗ Docker is not running. Please start Docker and try again.
```

**Solution**:
1. Start Docker Desktop (see Step 1 above)
2. Wait 30-60 seconds for Docker to fully start
3. Run `docker info` to verify
4. Try again: `.\prometheus-setup.ps1 start`

### Port 9090 Already in Use

**Symptoms**:
```
Error: bind: address already in use
```

**Solution**:

**Windows**:
```powershell
# Find process using port 9090
netstat -ano | findstr :9090

# Kill process (replace <PID> with actual PID)
taskkill /PID <PID> /F
```

**Linux/macOS**:
```bash
# Find process using port 9090
lsof -i :9090

# Kill process (replace <PID> with actual PID)
kill -9 <PID>
```

### Scheduler Service Not Running

**Symptoms**:
- Target shows **DOWN** in http://localhost:9090/targets
- Error: "Get http://localhost:3025/metrics: connection refused"

**Solution**:
```bash
# Start Scheduler Service
cd backend/services-v2/scheduler-service
npm run dev

# Or with Docker
docker-compose up -d
```

### Prometheus Failed to Start

**Symptoms**:
```
✗ Prometheus failed to start within timeout
```

**Solution**:
```bash
# Check logs
docker logs scheduler-prometheus

# Common issues:
# 1. Configuration syntax error
# 2. Port already in use
# 3. Docker not running

# Validate configuration
.\prometheus-setup.ps1 validate

# Clean up and restart
.\prometheus-setup.ps1 cleanup
.\prometheus-setup.ps1 start
```

---

## 📚 Useful Commands

### Check Status
```bash
# Windows
.\prometheus-setup.ps1 status

# Linux/macOS
./prometheus-setup.sh status
```

### View Logs
```bash
# Windows
.\prometheus-setup.ps1 logs

# Linux/macOS
./prometheus-setup.sh logs
```

### Reload Configuration
```bash
# After editing prometheus.yml or alerts.yml
# Windows
.\prometheus-setup.ps1 reload

# Linux/macOS
./prometheus-setup.sh reload
```

### Stop Prometheus
```bash
# Windows
.\prometheus-setup.ps1 stop

# Linux/macOS
./prometheus-setup.sh stop
```

### Restart Prometheus
```bash
# Windows
.\prometheus-setup.ps1 restart

# Linux/macOS
./prometheus-setup.sh restart
```

---

## 🎓 Learning Resources

### Prometheus Basics

**PromQL Tutorial**:
- https://prometheus.io/docs/prometheus/latest/querying/basics/

**Common Queries**:
```promql
# Rate of requests
rate(scheduler_api_request_total[5m])

# Percentile latency
histogram_quantile(0.95, scheduler_api_request_duration_seconds_bucket)

# Error rate
rate(scheduler_api_request_total{status_code=~"5.."}[5m])
```

### Grafana Integration

**Install Grafana**:
```bash
docker run -d -p 3000:3000 --name=grafana grafana/grafana
```

**Add Prometheus Data Source**:
1. Open http://localhost:3000 (admin/admin)
2. Configuration → Data Sources → Add data source
3. Select "Prometheus"
4. URL: `http://host.docker.internal:9090`
5. Click "Save & Test"

**Import Dashboard**:
1. Create → Import
2. Upload JSON from `docs/OBSERVABILITY.md`
3. Select Prometheus data source
4. Click "Import"

---

## 📞 Support

### Documentation

- **Full Guide**: [README.md](README.md)
- **Observability Guide**: [../docs/OBSERVABILITY.md](../docs/OBSERVABILITY.md)
- **Prometheus Docs**: https://prometheus.io/docs/

### Common Issues

**Issue**: Metrics not showing
- **Check**: http://localhost:3025/metrics should return data
- **Check**: http://localhost:9090/targets should show target UP

**Issue**: Alerts not firing
- **Check**: http://localhost:9090/alerts
- **Check**: Alert expression in Graph page
- **Check**: Metrics exist in Prometheus

**Issue**: High memory usage
- **Solution**: Reduce retention time in `docker-compose.prometheus.yml`
- **Solution**: Add metric relabel configs to drop unused metrics

---

## ✅ Success Checklist

After setup, verify:

- [ ] Prometheus UI accessible at http://localhost:9090
- [ ] Target `scheduler-service-api` shows **UP** status
- [ ] Metrics visible in Graph page
- [ ] Alert rules loaded (http://localhost:9090/alerts)
- [ ] No errors in logs (`docker logs scheduler-prometheus`)

---

**Last Updated**: 2025-10-21
**Version**: 1.0.0

**Next Steps**: See [README.md](README.md) for advanced configuration and Grafana setup.

