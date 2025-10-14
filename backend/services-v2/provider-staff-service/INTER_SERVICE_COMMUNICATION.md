# Provider/Staff Service - Inter-Service Communication

## Overview

Provider/Staff Service giao tiếp với các services khác trong hệ thống Hospital Management V2 thông qua 2 patterns chính:
1. **Synchronous Communication** - HTTP/REST API qua API Gateway
2. **Asynchronous Communication** - Event-Driven Architecture qua RabbitMQ

---

## 1. SYNCHRONOUS COMMUNICATION (HTTP/REST)

### 1.1. API Gateway Integration

**Pattern**: All external requests go through API Gateway

```
Client → API Gateway → Provider/Staff Service
```

**API Gateway Configuration**:
```typescript
// api-gateway/src/main.ts
ServiceRoute.create({
  serviceName: 'provider-staff-service',
  baseUrl: process.env.PROVIDER_STAFF_SERVICE_URL || 'http://provider-staff-service:3002',
  pathPrefix: '/api/v1/providers',
  requiresAuth: true,
  requiredPermissions: ['provider:read', 'provider:write']
})
```

**Request Flow**:
1. Client gửi request đến API Gateway: `POST /api/v1/providers`
2. API Gateway authenticate JWT token (via Identity Service)
3. API Gateway authorize permissions
4. API Gateway proxy request đến Provider/Staff Service: `http://provider-staff-service:3002/api/v1/staff`
5. Provider/Staff Service xử lý và trả response
6. API Gateway forward response về client

**Environment Variables**:
```bash
# API Gateway
PROVIDER_STAFF_SERVICE_URL=http://provider-staff-service:3002

# Provider/Staff Service
PORT=3002
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3101
```

### 1.2. Authentication Flow

**Pattern**: JWT Token Verification

```typescript
// Request Headers
Authorization: Bearer <jwt_token>

// JWT Payload (from Identity Service)
{
  "userId": "uuid",
  "email": "doctor@example.com",
  "roles": ["doctor", "admin"],
  "permissions": ["provider:read", "provider:write", "staff:manage"],
  "sessionId": "uuid",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Provider/Staff Service sử dụng user context**:
```typescript
// src/presentation/middleware/ErrorHandlingMiddleware.ts
export function getUserId(req: any): string {
  return req.user?.userId || req.user?.id || 'system';
}

export function getUserRole(req: any): string {
  return req.user?.roles?.[0] || req.user?.role || 'patient';
}
```

### 1.3. Service-to-Service Communication

**Pattern**: Direct HTTP calls (when needed)

**Example**: Provider/Staff Service → Identity Service
```typescript
// Verify user exists before creating staff profile
const identityServiceUrl = process.env.IDENTITY_SERVICE_URL || 'http://identity-service:3001';
const response = await fetch(`${identityServiceUrl}/api/v1/users/${userId}`);
```

**Example**: Scheduling Service → Provider/Staff Service
```typescript
// Get doctor availability
const providerServiceUrl = process.env.PROVIDER_STAFF_SERVICE_URL || 'http://provider-staff-service:3002';
const response = await fetch(`${providerServiceUrl}/api/v1/staff/${staffId}`);
```

---

## 2. ASYNCHRONOUS COMMUNICATION (EVENTS)

### 2.1. Event Bus Architecture

**Technology**: RabbitMQ  
**Exchange**: `hospital.events`  
**Exchange Type**: Topic  
**Routing Key Pattern**: `provider.{aggregate}.{action}`

**Configuration**:
```typescript
// shared/events/EventBusConfiguration.ts
'provider-staff-service': {
  serviceName: 'provider-staff-service',
  queueName: 'provider.queue',
  routingKeys: ['provider.*', 'staff.*', 'doctor.*'],
  publishingKeys: [
    'staff.registered',
    'staff.updated',
    'staff.deactivated',
    'doctor.availability.changed'
  ],
  deadLetterQueue: 'provider.queue.dlq'
}
```

### 2.2. Events Published by Provider/Staff Service

#### StaffRegistered Event
```typescript
{
  eventType: 'StaffRegistered',
  eventId: 'uuid',
  aggregateId: 'STAFF-202501-001',
  occurredAt: '2025-01-10T10:00:00Z',
  data: {
    staffId: 'STAFF-202501-001',
    userId: 'uuid',
    staffType: 'doctor',
    fullName: 'Dr. Nguyen Van A',
    department: 'Cardiology',
    licenseNumber: 'BS-12345',
    registrationDate: '2025-01-10T10:00:00Z'
  }
}
```

**Routing Key**: `provider.staff.registered`

**Subscribers**:
- Scheduling Service: Create doctor schedule
- Clinical/EMR Service: Initialize provider profile
- Notifications Service: Send welcome email

#### StaffUpdated Event
```typescript
{
  eventType: 'StaffUpdated',
  eventId: 'uuid',
  aggregateId: 'STAFF-202501-001',
  occurredAt: '2025-01-10T11:00:00Z',
  data: {
    staffId: 'STAFF-202501-001',
    updatedFields: ['consultationFee', 'workSchedule'],
    consultationFee: 600000,
    workSchedule: { ... }
  }
}
```

**Routing Key**: `provider.staff.updated`

**Subscribers**:
- Scheduling Service: Update availability
- Billing Service: Update consultation fee

#### DoctorAvailabilityChanged Event
```typescript
{
  eventType: 'DoctorAvailabilityChanged',
  eventId: 'uuid',
  aggregateId: 'STAFF-202501-001',
  occurredAt: '2025-01-10T12:00:00Z',
  data: {
    staffId: 'STAFF-202501-001',
    isAcceptingNewPatients: false,
    reason: 'Fully booked',
    effectiveDate: '2025-01-15'
  }
}
```

**Routing Key**: `provider.doctor.availability.changed`

**Subscribers**:
- Scheduling Service: Block new appointments
- Notifications Service: Notify patients

### 2.3. Events Subscribed by Provider/Staff Service

#### UserCreated Event (from Identity Service)
```typescript
// Subscribe to user creation events
eventBus.subscribe('UserCreated', async (event) => {
  if (event.data.roleType === 'doctor' || event.data.roleType === 'nurse') {
    // Auto-create staff profile placeholder
    await createStaffProfilePlaceholder(event.data);
  }
});
```

**Routing Key**: `identity.user.created`

#### PatientRegistered Event (from Patient Registry)
```typescript
// Subscribe to patient registration
eventBus.subscribe('PatientRegistered', async (event) => {
  // Update doctor's total patients count
  await updateDoctorPatientCount(event.data.assignedDoctorId);
});
```

**Routing Key**: `patient.patient.registered`

### 2.4. Event Publishing Implementation

**File**: `src/infrastructure/messaging/SupabaseEventBus.ts`

```typescript
export class SupabaseEventBus implements IEventBus {
  async publish(event: DomainEvent): Promise<void> {
    // Store event in Supabase
    await this.supabaseClient
      .from('domain_events')
      .insert({
        event_id: event.eventId,
        event_type: event.eventType,
        aggregate_id: event.aggregateId,
        occurred_at: event.occurredAt,
        payload: event
      });

    // Publish to RabbitMQ (if configured)
    if (this.rabbitMQPublisher) {
      await this.rabbitMQPublisher.publish(event);
    }

    // Notify local handlers
    const handlers = this.handlers.get(event.eventType) || [];
    for (const handler of handlers) {
      await handler.handle(event);
    }
  }
}
```

---

## 3. SERVICE DEPENDENCIES

### 3.1. Upstream Dependencies (Services Provider/Staff depends on)

#### Identity Service
- **Purpose**: User authentication, authorization
- **Communication**: HTTP (via API Gateway)
- **Endpoints Used**:
  - `GET /api/v1/users/:userId` - Verify user exists
  - `POST /api/v1/auth/verify-token` - Verify JWT token
- **Events Subscribed**: `UserCreated`, `UserDeactivated`

### 3.2. Downstream Dependencies (Services that depend on Provider/Staff)

#### Scheduling Service
- **Purpose**: Doctor schedules, appointments
- **Communication**: HTTP + Events
- **Endpoints Called**:
  - `GET /api/v1/staff/:staffId` - Get doctor info
  - `GET /api/v1/staff/search` - Find available doctors
- **Events Subscribed**: `StaffRegistered`, `DoctorAvailabilityChanged`

#### Clinical/EMR Service
- **Purpose**: Medical records, prescriptions
- **Communication**: HTTP + Events
- **Endpoints Called**:
  - `GET /api/v1/staff/:staffId` - Get doctor info
- **Events Subscribed**: `StaffRegistered`, `StaffUpdated`

#### Billing Service
- **Purpose**: Invoices, payments
- **Communication**: Events
- **Events Subscribed**: `StaffUpdated` (for consultation fee changes)

---

## 4. DOCKER NETWORKING

### 4.1. Docker Compose Configuration

```yaml
# docker-compose.yml
services:
  provider-staff-service:
    container_name: provider-staff-service
    networks:
      - hospital-network
    ports:
      - "3002:3002"
    environment:
      - PORT=3002
      - RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672
      - REDIS_URL=redis://redis-v2:6379
      - IDENTITY_SERVICE_URL=http://identity-service:3001

  api-gateway:
    depends_on:
      - provider-staff-service
    environment:
      - PROVIDER_STAFF_SERVICE_URL=http://provider-staff-service:3002

networks:
  hospital-network:
    driver: bridge
```

### 4.2. Service Discovery

**Internal URLs** (within Docker network):
- `http://provider-staff-service:3002`
- `http://identity-service:3001`
- `http://patient-registry-service:3003`

**External URLs** (from host):
- `http://localhost:3002` (Provider/Staff Service)
- `http://localhost:3101` (API Gateway)

---

## 5. ERROR HANDLING & RESILIENCE

### 5.1. Circuit Breaker Pattern

```typescript
// API Gateway implements circuit breaker
const circuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 30000,
  monitoringPeriod: 60000
};
```

### 5.2. Retry Logic

```typescript
// Event publishing with retry
const publisherConfig = {
  enableRetry: true,
  maxRetries: 3,
  retryDelayMs: 1000
};
```

### 5.3. Fallback Strategies

- **Service Unavailable**: Return cached data
- **Event Publishing Failed**: Store in dead letter queue
- **Timeout**: Return partial data with warning

---

## 6. MONITORING & OBSERVABILITY

### 6.1. Health Checks

```typescript
// GET /health
{
  "service": "provider-staff-service",
  "status": "healthy",
  "dependencies": {
    "database": "healthy",
    "rabbitmq": "healthy",
    "redis": "healthy"
  }
}
```

### 6.2. Logging

```typescript
logger.info('Event published', {
  eventType: 'StaffRegistered',
  staffId: 'STAFF-202501-001',
  routingKey: 'provider.staff.registered'
});
```

---

## 7. SECURITY CONSIDERATIONS

1. **Authentication**: All requests authenticated via JWT
2. **Authorization**: Permission-based access control
3. **Data Encryption**: TLS for HTTP, encrypted RabbitMQ connections
4. **Event Validation**: Validate event payloads before processing
5. **Rate Limiting**: Implemented at API Gateway level

---

**Version**: 2.0.0  
**Last Updated**: 2025-01-10  
**Author**: Hospital Management Team

