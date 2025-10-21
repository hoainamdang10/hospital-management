# Unroutable Messages Monitoring Guide

> **Complete guide for monitoring and troubleshooting unroutable RabbitMQ messages in Scheduler Service**

## 📋 Overview

Scheduler Service tracks unroutable messages - messages that RabbitMQ cannot route to any queue because:
- No queue is bound to the routing key
- Exchange doesn't exist
- Binding configuration is incorrect
- Consumer service is not running

This guide covers:
- Prometheus metrics for tracking unroutable messages
- Grafana dashboard for visualization
- Alert rules for proactive monitoring
- Troubleshooting steps

---

## 🎯 Features

### 1. Prometheus Metrics

**Metrics Added**:
- `scheduler_unroutable_messages_total` - Total count by routing_key and exchange
- `scheduler_unroutable_messages_by_exchange_total` - Total count by exchange only

**Labels**:
- `routing_key` - The routing key that failed to route
- `exchange` - The exchange name

**Example Queries**:
```promql
# Rate of unroutable messages per second
rate(scheduler_unroutable_messages_total[5m])

# Total unroutable messages
sum(scheduler_unroutable_messages_total)

# Unroutable messages by exchange
sum by (exchange) (scheduler_unroutable_messages_by_exchange_total)

# Unroutable messages by routing key
sum by (routing_key) (scheduler_unroutable_messages_total)
```

### 2. Grafana Dashboard

**Dashboard**: "Scheduler Service - Unroutable Messages"
**Location**: Dashboards → Scheduler Service → Unroutable Messages

**Panels** (4):
1. **Unroutable Messages Rate** - Time series showing rate per second by routing_key
2. **Total Unroutable Messages** - Gauge showing total count with thresholds
3. **Unroutable Messages by Exchange** - Pie chart showing distribution
4. **Unroutable Messages by Routing Key** - Bar chart showing last hour breakdown

**Access**: http://localhost:3001/d/scheduler-unroutable-messages

### 3. Alert Rules

**Alerts Added** (3):

#### UnroutableMessagesDetected (Warning)
- **Trigger**: Any unroutable messages detected
- **Duration**: 5 minutes
- **Severity**: Warning
- **Action**: Investigate routing configuration

#### HighUnroutableMessageRate (Critical)
- **Trigger**: Rate > 1 message/second
- **Duration**: 5 minutes
- **Severity**: Critical
- **Action**: Immediate investigation required

#### TooManyUnroutableMessages (Critical)
- **Trigger**: Total count > 100
- **Duration**: 1 hour
- **Severity**: Critical
- **Action**: Check RabbitMQ bindings and consumers

---

## 🚀 Quick Start

### 1. Start Monitoring Stack

```bash
cd backend/services-v2/scheduler-service/monitoring

# Linux/macOS
./prometheus-setup.sh start

# Windows
.\prometheus-setup.ps1 start
```

### 2. Access Dashboards

**Prometheus**: http://localhost:9090
- Navigate to "Alerts" to see unroutable message alerts
- Use "Graph" to query metrics

**Grafana**: http://localhost:3001 (admin/admin)
- Navigate to "Dashboards" → "Scheduler Service" → "Unroutable Messages"

### 3. Test Unroutable Message

```bash
# Publish message with invalid routing key
curl -X POST http://localhost:3030/test/publish-invalid \
  -H "Content-Type: application/json" \
  -d '{
    "routing_key": "invalid.routing.key",
    "payload": {"test": "data"}
  }'
```

**Expected Result**:
- Message returned as unroutable
- Metric `scheduler_unroutable_messages_total` incremented
- Alert `UnroutableMessagesDetected` fires after 5 minutes
- Dashboard shows the unroutable message

---

## 📊 Monitoring Workflow

### 1. Real-time Monitoring

**Grafana Dashboard**:
1. Open http://localhost:3001
2. Navigate to "Scheduler Service - Unroutable Messages"
3. Monitor panels:
   - **Rate panel**: Shows current rate of unroutable messages
   - **Gauge panel**: Shows total count with color-coded thresholds
   - **Pie chart**: Shows which exchanges have issues
   - **Bar chart**: Shows which routing keys are failing

**Auto-refresh**: Dashboard refreshes every 10 seconds

### 2. Alert Notifications

**Prometheus Alerts**:
1. Open http://localhost:9090/alerts
2. Check "Unroutable Messages" section
3. Alerts show:
   - Current state (Inactive/Pending/Firing)
   - Duration
   - Labels (routing_key, exchange)
   - Annotations (description, runbook)

**Alert States**:
- **Inactive**: No unroutable messages
- **Pending**: Condition met, waiting for duration
- **Firing**: Alert active, action required

### 3. Investigation

**Step 1: Check Metrics**
```promql
# Which routing keys are failing?
topk(10, sum by (routing_key) (scheduler_unroutable_messages_total))

# Which exchanges have issues?
sum by (exchange) (scheduler_unroutable_messages_by_exchange_total)

# What's the rate over time?
rate(scheduler_unroutable_messages_total[1h])
```

**Step 2: Check Dead Letters Table**
```sql
-- View recent unroutable messages
SELECT 
  message_id,
  routing_key,
  exchange,
  payload,
  headers,
  created_at
FROM scheduler.dead_letters
WHERE failure_type = 'unroutable_message'
ORDER BY created_at DESC
LIMIT 20;
```

**Step 3: Check RabbitMQ**
1. Open http://localhost:15673 (admin/admin)
2. Navigate to "Exchanges" → Select exchange
3. Check bindings:
   - Are queues bound to the routing key?
   - Is the binding pattern correct?
4. Navigate to "Queues"
   - Are consumer services running?
   - Are queues declared?

---

## 🔧 Troubleshooting

### Issue 1: Unroutable Messages for Valid Routing Key

**Symptoms**:
- Metrics show unroutable messages
- Routing key should be valid
- Consumer service is running

**Diagnosis**:
```bash
# Check RabbitMQ bindings
curl -u admin:admin http://localhost:15673/api/bindings

# Check if queue exists
curl -u admin:admin http://localhost:15673/api/queues
```

**Solutions**:
1. **Queue not declared**: Consumer service needs to declare queue
2. **Binding missing**: Add binding in RabbitMQ or consumer code
3. **Wrong exchange**: Check exchange name in publisher config

### Issue 2: High Unroutable Message Rate

**Symptoms**:
- Alert `HighUnroutableMessageRate` firing
- Rate > 1 message/second

**Diagnosis**:
```promql
# Which routing keys are causing high rate?
topk(5, rate(scheduler_unroutable_messages_total[5m]))
```

**Solutions**:
1. **Consumer service down**: Restart consumer service
2. **Queue deleted**: Recreate queue and bindings
3. **Configuration mismatch**: Verify routing key in publisher matches consumer

### Issue 3: Too Many Unroutable Messages Accumulated

**Symptoms**:
- Alert `TooManyUnroutableMessages` firing
- Total count > 100

**Diagnosis**:
```sql
-- Check distribution by routing key
SELECT 
  routing_key,
  COUNT(*) as count
FROM scheduler.dead_letters
WHERE failure_type = 'unroutable_message'
GROUP BY routing_key
ORDER BY count DESC;
```

**Solutions**:
1. **Fix root cause**: Address routing configuration issues
2. **Clean up dead letters**: After fixing, clean old entries
   ```sql
   DELETE FROM scheduler.dead_letters
   WHERE failure_type = 'unroutable_message'
   AND created_at < NOW() - INTERVAL '7 days';
   ```

---

## 📚 Best Practices

### 1. Proactive Monitoring
- Set up Grafana dashboard on main monitor
- Configure alert notifications (email, Slack, PagerDuty)
- Review unroutable messages weekly

### 2. Root Cause Analysis
- Always check dead_letters table for payload details
- Verify RabbitMQ bindings match publisher routing keys
- Test routing keys in development before production

### 3. Prevention
- Use topic allowlist to validate routing keys before publishing
- Implement health checks for consumer services
- Document routing key conventions

### 4. Cleanup
- Regularly clean old dead letters (> 30 days)
- Archive critical unroutable messages for audit
- Monitor dead_letters table size

---

## 🔗 Related Documentation

- **Observability Guide**: [OBSERVABILITY.md](OBSERVABILITY.md)
- **Monitoring Setup**: [../monitoring/README.md](../monitoring/README.md)
- **RabbitMQ Publisher**: [../src/infrastructure/messaging/RabbitMQPublisher.ts](../src/infrastructure/messaging/RabbitMQPublisher.ts)
- **Dead Letters Schema**: [../migrations/004_add_dead_letters_unroutable_columns.sql](../migrations/004_add_dead_letters_unroutable_columns.sql)

---

**Last Updated**: 2025-10-21
**Version**: 1.0.0
**Maintained By**: Hospital Management System V2 Team

