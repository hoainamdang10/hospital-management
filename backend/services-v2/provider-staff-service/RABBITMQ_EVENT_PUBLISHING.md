# RabbitMQ Event Publishing - Provider/Staff Service

## Overview

Provider/Staff Service publishes domain events to RabbitMQ for inter-service communication following event-driven architecture patterns.

---

## Architecture

### Components

1. **RabbitMQEventPublisher**: Infrastructure component for publishing events to RabbitMQ
2. **RabbitMQStaffEventHandler**: Domain event handler that converts domain events to integration events
3. **IntegrationEvents**: Factory functions for creating integration events
4. **Domain Events**: Events raised by domain aggregates

### Flow

```
Domain Aggregate (Staff)
  ↓ Raises Domain Event
RabbitMQStaffEventHandler
  ↓ Converts to Integration Event
RabbitMQEventPublisher
  ↓ Publishes to RabbitMQ
RabbitMQ Exchange (hospital.events)
  ↓ Routes by routing key
Subscriber Services (Scheduling, Clinical, Billing)
```

---

## Configuration

### Environment Variables

```bash
# RabbitMQ Connection
RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672

# Exchange Configuration
RABBITMQ_EXCHANGE=hospital.events
RABBITMQ_EXCHANGE_TYPE=topic
RABBITMQ_DURABLE=true
RABBITMQ_AUTO_DELETE=false

# Publisher Configuration
RABBITMQ_ENABLE_RETRY=true
RABBITMQ_MAX_RETRIES=3
RABBITMQ_RETRY_DELAY_MS=1000
RABBITMQ_ENABLE_LOGGING=true
```

### RabbitMQ Setup

**Exchange**: `hospital.events`  
**Exchange Type**: `topic`  
**Durable**: `true`  
**Auto Delete**: `false`

---

## Events Published

### 1. StaffRegistered

**Routing Key**: `provider.staff.registered`

**Event Data**:
```typescript
{
  eventId: string;
  eventType: 'provider.staff.registered';
  aggregateId: string; // staffId
  aggregateType: 'Staff';
  occurredAt: Date;
  serviceName: 'provider-staff-service';
  eventData: {
    staffId: string;
    userId: string;
    staffType: 'doctor' | 'nurse' | 'technician' | 'pharmacist' | 'receptionist' | 'admin';
    fullName: string;
    department?: string;
    specialization?: string;
    licenseNumber?: string;
    registrationDate: string;
  };
  metadata: {
    priority: 'normal';
    complianceLevel: 'hipaa';
    containsPHI: false;
    eventCategory: 'provider_staff';
    eventSubcategory: 'staff_registration';
    vietnameseDescription: 'Nhân viên y tế mới được đăng ký vào hệ thống';
  };
}
```

**Subscribers**:
- Scheduling Service: Create doctor schedule
- Clinical/EMR Service: Initialize provider profile
- Notifications Service: Send welcome email

---

### 2. StaffUpdated

**Routing Key**: `provider.staff.updated`

**Event Data**:
```typescript
{
  eventId: string;
  eventType: 'provider.staff.updated';
  aggregateId: string; // staffId
  aggregateType: 'Staff';
  occurredAt: Date;
  serviceName: 'provider-staff-service';
  eventData: {
    staffId: string;
    userId: string;
    updatedFields: string[];
    consultationFee?: number;
    workSchedule?: any;
    status?: string;
  };
  metadata: {
    priority: 'normal';
    complianceLevel: 'hipaa';
    containsPHI: false;
    eventCategory: 'provider_staff';
    eventSubcategory: 'staff_update';
    vietnameseDescription: 'Thông tin nhân viên y tế được cập nhật';
  };
}
```

**Subscribers**:
- Scheduling Service: Update doctor availability
- Billing Service: Update consultation fee
- Clinical/EMR Service: Update provider profile

---

### 3. DoctorAvailabilityChanged

**Routing Key**: `provider.doctor.availability.changed`

**Event Data**:
```typescript
{
  eventId: string;
  eventType: 'provider.doctor.availability.changed';
  aggregateId: string; // staffId
  aggregateType: 'Staff';
  occurredAt: Date;
  serviceName: 'provider-staff-service';
  eventData: {
    staffId: string;
    isAcceptingNewPatients: boolean;
    reason?: string;
    effectiveDate?: string;
  };
  metadata: {
    priority: 'high';
    complianceLevel: 'hipaa';
    containsPHI: false;
    eventCategory: 'provider_staff';
    eventSubcategory: 'availability_change';
    vietnameseDescription: 'Trạng thái nhận bệnh nhân của bác sĩ thay đổi';
  };
}
```

**Subscribers**:
- Scheduling Service: Block/unblock new appointments
- Notifications Service: Notify patients

---

### 4. StaffStatusChanged

**Routing Key**: `provider.staff.status.changed`

**Event Data**:
```typescript
{
  eventId: string;
  eventType: 'provider.staff.status.changed';
  aggregateId: string; // staffId
  aggregateType: 'Staff';
  occurredAt: Date;
  serviceName: 'provider-staff-service';
  eventData: {
    staffId: string;
    userId: string;
    previousStatus: string;
    newStatus: string;
    reason?: string;
    changedBy: string;
  };
  metadata: {
    priority: 'high';
    complianceLevel: 'hipaa';
    containsPHI: false;
    eventCategory: 'provider_staff';
    eventSubcategory: 'status_change';
    vietnameseDescription: 'Trạng thái nhân viên y tế thay đổi';
  };
}
```

**Subscribers**:
- Scheduling Service: Cancel future appointments
- Identity Service: Update user status
- Notifications Service: Notify relevant parties

---

### 5. StaffCredentialAdded

**Routing Key**: `provider.staff.credential.added`

**Event Data**:
```typescript
{
  eventId: string;
  eventType: 'provider.staff.credential.added';
  aggregateId: string; // staffId
  aggregateType: 'Staff';
  occurredAt: Date;
  serviceName: 'provider-staff-service';
  eventData: {
    staffId: string;
    credentialType: string;
    credentialNumber: string;
    issuedBy: string;
    issuedDate: string;
    expiryDate?: string;
  };
  metadata: {
    priority: 'normal';
    complianceLevel: 'hipaa';
    containsPHI: false;
    eventCategory: 'provider_staff';
    eventSubcategory: 'credential_management';
    vietnameseDescription: 'Chứng chỉ hành nghề mới được thêm vào';
  };
}
```

**Subscribers**:
- Clinical/EMR Service: Update provider qualifications
- Compliance Service: Track certifications

---

### 6. StaffDepartmentAssigned

**Routing Key**: `provider.staff.department.assigned`

**Event Data**:
```typescript
{
  eventId: string;
  eventType: 'provider.staff.department.assigned';
  aggregateId: string; // staffId
  aggregateType: 'Staff';
  occurredAt: Date;
  serviceName: 'provider-staff-service';
  eventData: {
    staffId: string;
    departmentId: string;
    departmentName: string;
    role: string;
    assignedBy: string;
  };
  metadata: {
    priority: 'normal';
    complianceLevel: 'hipaa';
    containsPHI: false;
    eventCategory: 'provider_staff';
    eventSubcategory: 'department_assignment';
    vietnameseDescription: 'Nhân viên được phân công vào khoa';
  };
}
```

**Subscribers**:
- Scheduling Service: Update department schedules
- Notifications Service: Notify department head

---

## Usage Example

### Publishing Events from Use Cases

```typescript
// In RegisterStaffUseCase
async execute(request: RegisterStaffRequest): Promise<RegisterStaffResponse> {
  // 1. Create staff aggregate
  const staff = Staff.create({...});
  
  // 2. Save to repository
  await this.staffRepository.save(staff);
  
  // 3. Get domain events
  const domainEvents = staff.getDomainEvents();
  
  // 4. Publish events
  for (const event of domainEvents) {
    await this.eventHandler.handle(event);
  }
  
  return { success: true, staffId: staff.id.value };
}
```

---

## Testing

### Unit Tests

```bash
npm run test:unit -- RabbitMQEventPublisher
npm run test:unit -- RabbitMQStaffEventHandler
npm run test:unit -- IntegrationEvents
```

### Integration Tests

```bash
# Start RabbitMQ
docker-compose up -d rabbitmq-v2

# Run integration tests
npm run test:integration -- events
```

---

## Monitoring

### Health Check

```bash
curl http://localhost:3002/health
```

**Response**:
```json
{
  "service": "provider-staff-service",
  "version": "2.0.0",
  "status": "healthy",
  "rabbitmq": {
    "status": "connected",
    "exchange": "hospital.events"
  }
}
```

### RabbitMQ Management UI

Access: `http://localhost:15673`  
Username: `admin`  
Password: `admin`

---

## Troubleshooting

### Connection Issues

```bash
# Check RabbitMQ is running
docker ps | grep rabbitmq

# Check logs
docker logs hospital-rabbitmq-v2

# Test connection
curl http://localhost:15673/api/overview
```

### Event Not Published

1. Check RabbitMQ connection status in health endpoint
2. Check application logs for errors
3. Verify exchange exists in RabbitMQ Management UI
4. Check routing key matches subscriber bindings

---

**Version**: 2.0.0  
**Last Updated**: 2025-01-10  
**Author**: Hospital Management Team

