# Consumer Guide - Scheduler Service Events

## Overview

This guide explains how to consume events published by the Scheduler Service using the **Inbox Pattern** for exactly-once processing semantics.

**Key Concepts**:
- **Idempotency**: Events can be safely reprocessed without side effects
- **Inbox Pattern**: Database-backed deduplication using `idempotency_key`
- **Transactional Processing**: Event processing and inbox updates in same transaction
- **Error Handling**: Retry transient errors, log permanent errors

---

## Quick Start

### 1. Create Inbox Table

Create an inbox table in your service schema:

```sql
-- Example: notifications_schema.inbox
CREATE TABLE notifications_schema.inbox (
  inbox_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE,
  event_type text NOT NULL,
  payload_json jsonb NOT NULL,
  processed_at_utc timestamptz,
  created_at_utc timestamptz DEFAULT now(),
  error_message text,
  retry_count integer DEFAULT 0
);

-- Index for finding unprocessed entries
CREATE INDEX idx_inbox_unprocessed 
ON notifications_schema.inbox(created_at_utc)
WHERE processed_at_utc IS NULL;

-- Index for cleanup
CREATE INDEX idx_inbox_processed 
ON notifications_schema.inbox(processed_at_utc)
WHERE processed_at_utc IS NOT NULL;

COMMENT ON TABLE notifications_schema.inbox IS 
'Inbox for idempotent event processing from Scheduler Service';
```

### 2. Subscribe to RabbitMQ Topic

Subscribe to the topics your service needs to handle:

```typescript
import * as amqp from 'amqplib';

const EXCHANGE = 'hospital.events';
const QUEUE = 'notifications-service-queue';
const ROUTING_KEYS = [
  'appointments.appointment.reminder.*',  // All appointment reminders
  'billing.payment.reminder',             // Payment reminders
  'notifications.*'                       // All notification events
];

async function setupConsumer() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();
  
  // Assert exchange
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  
  // Assert queue
  await channel.assertQueue(QUEUE, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'hospital.dlx',
      'x-dead-letter-routing-key': 'notifications.dlq'
    }
  });
  
  // Bind routing keys
  for (const routingKey of ROUTING_KEYS) {
    await channel.bindQueue(QUEUE, EXCHANGE, routingKey);
  }
  
  // Consume messages
  await channel.consume(QUEUE, async (msg) => {
    if (!msg) return;
    
    try {
      const headers = msg.properties.headers;
      const payload = JSON.parse(msg.content.toString());
      
      await handleEvent(payload, headers);
      
      // Acknowledge message
      channel.ack(msg);
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Reject and requeue (or send to DLQ after max retries)
      const retryCount = (msg.properties.headers['x-retry-count'] || 0) + 1;
      
      if (retryCount < 3) {
        // Requeue with retry count
        channel.nack(msg, false, true);
      } else {
        // Send to DLQ
        channel.nack(msg, false, false);
      }
    }
  }, { noAck: false });
  
  console.log(`Consumer started, listening to: ${ROUTING_KEYS.join(', ')}`);
}
```

### 3. Implement Event Handler with Inbox Pattern

```typescript
import { SupabaseClient } from '@supabase/supabase-js';

interface EventHeaders {
  correlation_id: string;
  causation_id: string;
  schedule_id: string;
  run_id: string;
  tenant_id: string;
  idempotency_key: string;
  emitted_at: string;
  timestamp: string;
  schema_version: string;
  content_type: string;
  event_type: string;
}

interface ScheduleRunEvent {
  scheduleId: string;
  runId: string;
  tenantId: string;
  dueAtUtc: string;
  topicOrCommand: string;
  payloadJson: object;
  attempt: number;
}

async function handleEvent(
  event: ScheduleRunEvent,
  headers: EventHeaders
): Promise<void> {
  const { idempotency_key, tenant_id } = headers;
  
  // Validate tenant
  if (tenant_id !== event.tenantId) {
    throw new Error('Tenant mismatch in headers and payload');
  }
  
  // 1. Check inbox for duplicate
  const { data: existing } = await supabase
    .from('inbox')
    .select('inbox_id, processed_at_utc')
    .eq('idempotency_key', idempotency_key)
    .single();
  
  if (existing) {
    if (existing.processed_at_utc) {
      console.log('Event already processed, skipping', {
        idempotency_key,
        processed_at: existing.processed_at_utc
      });
      return; // Idempotent
    } else {
      console.log('Event in progress, skipping', { idempotency_key });
      return; // Another worker is processing
    }
  }
  
  // 2. Insert into inbox + process in transaction
  try {
    // Insert inbox record (marks as "in progress")
    const { error: insertError } = await supabase
      .from('inbox')
      .insert({
        idempotency_key,
        event_type: headers.event_type,
        payload_json: event
      });
    
    if (insertError) {
      if (insertError.code === '23505') {
        // Unique constraint violation - another worker got it
        console.log('Race condition, another worker processing', { idempotency_key });
        return;
      }
      throw insertError;
    }
    
    // 3. Process event (business logic)
    await processEvent(event, headers);
    
    // 4. Mark as processed
    const { error: updateError } = await supabase
      .from('inbox')
      .update({ processed_at_utc: new Date().toISOString() })
      .eq('idempotency_key', idempotency_key);
    
    if (updateError) throw updateError;
    
    console.log('Event processed successfully', {
      idempotency_key,
      event_type: headers.event_type,
      topic: event.topicOrCommand
    });
    
  } catch (error) {
    // Log error in inbox
    await supabase
      .from('inbox')
      .update({
        error_message: error.message,
        retry_count: supabase.rpc('increment', { row_id: idempotency_key })
      })
      .eq('idempotency_key', idempotency_key);
    
    throw error; // Rethrow for RabbitMQ retry
  }
}
```

### 4. Implement Business Logic

```typescript
async function processEvent(
  event: ScheduleRunEvent,
  headers: EventHeaders
): Promise<void> {
  const { topicOrCommand, payloadJson } = event;
  
  // Route to appropriate handler based on topic
  if (topicOrCommand.startsWith('appointments.appointment.reminder')) {
    await handleAppointmentReminder(payloadJson, headers);
  } else if (topicOrCommand === 'billing.payment.reminder') {
    await handlePaymentReminder(payloadJson, headers);
  } else {
    console.warn('Unknown topic, skipping', { topicOrCommand });
  }
}

async function handleAppointmentReminder(
  payload: any,
  headers: EventHeaders
): Promise<void> {
  const { appointmentId, patientId, reminderType } = payload;
  
  console.log('Sending appointment reminder', {
    appointmentId,
    patientId,
    reminderType,
    correlation_id: headers.correlation_id
  });
  
  // Get patient details
  const { data: patient } = await supabase
    .from('patients')
    .select('email, phone, name')
    .eq('patient_id', patientId)
    .single();
  
  if (!patient) {
    throw new Error(`Patient not found: ${patientId}`);
  }
  
  // Get appointment details
  const { data: appointment } = await supabase
    .from('appointments')
    .select('appointment_time, doctor_id, department')
    .eq('appointment_id', appointmentId)
    .single();
  
  if (!appointment) {
    throw new Error(`Appointment not found: ${appointmentId}`);
  }
  
  // Send email
  await emailService.send({
    to: patient.email,
    subject: `Appointment Reminder - ${reminderType}`,
    template: 'appointment-reminder',
    data: {
      patientName: patient.name,
      appointmentTime: appointment.appointment_time,
      reminderType
    }
  });
  
  // Send SMS
  await smsService.send({
    to: patient.phone,
    message: `Reminder: You have an appointment at ${appointment.appointment_time}`
  });
  
  console.log('Appointment reminder sent successfully', {
    appointmentId,
    patientId,
    email: patient.email,
    phone: patient.phone
  });
}
```

---

## Best Practices

### 1. Idempotency

**Rule**: Event handlers must be idempotent (safe to retry)

**Implementation**:
- Use inbox table with unique constraint on `idempotency_key`
- Check inbox before processing
- Use database transactions for atomicity

**Example**:
```typescript
// ✅ GOOD: Idempotent
async function sendEmail(email: string, subject: string) {
  // Check if already sent
  const existing = await db.query(
    'SELECT * FROM sent_emails WHERE idempotency_key = $1',
    [idempotency_key]
  );
  
  if (existing.rows.length > 0) {
    return; // Already sent
  }
  
  // Send email + record in transaction
  await db.transaction(async (tx) => {
    await emailService.send(email, subject);
    await tx.query(
      'INSERT INTO sent_emails (idempotency_key, email, subject) VALUES ($1, $2, $3)',
      [idempotency_key, email, subject]
    );
  });
}

// ❌ BAD: Not idempotent
async function sendEmail(email: string, subject: string) {
  await emailService.send(email, subject); // Will send duplicate on retry
}
```

### 2. Error Handling

**Transient Errors** (retry):
- Network timeouts
- Database connection errors
- Rate limiting (429)
- Service unavailable (503)

**Permanent Errors** (don't retry):
- Validation errors (400)
- Not found (404)
- Business logic errors

**Implementation**:
```typescript
function isTransientError(error: Error): boolean {
  if (error.message.includes('timeout')) return true;
  if (error.message.includes('ECONNREFUSED')) return true;
  if (error.message.includes('503')) return true;
  if (error.message.includes('429')) return true;
  return false;
}

async function processEvent(event: ScheduleRunEvent) {
  try {
    await businessLogic(event);
  } catch (error) {
    if (isTransientError(error)) {
      // Retry (RabbitMQ will redeliver)
      throw error;
    } else {
      // Permanent error - log and skip
      console.error('Permanent error, skipping event', {
        error: error.message,
        event
      });
      await logError(event, error);
      // Don't throw - mark as processed
    }
  }
}
```

### 3. Timeout Handling

**Rule**: Set reasonable timeouts to avoid blocking inbox

**Implementation**:
```typescript
async function processEventWithTimeout(
  event: ScheduleRunEvent,
  timeoutMs: number = 30000
): Promise<void> {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Processing timeout')), timeoutMs);
  });
  
  await Promise.race([
    processEvent(event),
    timeoutPromise
  ]);
}
```

### 4. Monitoring

**Metrics to Track**:
```typescript
import { Counter, Histogram, Gauge } from 'prom-client';

const inboxProcessingLatency = new Histogram({
  name: 'inbox_processing_latency_seconds',
  help: 'Time from emitted_at to processed_at_utc',
  labelNames: ['event_type', 'topic']
});

const inboxDuplicateEvents = new Counter({
  name: 'inbox_duplicate_events_total',
  help: 'Count of duplicate events (idempotency working)',
  labelNames: ['event_type']
});

const inboxProcessingErrors = new Counter({
  name: 'inbox_processing_errors_total',
  help: 'Count of processing errors',
  labelNames: ['event_type', 'error_type']
});

const inboxUnprocessedCount = new Gauge({
  name: 'inbox_unprocessed_count',
  help: 'Number of unprocessed inbox entries'
});

// Update metrics
async function updateMetrics() {
  const { count } = await supabase
    .from('inbox')
    .select('*', { count: 'exact', head: true })
    .is('processed_at_utc', null);
  
  inboxUnprocessedCount.set(count || 0);
}

setInterval(updateMetrics, 60000); // Every minute
```

---

## Troubleshooting

### Issue 1: Duplicate Events

**Symptom**: Same event processed multiple times

**Cause**: Inbox pattern not implemented correctly

**Solution**:
```typescript
// ✅ CORRECT: Check inbox before processing
const existing = await db.query(
  'SELECT * FROM inbox WHERE idempotency_key = $1',
  [idempotency_key]
);

if (existing.rows.length > 0) {
  return; // Skip duplicate
}

// ❌ WRONG: No inbox check
await processEvent(event); // Will process duplicates
```

### Issue 2: Inbox Growing Unbounded

**Symptom**: Inbox table size growing indefinitely

**Cause**: No cleanup of processed entries

**Solution**:
```sql
-- Cleanup processed entries older than 7 days
DELETE FROM inbox
WHERE processed_at_utc < NOW() - INTERVAL '7 days';

-- Or archive to separate table
INSERT INTO inbox_archive
SELECT * FROM inbox
WHERE processed_at_utc < NOW() - INTERVAL '7 days';

DELETE FROM inbox
WHERE processed_at_utc < NOW() - INTERVAL '7 days';
```

### Issue 3: Processing Stuck

**Symptom**: Events in inbox but not processed

**Cause**: Worker crashed mid-processing

**Solution**:
```sql
-- Find stuck entries (created > 1 hour ago, not processed)
SELECT *
FROM inbox
WHERE created_at_utc < NOW() - INTERVAL '1 hour'
  AND processed_at_utc IS NULL;

-- Reset stuck entries
UPDATE inbox
SET error_message = 'Reset due to timeout',
    retry_count = retry_count + 1
WHERE created_at_utc < NOW() - INTERVAL '1 hour'
  AND processed_at_utc IS NULL;
```

---

## Examples

See [Message Contract](./message-contract.md) for complete event examples.

---

## FAQ

**Q: What if my service crashes mid-processing?**

A: The inbox entry will remain unprocessed. On restart, RabbitMQ will redeliver the message, and the inbox check will prevent duplicate processing.

**Q: How do I handle events that arrive out of order?**

A: Use `timestamp` header (due_at_utc) to determine event order. Store events in inbox and process in order.

**Q: Can I process events in parallel?**

A: Yes, but ensure each worker processes different events. Use `FOR UPDATE SKIP LOCKED` in PostgreSQL for distributed locking.

**Q: How long should I keep processed inbox entries?**

A: Recommended: 7-30 days for debugging. Archive older entries to separate table.

---

## Contact

For questions or support:
- **Team**: Hospital Management System V2
- **Email**: support@hospital-v2.com
- **Slack**: #scheduler-service

