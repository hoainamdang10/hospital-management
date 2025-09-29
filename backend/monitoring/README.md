# 🏥 Hospital Management System - Monitoring Stack

## 📊 Overview

This monitoring stack provides comprehensive observability for the Hospital Management System using:

- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and dashboards
- **Node Exporter**: System metrics
- **Custom Metrics**: Application-specific metrics

## 🚀 Quick Start

### 1. Setup Dependencies
```bash
# Windows
cd backend
setup-monitoring.bat

# Linux/macOS
cd backend
./setup-monitoring.sh
```

### 2. Start Monitoring Stack
```bash
# Windows
docker-management.bat monitoring

# Linux/macOS
./docker-management.sh monitoring
```

### 3. Access Dashboards
- **Grafana**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Node Exporter**: http://localhost:9100

## 📈 Available Dashboards

### 1. Hospital Overview Dashboard
- Service status overview
- Total services up/down
- Quick health check

### 2. Hospital Services Dashboard
- Individual service status
- API Gateway, Auth, Doctor, Patient services
- Real-time status indicators

## 🔧 Configuration

### Prometheus Configuration
- **File**: `monitoring/prometheus/prometheus.yml`
- **Scrape Interval**: 15 seconds
- **Retention**: 30 days
- **Targets**: All microservices + infrastructure

### Grafana Configuration
- **Datasource**: Prometheus (auto-configured)
- **Dashboards**: Auto-provisioned from `monitoring/grafana/dashboards/`
- **Admin User**: admin
- **Admin Password**: admin123

### Alert Rules
- **File**: `monitoring/prometheus/rules/hospital-alerts.yml`
- **Service Down**: Triggers when service is down for 1+ minutes
- **High Response Time**: Triggers when 95th percentile > 1 second
- **High Error Rate**: Triggers when error rate > 10%

## 📊 Metrics Available

### HTTP Metrics
- `hospital_http_requests_total`: Total HTTP requests
- `hospital_http_request_duration_seconds`: Request duration

### Database Metrics
- `hospital_database_connections_active`: Active DB connections
- `hospital_database_query_duration_seconds`: Query duration
- `hospital_database_queries_total`: Total queries

### Business Metrics
- `hospital_patients_total`: Total patients
- `hospital_doctors_total`: Total doctors
- `hospital_appointments_total`: Total appointments
- `hospital_appointments_active`: Active appointments

### Authentication Metrics
- `hospital_auth_attempts_total`: Authentication attempts
- `hospital_active_sessions_total`: Active user sessions

### System Metrics (Node Exporter)
- CPU usage, memory usage, disk usage
- Network I/O, disk I/O
- System load and uptime

## 🔍 Using the Monitoring Stack

### 1. Check Service Health
1. Open Grafana: http://localhost:3001
2. Navigate to "Hospital Overview" dashboard
3. Check service status indicators

### 2. Monitor Performance
1. Go to "Hospital Services" dashboard
2. Check response times and error rates
3. Monitor resource usage

### 3. Set Up Alerts
1. Open Prometheus: http://localhost:9090
2. Go to "Alerts" tab
3. Check active alert rules

### 4. View Metrics
1. Open Prometheus: http://localhost:9090
2. Go to "Graph" tab
3. Query metrics using PromQL

## 🛠️ Troubleshooting

### Services Not Showing Metrics
1. Check if services are running: `docker-compose ps`
2. Verify metrics endpoints: `curl http://localhost:3100/metrics`
3. Check Prometheus targets: http://localhost:9090/targets

### Grafana Dashboard Issues
1. Check datasource connection in Grafana
2. Verify dashboard provisioning in logs
3. Restart Grafana container if needed

### High Resource Usage
1. Adjust retention settings in prometheus.yml
2. Reduce scrape frequency for non-critical metrics
3. Use resource limits in docker-compose.yml

## 📝 Adding Custom Metrics

### 1. In Your Service
```typescript
import { metricsMiddleware, getMetricsHandler } from '@hospital/shared';

// Add metrics middleware
app.use(metricsMiddleware('your-service-name'));

// Add metrics endpoint
app.get('/metrics', getMetricsHandler);
```

### 2. Custom Business Metrics
```typescript
import { Counter, Gauge } from 'prom-client';

const customMetric = new Counter({
  name: 'hospital_custom_metric_total',
  help: 'Description of your metric',
  labelNames: ['label1', 'label2'],
});

// Increment metric
customMetric.inc({ label1: 'value1', label2: 'value2' });
```

### 3. Update Prometheus Config
Add your service to `monitoring/prometheus/prometheus.yml`:
```yaml
- job_name: 'your-service'
  static_configs:
    - targets: ['your-service:port']
  metrics_path: /metrics
  scrape_interval: 15s
```

## 🔒 Security Considerations

1. **Grafana**: Change default admin password in production
2. **Prometheus**: Restrict access to metrics endpoints
3. **Network**: Use internal networks for metrics collection
4. **Data**: Consider metrics data retention policies

## 📚 Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Node Exporter Metrics](https://github.com/prometheus/node_exporter)
- [PromQL Query Language](https://prometheus.io/docs/prometheus/latest/querying/)

## 🎯 Next Steps

1. **Custom Dashboards**: Create service-specific dashboards
2. **Alerting**: Set up Alertmanager for notifications
3. **Log Aggregation**: Add ELK stack for log monitoring
4. **Distributed Tracing**: Add Jaeger for request tracing
