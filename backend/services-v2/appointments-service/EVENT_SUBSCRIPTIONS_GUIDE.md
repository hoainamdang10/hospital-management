# 🔄 EVENT SUBSCRIPTIONS GUIDE

**Service**: Scheduling Service  
**Feature**: RabbitMQ Event Subscriptions for CQRS Read Model Sync  
**Version**: 3.0.0

---

## 🎯 OVERVIEW

Scheduling Service subscribes to events từ các services khác để sync CQRS Read Model với latest patient/doctor data.

### Event Sources
1. **Scheduling Service** (self) - Appointment events
2. **Patient Registry Service** - Patient events
3. **Provider Staff Service** - Doctor/Staff events

### Event Bus
- **Technology**: RabbitMQ
- **Exchange**: `hospital.events` (topic exchange)
- **Pattern**: Publish-Subscribe

---

## 📊 EVENT SUBSCRIPTIONS

### 1. AppointmentScheduled
**Source**: Scheduling Service (self)  
**Queue**: `scheduling-service.appointment.scheduled`  
**Routing Key**: `appointment.scheduled`

**Purpose**: Create read model entry khi appointment được scheduled

**Event Data**:
```typescript
{
  eventId: string;
  eventType: 'appointment.scheduled';
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
  appointmentTime: string;
  durationMinutes: number;
  type: string;
  priority: string;
  status: string;
  consultationFee: number;
  // ...
}
```

**Handler**: `AppointmentScheduledEventHandler`
- Fetches patient data from Patient Service
- Fetches doctor data from Provider Service
- Creates entry in `appointment_read_model` table

---

### 2. PatientUpdated
**Source**: Patient Registry Service  
**Queue**: `scheduling-service.patient.updated`  
**Routing Key**: `patient.updated`

**Purpose**: Sync patient data cho all appointments

**Event Data**:
```typescript
{
  eventId: string;
  eventType: 'patient.updated';
  patientId: string;
  updatedFields: string[];
  newValues: {
    fullName?: string;
    phone?: string;
    email?: string;
    // ...
  };
}
```

**Handler**: `PatientUpdatedEventHandler`
- Updates `patient_*` columns cho ALL appointments với this patientId
- Updates `synced_at` timestamp

---

### 3. PatientRegistered
**Source**: Patient Registry Service  
**Queue**: `scheduling-service.patient.registered`  
**Routing Key**: `patient.registered`

**Purpose**: Initial sync khi patient được registered

**Event Data**: Same as PatientUpdated

**Handler**: `PatientUpdatedEventHandler` (reused)

---

### 4. StaffUpdated
**Source**: Provider Staff Service  
**Queue**: `scheduling-service.staff.updated`  
**Routing Key**: `staff.updated`

**Purpose**: Sync doctor data cho all appointments

**Event Data**:
```typescript
{
  eventId: string;
  eventType: 'staff.updated';
  staffId: string;
  staffType: 'doctor' | 'nurse';
  updatedFields: string[];
  newValues: {
    fullName?: string;
    specialization?: string;
    department?: string;
    // ...
  };
}
```

**Handler**: `DoctorUpdatedEventHandler`
- Checks if staffType === 'doctor' (skips nurses)
- Updates `doctor_*` columns cho ALL appointments với this doctorId
- Updates `synced_at` timestamp

---

### 5. StaffRegistered
**Source**: Provider Staff Service  
**Queue**: `scheduling-service.staff.registered`  
**Routing Key**: `staff.registered`

**Purpose**: Initial sync khi doctor được registered

**Event Data**: Same as StaffUpdated

**Handler**: `DoctorUpdatedEventHandler` (reused)

---

### 6. AppointmentStatusChanged
**Source**: Scheduling Service (self)  
**Queue**: `scheduling-service.appointment.status.changed`  
**Routing Key**: `appointment.status.changed`

**Purpose**: Update appointment status trong read model

**Event Data**:
```typescript
{
  eventId: string;
  eventType: 'appointment.status.changed';
  appointmentId: string;
  newStatus: string;
}
```

**Handler**: `AppointmentStatusChangedEventHandler`
- Updates `status` column trong read model

---

### 7. AppointmentCancelled
**Source**: Scheduling Service (self)  
**Queue**: `scheduling-service.appointment.cancelled`  
**Routing Key**: `appointment.cancelled`

**Purpose**: Mark appointment as cancelled trong read model

**Event Data**:
```typescript
{
  eventId: string;
  eventType: 'appointment.cancelled';
  appointmentId: string;
}
```

**Handler**: `AppointmentCancelledEventHandler`
- Updates `status` to 'cancelled' trong read model

---

## 🚀 SETUP

### 1. Environment Variables

Add to `.env`:
```env
# RabbitMQ Configuration
RABBITMQ_URL=amqp://admin:admin@localhost:5673
RABBITMQ_EXCHANGE=hospital.events
```

### 2. Start RabbitMQ

```bash
# Using Docker Compose
cd backend/services-v2
docker-compose -f docker-compose.v2.yml up -d rabbitmq-v2
```

### 3. Verify RabbitMQ

```bash
# Check RabbitMQ is running
curl http://localhost:15673

# Login to management UI
# URL: http://localhost:15673
# Username: admin
# Password: admin
```

### 4. Start Service

```bash
cd backend/services-v2/scheduling-service
npm run dev
```

**Expected logs**:
```
[DI] Initializing DI Container...
[DI] ✅ Repositories initialized
[DI] ✅ External services initialized
[DI] ✅ Use cases initialized
[DI] ✅ Queries initialized
[DI] ✅ Event handlers initialized
[DI] ✅ Event subscriptions initialized
[DI] ✅ Controllers initialized
[DI] ✅ DI Container ready

[Main] Connecting event subscriptions...
[EventSubscriptions] Connecting to event bus...
✅ Event Bus connected: scheduling-service
[EventSubscriptions] Setting up subscriptions...
[EventSubscriptions] ✅ Subscribed to AppointmentScheduled
[EventSubscriptions] ✅ Subscribed to PatientUpdated
[EventSubscriptions] ✅ Subscribed to PatientRegistered
[EventSubscriptions] ✅ Subscribed to StaffUpdated
[EventSubscriptions] ✅ Subscribed to StaffRegistered
[EventSubscriptions] ✅ Subscribed to AppointmentStatusChanged
[EventSubscriptions] ✅ Subscribed to AppointmentCancelled
[EventSubscriptions] ✅ All subscriptions ready
[Main] ✅ Event subscriptions connected
```

---

## 🔍 MONITORING

### Check RabbitMQ Queues

**Management UI**: http://localhost:15673

**Queues to monitor**:
- `scheduling-service.appointment.scheduled`
- `scheduling-service.patient.updated`
- `scheduling-service.patient.registered`
- `scheduling-service.staff.updated`
- `scheduling-service.staff.registered`
- `scheduling-service.appointment.status.changed`
- `scheduling-service.appointment.cancelled`

### Check Event Processing

**Logs**:
```
📥 Event received: PatientUpdated (event-123)
[ReadModel] Processing PatientUpdatedEvent: PAT-202501-001
[ReadModel] Updated 3 appointments for patient: PAT-202501-001
✅ Event processed: PatientUpdated (event-123)
```

### Check Sync Status

```sql
-- Check last sync time
SELECT 
  appointment_id,
  patient_full_name,
  doctor_full_name,
  synced_at,
  EXTRACT(EPOCH FROM (NOW() - synced_at)) as sync_lag_seconds
FROM scheduling_schema.appointment_read_model
ORDER BY synced_at DESC
LIMIT 10;
```

---

## 🧪 TESTING

### Test Event Publishing

```bash
# From Patient Service
curl -X POST http://localhost:3023/api/patients/:id \
  -H "Content-Type: application/json" \
  -d '{"fullName": "Updated Name"}'

# Check Scheduling Service logs for event processing
```

### Test Event Handling

```typescript
// Unit test
describe('PatientUpdatedEventHandler', () => {
  it('should update patient data for all appointments', async () => {
    const event = {
      eventId: 'event-123',
      eventType: 'patient.updated',
      patientId: 'PAT-202501-001',
      newValues: {
        fullName: 'Updated Name'
      }
    };

    await handler.handle(event);

    expect(mockRepo.updatePatientData).toHaveBeenCalledWith(
      'PAT-202501-001',
      expect.objectContaining({
        patientFullName: 'Updated Name'
      })
    );
  });
});
```

---

## 🔧 TROUBLESHOOTING

### Issue: Events not being received

**Cause**: RabbitMQ not running hoặc connection failed

**Solution**:
1. Check RabbitMQ: `docker ps | grep rabbitmq`
2. Check logs: `docker logs hospital-rabbitmq-v2`
3. Verify connection: Check service logs for "Event Bus connected"

### Issue: Events received but not processed

**Cause**: Handler error hoặc database connection issue

**Solution**:
1. Check service logs for error messages
2. Verify database connection
3. Check handler implementation

### Issue: Duplicate event processing

**Cause**: Multiple service instances hoặc queue not properly configured

**Solution**:
1. Ensure unique queue names per service instance
2. Check RabbitMQ queue consumers
3. Verify message acknowledgment

### Issue: Events stuck in queue

**Cause**: Handler throwing errors, messages being requeued

**Solution**:
1. Check dead letter queue
2. Review error logs
3. Fix handler errors
4. Manually purge queue if needed

---

## 📊 ARCHITECTURE

### Event Flow

```
Patient Service
  ↓ (publishes)
PatientUpdatedEvent
  ↓ (RabbitMQ)
hospital.events exchange
  ↓ (routes to)
scheduling-service.patient.updated queue
  ↓ (consumes)
Scheduling Service
  ↓ (handles)
PatientUpdatedEventHandler
  ↓ (updates)
appointment_read_model table
```

### Error Handling

1. **Retry Logic**: Failed events are retried up to 3 times
2. **Dead Letter Queue**: After 3 retries, events move to DLQ
3. **Graceful Degradation**: Service continues even if event processing fails

---

## ✅ BEST PRACTICES

1. **Idempotency**: Event handlers should be idempotent
2. **Error Handling**: Always catch and log errors
3. **Monitoring**: Track event processing metrics
4. **Testing**: Write tests for all event handlers
5. **Documentation**: Document all event types and handlers

---

**Author**: Hospital Management Team  
**Date**: 2025-01-12  
**Version**: 3.0.0

