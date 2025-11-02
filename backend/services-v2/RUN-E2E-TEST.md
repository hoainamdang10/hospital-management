# 🧪 END-TO-END TEST GUIDE
## Identity Service → Notifications Service Flow

---

## 📋 PREREQUISITES

### 1. Infrastructure Services Running
```powershell
# Check status
docker ps --filter "name=rabbitmq-v2" --filter "name=redis-v2"

# If not running, start them
docker start redis-v2 rabbitmq-v2
```

✅ **VERIFIED**: RabbitMQ and Redis are running

### 2. Database Ready
✅ **VERIFIED**: Supabase notifications_schema tables ready:
- ✅ notifications (34 columns)
- ✅ notification_delivery_results (30 columns)
- ✅ notification_templates (13 templates active)
- ✅ inbox (13 columns for event tracking)

### 3. SendGrid Configured
✅ **VERIFIED**: SendGrid tested successfully (4/4 emails sent)

---

## 🚀 HOW TO RUN E2E TEST

### Method 1: Manual Step-by-Step (Recommended for first time)

#### Step 1: Start Identity Service
```powershell
# Terminal 1
cd backend/services-v2/identity-service
npm run dev
```

**Wait for**: `Identity Service listening on port 3021`

#### Step 2: Start Notifications Consumer
```powershell
# Terminal 2
cd backend/services-v2/notifications-service
npm run dev:consumer
```

**Wait for**: 
- `RabbitMQ connected`
- `Listening on queue: identity.user.created`
- `Ready to consume events`

#### Step 3: Start Database Monitor
```powershell
# Terminal 3
cd backend/services-v2/notifications-service
node test-e2e-flow.js
```

**This will monitor** the Supabase database for new notifications

#### Step 4: Trigger User Registration
```powershell
# Terminal 4 - Using PowerShell
$body = @{
    email = "e2e.test@hospital.test"
    password = "Test123456!"
    firstName = "E2E"
    lastName = "Test User"
    role = "PATIENT"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3021/api/auth/register" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

**Or using curl (Git Bash):**
```bash
curl -X POST http://localhost:3021/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "e2e.test@hospital.test",
    "password": "Test123456!",
    "firstName": "E2E",
    "lastName": "Test User",
    "role": "PATIENT"
  }'
```

---

### Method 2: Automated Script

```powershell
cd backend/services-v2
.\start-e2e-test.ps1
```

This script will:
1. ✅ Check infrastructure
2. ✅ Check Identity Service
3. ✅ Start Notifications Consumer
4. ✅ Run E2E test
5. ✅ Cleanup

---

## 📊 WHAT TO EXPECT

### Success Flow:

1. **User Registration** (Identity Service)
   ```
   POST /api/auth/register
   → User created in auth_schema.users
   → USER_CREATED event published to RabbitMQ
   ```

2. **Event Routing** (RabbitMQ)
   ```
   identity.user.created event
   → Routed to notifications-service queue
   ```

3. **Event Consumption** (Notifications Service)
   ```
   Consumer receives event
   → NotificationEventHandlers.handleUserCreatedEvent()
   → Creates notification in notifications table
   → Status: PENDING
   ```

4. **Email Delivery** (SendGrid)
   ```
   ProcessNotificationQueueUseCase polls queue
   → Finds PENDING notification
   → Sends via SendGrid
   → Updates status: SENT → DELIVERED
   → Creates delivery_result record
   ```

5. **Database Verification** (Supabase)
   ```
   notifications_schema.notifications: 1 new row
   - template_type: USER_WELCOME
   - status: DELIVERED
   - recipient_email: e2e.test@hospital.test
   
   notifications_schema.notification_delivery_results: 1 new row
   - channel: EMAIL
   - success: true
   - provider_message_id: (SendGrid message ID)
   ```

6. **Email Inbox**
   ```
   Email received at: e2e.test@hospital.test
   Subject: Chào mừng đến với...
   Content: Vietnamese welcome email
   ```

---

## 🔍 VERIFICATION CHECKLIST

### On Supabase Dashboard:

#### Check notifications table:
```sql
SELECT 
  notification_id,
  template_type,
  recipient_email,
  status,
  channels,
  created_at,
  sent_at,
  delivered_at
FROM notifications_schema.notifications
WHERE recipient_email = 'e2e.test@hospital.test'
ORDER BY created_at DESC
LIMIT 5;
```

#### Check delivery results:
```sql
SELECT 
  channel,
  status,
  success,
  provider_message_id,
  delivered_at,
  error_message
FROM notifications_schema.notification_delivery_results
WHERE recipient_email = 'e2e.test@hospital.test'
ORDER BY created_at DESC
LIMIT 5;
```

#### Check inbox events:
```sql
SELECT 
  event_type,
  status,
  received_at_utc,
  processed_at_utc,
  error_message
FROM notifications_schema.inbox
WHERE event_type = 'identity.user.created'
ORDER BY created_at_utc DESC
LIMIT 5;
```

---

## ❌ TROUBLESHOOTING

### Issue 1: No notification created
**Symptoms**: Database shows 0 new notifications after user registration

**Possible causes**:
1. ❌ Notifications consumer not running
2. ❌ RabbitMQ event not published by Identity Service
3. ❌ Event handler error

**Solution**:
```powershell
# Check consumer logs
cd backend/services-v2/notifications-service
npm run dev:consumer

# Look for:
# - "RabbitMQ connected" ✅
# - "Received event: identity.user.created" ✅
# - Any error messages ❌
```

### Issue 2: Notification created but not sent
**Symptoms**: Notification exists with status PENDING

**Possible causes**:
1. ❌ SendGrid API error
2. ❌ Queue processor not running
3. ❌ Template not found

**Solution**:
```sql
-- Check notification status
SELECT status, retry_count, delivery_results
FROM notifications_schema.notifications
WHERE recipient_email = 'e2e.test@hospital.test';

-- If FAILED, check delivery results
SELECT channel, error_message, failure_reason
FROM notifications_schema.notification_delivery_results
WHERE notification_id = '<notification_id>';
```

### Issue 3: Identity Service not publishing events
**Symptoms**: No events in RabbitMQ/inbox table

**Solution**:
```powershell
# Check Identity Service has RabbitMQ configured
cd backend/services-v2/identity-service
cat .env | Select-String "RABBITMQ"

# Should have:
# RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672
# RABBITMQ_EXCHANGE=hospital.events

# Check Identity Service logs for:
# - "Event published: identity.user.created" ✅
# - "RabbitMQ connection error" ❌
```

---

## 📈 SUCCESS INDICATORS

✅ **Terminal 1 (Identity Service):**
```
Identity Service listening on port 3021
Event published: identity.user.created
```

✅ **Terminal 2 (Notifications Consumer):**
```
RabbitMQ connected
Received event: identity.user.created
Processing event...
Notification created: NOTIF-xxx
```

✅ **Terminal 3 (Database Monitor):**
```
NEW NOTIFICATION DETECTED!
Template: USER_WELCOME
Status: PENDING → SENT → DELIVERED
```

✅ **Supabase Database:**
```
notifications: 1 new row (status: DELIVERED)
notification_delivery_results: 1 new row (success: true)
inbox: 1 new row (status: PROCESSED)
```

✅ **Email Inbox:**
```
New email from: Hospital Management System
Subject: Chào mừng đến với...
```

---

## 🎯 EXPECTED TIMELINE

| Time | Action |
|------|--------|
| T+0s | User registration sent to Identity Service |
| T+1s | USER_CREATED event published to RabbitMQ |
| T+2s | Notifications consumer receives event |
| T+3s | Notification created in database (PENDING) |
| T+5s | Queue processor picks up notification |
| T+6s | Email sent via SendGrid (SENT) |
| T+7s | Email delivered (DELIVERED) |
| T+8s | Delivery result recorded |

**Total time**: ~8-10 seconds from registration to email delivery

---

## 📧 EMAIL VERIFICATION

Check inbox: **e2e.test@hospital.test**

Expected email:
- **Subject**: Chào mừng đến với Bệnh viện Đa khoa Kutou
- **Template**: USER_WELCOME
- **Content**: Vietnamese welcome message with user details
- **From**: Hospital Management System <ngocthien20122003@gmail.com>

---

## 🔄 RE-RUNNING THE TEST

To run again with a different email:

```powershell
# Edit test-e2e-identity-notifications.js
# Change TEST_EMAIL to a new email address

# Run
node test-e2e-identity-notifications.js
```

---

## ✅ TEST COMPLETION CRITERIA

E2E test is successful when ALL of these are true:

- [x] Identity Service responds to registration
- [x] USER_CREATED event appears in inbox table
- [x] Notification created in notifications table
- [x] Notification status changes: PENDING → SENT → DELIVERED
- [x] Delivery result shows success: true
- [x] Email received in inbox

---

**Ready to run E2E test!** 🚀
