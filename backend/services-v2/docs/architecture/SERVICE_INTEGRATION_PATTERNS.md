# Service Integration Patterns - Hospital Management System V2

**Version**: 2.0.0  
**Date**: 2025-01-07  
**Status**: ✅ Complete  
**Purpose**: Định nghĩa patterns và best practices cho service integration

---

## 📋 Table of Contents

1. [Integration Patterns Overview](#1-integration-patterns-overview)
2. [Synchronous Communication (REST API)](#2-synchronous-communication-rest-api)
3. [Asynchronous Communication (Events)](#3-asynchronous-communication-events)
4. [Data Flow Examples](#4-data-flow-examples)
5. [Error Handling](#5-error-handling)
6. [Best Practices](#6-best-practices)

---

## 1. INTEGRATION PATTERNS OVERVIEW

### 1.1. Communication Patterns

```
┌─────────────────────────────────────────────────────────────┐
│                  COMMUNICATION PATTERNS                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. SYNCHRONOUS (REST API)                                 │
│     - Request/Response                                      │
│     - Immediate feedback                                    │
│     - Use for: Queries, Critical operations                │
│                                                             │
│  2. ASYNCHRONOUS (Events via RabbitMQ)                     │
│     - Fire and forget                                       │
│     - Eventual consistency                                  │
│     - Use for: Notifications, Audit logs, Analytics        │
│                                                             │
│  3. SHARED KERNEL                                          │
│     - Shared domain primitives                             │
│     - Value objects                                         │
│     - Use for: Common types, Validation rules              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2. When to Use Each Pattern

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Synchronous REST** | Need immediate response | Get patient info, Validate user |
| **Asynchronous Events** | Don't need immediate response | Send notification, Log audit |
| **Shared Kernel** | Common domain concepts | Email, PhoneNumber, PatientId |

---

## 2. SYNCHRONOUS COMMUNICATION (REST API)

### 2.1. Pattern: Service-to-Service API Call

#### Example 1: Scheduling Service → Patient Registry Service

**Scenario**: When booking an appointment, need to validate patient exists

```typescript
// ❌ BAD: Direct database access
async bookAppointment(patientId: string, doctorId: string) {
  // Don't do this!
  const patient = await supabase
    .from('patient_schema.patient_profiles')
    .select('*')
    .eq('id', patientId);
}

// ✅ GOOD: API call to Patient Registry Service
async bookAppointment(patientId: string, doctorId: string) {
  // Call Patient Registry Service API
  const patient = await this.patientRegistryClient.getPatient(patientId);
  
  if (!patient) {
    throw new Error('Patient not found');
  }
  
  // Proceed with booking
  const appointment = await this.appointmentRepository.create({
    patientId,
    doctorId,
    // ...
  });
  
  return appointment;
}
```

#### Example 2: Clinical/EMR Service → Provider/Staff Service

**Scenario**: When creating medical record, need to validate doctor exists

```typescript
// ✅ GOOD: API call to Provider/Staff Service
async createMedicalRecord(patientId: string, doctorId: string, data: any) {
  // Validate doctor exists
  const doctor = await this.providerStaffClient.getDoctor(doctorId);
  
  if (!doctor) {
    throw new Error('Doctor not found');
  }
  
  // Create medical record
  const record = await this.medicalRecordRepository.create({
    patientId,
    doctorId,
    ...data
  });
  
  return record;
}
```

### 2.2. API Client Pattern

```typescript
// shared/infrastructure/clients/PatientRegistryClient.ts
export class PatientRegistryClient {
  private baseUrl: string;
  private httpClient: HttpClient;
  
  constructor() {
    this.baseUrl = process.env.PATIENT_REGISTRY_URL || 'http://localhost:3023';
    this.httpClient = new HttpClient();
  }
  
  async getPatient(patientId: string): Promise<Patient | null> {
    try {
      const response = await this.httpClient.get(
        `${this.baseUrl}/api/v1/patients/${patientId}`
      );
      return response.data;
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }
  
  async searchPatients(query: string): Promise<Patient[]> {
    const response = await this.httpClient.get(
      `${this.baseUrl}/api/v1/patients/search`,
      { params: { q: query } }
    );
    return response.data;
  }
}
```

### 2.3. Circuit Breaker Pattern

```typescript
// Use circuit breaker for resilience
import { CircuitBreaker } from '../resilience/CircuitBreaker';

export class PatientRegistryClient {
  private circuitBreaker: CircuitBreaker;
  
  constructor() {
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
    });
  }
  
  async getPatient(patientId: string): Promise<Patient | null> {
    return await this.circuitBreaker.execute(async () => {
      const response = await this.httpClient.get(
        `${this.baseUrl}/api/v1/patients/${patientId}`
      );
      return response.data;
    });
  }
}
```

---

## 3. ASYNCHRONOUS COMMUNICATION (EVENTS)

### 3.1. Pattern: Domain Events via RabbitMQ

#### Example 1: Patient Registry → Clinical/EMR Service

**Scenario**: When patient is registered, notify Clinical/EMR to create initial record

```typescript
// Patient Registry Service - Publish event
async registerPatient(data: RegisterPatientRequest) {
  // Create patient
  const patient = await this.patientRepository.create(data);
  
  // Publish domain event
  await this.eventBus.publish('patient.registered', {
    patientId: patient.id,
    fullName: patient.fullName,
    dateOfBirth: patient.dateOfBirth,
    registeredAt: new Date(),
  });
  
  return patient;
}

// Clinical/EMR Service - Subscribe to event
@EventHandler('patient.registered')
async handlePatientRegistered(event: PatientRegisteredEvent) {
  // Create initial medical record
  await this.medicalRecordRepository.create({
    patientId: event.patientId,
    status: 'active',
    createdAt: event.registeredAt,
  });
  
  console.log(`Initial medical record created for patient ${event.patientId}`);
}
```

#### Example 2: Scheduling → Notifications Service

**Scenario**: When appointment is booked, send notification to patient

```typescript
// Scheduling Service - Publish event
async bookAppointment(data: BookAppointmentRequest) {
  // Create appointment
  const appointment = await this.appointmentRepository.create(data);
  
  // Publish domain event
  await this.eventBus.publish('appointment.booked', {
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    appointmentDate: appointment.appointmentDate,
    bookedAt: new Date(),
  });
  
  return appointment;
}

// Notifications Service - Subscribe to event
@EventHandler('appointment.booked')
async handleAppointmentBooked(event: AppointmentBookedEvent) {
  // Get patient info
  const patient = await this.patientRegistryClient.getPatient(event.patientId);
  
  // Send notification
  await this.notificationService.sendEmail({
    to: patient.email,
    template: 'appointment-confirmation',
    data: {
      patientName: patient.fullName,
      appointmentDate: event.appointmentDate,
      // ...
    },
  });
  
  console.log(`Notification sent to patient ${event.patientId}`);
}
```

### 3.2. Event Bus Implementation

```typescript
// shared/infrastructure/events/RabbitMQEventBus.ts
export class RabbitMQEventBus implements IEventBus {
  private connection: Connection;
  private channel: Channel;
  
  async publish(eventName: string, data: any): Promise<void> {
    const exchange = 'hospital.events';
    
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    
    const message = JSON.stringify({
      eventName,
      data,
      timestamp: new Date(),
    });
    
    this.channel.publish(exchange, eventName, Buffer.from(message), {
      persistent: true,
    });
    
    console.log(`Event published: ${eventName}`);
  }
  
  async subscribe(eventName: string, handler: EventHandler): Promise<void> {
    const exchange = 'hospital.events';
    const queue = `${process.env.SERVICE_NAME}.${eventName}`;
    
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(queue, exchange, eventName);
    
    this.channel.consume(queue, async (msg) => {
      if (msg) {
        const event = JSON.parse(msg.content.toString());
        await handler(event.data);
        this.channel.ack(msg);
      }
    });
    
    console.log(`Subscribed to event: ${eventName}`);
  }
}
```

---

## 4. DATA FLOW EXAMPLES

### 4.1. Complete Workflow: Patient Registration → Appointment → Consultation

```
┌─────────────────────────────────────────────────────────────┐
│              PATIENT JOURNEY DATA FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. PATIENT REGISTRATION                                    │
│     Frontend → Identity Service (register user)            │
│     Frontend → Patient Registry (register patient)         │
│     Patient Registry → Event: patient.registered           │
│     Clinical/EMR ← Event: Create initial record            │
│                                                             │
│  2. APPOINTMENT BOOKING                                     │
│     Frontend → Scheduling Service (book appointment)       │
│     Scheduling → Patient Registry (validate patient)       │
│     Scheduling → Provider/Staff (validate doctor)          │
│     Scheduling → Event: appointment.booked                 │
│     Notifications ← Event: Send confirmation email         │
│                                                             │
│  3. CONSULTATION                                           │
│     Frontend → Clinical/EMR (create medical record)        │
│     Clinical/EMR → Patient Registry (get patient info)     │
│     Clinical/EMR → Provider/Staff (get doctor info)        │
│     Clinical/EMR → Event: medical.record.created           │
│     Billing ← Event: Generate invoice                      │
│                                                             │
│  4. BILLING                                                │
│     Billing Service (generate invoice)                     │
│     Billing → Event: invoice.generated                     │
│     Notifications ← Event: Send invoice email              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2. Sequence Diagram: Book Appointment

```
Patient → Frontend: Book appointment
Frontend → Identity: Validate token
Identity → Frontend: Token valid

Frontend → Scheduling: POST /appointments
Scheduling → Patient Registry: GET /patients/:id
Patient Registry → Scheduling: Patient data

Scheduling → Provider/Staff: GET /doctors/:id
Provider/Staff → Scheduling: Doctor data

Scheduling → Scheduling: Create appointment
Scheduling → RabbitMQ: Publish appointment.booked

RabbitMQ → Notifications: appointment.booked event
Notifications → Patient: Send confirmation email

Scheduling → Frontend: Appointment created
Frontend → Patient: Show confirmation
```

---

## 5. ERROR HANDLING

### 5.1. Synchronous Error Handling

```typescript
// ✅ GOOD: Proper error handling
async bookAppointment(data: BookAppointmentRequest) {
  try {
    // Validate patient
    const patient = await this.patientRegistryClient.getPatient(data.patientId);
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }
    
    // Validate doctor
    const doctor = await this.providerStaffClient.getDoctor(data.doctorId);
    if (!doctor) {
      throw new NotFoundError('Doctor not found');
    }
    
    // Create appointment
    const appointment = await this.appointmentRepository.create(data);
    return appointment;
    
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error; // Re-throw domain errors
    }
    
    if (error instanceof CircuitBreakerOpenError) {
      throw new ServiceUnavailableError('Patient Registry Service is unavailable');
    }
    
    // Log unexpected errors
    console.error('Error booking appointment:', error);
    throw new InternalServerError('Failed to book appointment');
  }
}
```

### 5.2. Asynchronous Error Handling

```typescript
// ✅ GOOD: Retry logic for event handlers
@EventHandler('appointment.booked')
async handleAppointmentBooked(event: AppointmentBookedEvent) {
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // Send notification
      await this.notificationService.sendEmail({
        to: event.patientEmail,
        template: 'appointment-confirmation',
        data: event,
      });
      
      console.log(`Notification sent successfully`);
      return; // Success
      
    } catch (error) {
      retries++;
      console.error(`Failed to send notification (attempt ${retries}):`, error);
      
      if (retries >= maxRetries) {
        // Move to dead letter queue
        await this.eventBus.publishToDeadLetter('appointment.booked', event);
        throw error;
      }
      
      // Wait before retry
      await this.sleep(1000 * retries); // Exponential backoff
    }
  }
}
```

---

## 6. BEST PRACTICES

### 6.1. API Design Best Practices

```typescript
// ✅ GOOD: Consistent API design
class PatientRegistryClient {
  // Use consistent naming
  async getPatient(id: string): Promise<Patient | null> { }
  async searchPatients(query: string): Promise<Patient[]> { }
  async createPatient(data: CreatePatientRequest): Promise<Patient> { }
  async updatePatient(id: string, data: UpdatePatientRequest): Promise<Patient> { }
  
  // Use proper HTTP methods
  // GET for queries
  // POST for creation
  // PUT/PATCH for updates
  // DELETE for deletion
}
```

### 6.2. Event Design Best Practices

```typescript
// ✅ GOOD: Well-designed events
interface PatientRegisteredEvent {
  eventId: string;           // Unique event ID
  eventName: 'patient.registered';
  timestamp: Date;           // When event occurred
  version: '1.0';           // Event schema version
  
  // Event data
  data: {
    patientId: string;
    fullName: string;
    dateOfBirth: Date;
    registeredBy: string;
  };
  
  // Metadata
  metadata: {
    correlationId: string;  // For tracing
    causationId: string;    // What caused this event
  };
}
```

### 6.3. Caching Best Practices

```typescript
// ✅ GOOD: Cache frequently accessed data
class PatientRegistryClient {
  private cache: Cache;
  
  async getPatient(id: string): Promise<Patient | null> {
    // Check cache first
    const cached = await this.cache.get(`patient:${id}`);
    if (cached) {
      return cached;
    }
    
    // Fetch from API
    const patient = await this.httpClient.get(`/patients/${id}`);
    
    // Cache for 5 minutes
    await this.cache.set(`patient:${id}`, patient, 300);
    
    return patient;
  }
}
```

### 6.4. Idempotency Best Practices

```typescript
// ✅ GOOD: Idempotent event handlers
@EventHandler('appointment.booked')
async handleAppointmentBooked(event: AppointmentBookedEvent) {
  // Check if already processed
  const processed = await this.eventLogRepository.exists(event.eventId);
  if (processed) {
    console.log(`Event ${event.eventId} already processed, skipping`);
    return;
  }
  
  // Process event
  await this.notificationService.sendEmail({ ... });
  
  // Mark as processed
  await this.eventLogRepository.create({
    eventId: event.eventId,
    eventName: event.eventName,
    processedAt: new Date(),
  });
}
```

---

## 📊 SUMMARY

### Integration Patterns Summary

| Pattern | When to Use | Pros | Cons |
|---------|------------|------|------|
| **Synchronous REST** | Need immediate response | Simple, Immediate feedback | Tight coupling, Latency |
| **Asynchronous Events** | Don't need immediate response | Loose coupling, Scalable | Eventual consistency, Complex |
| **Shared Kernel** | Common domain concepts | Consistency, Reusability | Shared dependency |

### Key Principles

1. ✅ **Use REST for queries and critical operations**
2. ✅ **Use events for notifications and eventual consistency**
3. ✅ **Never access other services' databases directly**
4. ✅ **Implement circuit breakers for resilience**
5. ✅ **Design idempotent event handlers**
6. ✅ **Cache frequently accessed data**
7. ✅ **Use proper error handling and retries**

---

**Author**: Hospital Management Team  
**Last Updated**: 2025-01-07  
**Version**: 2.0.0

