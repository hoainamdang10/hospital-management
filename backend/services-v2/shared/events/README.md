# Hospital Management System V2 - Event Schema Documentation

> **Comprehensive guide for Identity Service domain events and event-driven architecture**

**Version**: 2.0.0  
**Last Updated**: 2025-01-07  
**Status**: Production-Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Event Catalog](#event-catalog)
3. [Event Payload Structure](#event-payload-structure)
4. [Routing Key Format](#routing-key-format)
5. [Event Versioning Strategy](#event-versioning-strategy)
6. [Consumer Subscription Guide](#consumer-subscription-guide)
7. [Event Publishing Best Practices](#event-publishing-best-practices)
8. [PHI/HIPAA Compliance](#phihipaa-compliance)
9. [TypeScript Type Definitions](#typescript-type-definitions)

---

## Overview

### Architecture Pattern

Hospital Management System V2 uses a **hybrid REST + Event-driven architecture**:

- **REST/gRPC**: Synchronous operations requiring immediate response (login, patient lookup, appointment updates)
- **Event-driven**: Asynchronous background operations (notifications, EMR sync, billing, audit logging)

### Event Bus Configuration

- **Message Broker**: RabbitMQ 3.x
- **Exchange**: `hospital.events` (topic exchange)
- **Exchange Type**: Topic (supports wildcard routing)
- **Durability**: Persistent messages
- **Delivery Mode**: At-least-once delivery

### Event Flow

```
┌─────────────────┐      ┌──────────────┐      ┌─────────────────┐
│ Identity Service│─────▶│   RabbitMQ   │─────▶│ Patient Service │
│  (Publisher)    │      │ hospital.events│      │  (Consumer)     │
└─────────────────┘      └──────────────┘      └─────────────────┘
                                │
                                ├─────▶ Provider Service
                                ├─────▶ Notifications Service
                                └─────▶ Audit Service
```

---

## Event Catalog

### Identity Service Events (15 Total)

| # | Event Name | Routing Key | Aggregate | Version | PHI | Consumers |
|---|-----------|-------------|-----------|---------|-----|-----------|
| 1 | `UserCreatedEvent` | `user.user_created` | User | 1 | ✅ | Patient, Provider, Notifications |
| 2 | `UserUpdatedEvent` | `user.user_updated` | User | 1 | ⚠️ | Patient, Provider, Audit |
| 3 | `UserDeletedEvent` | `user.user_deleted` | User | 1 | ✅ | Patient, Provider, Audit |
| 4 | `UserActivatedEvent` | `user.user_activated` | User | 1 | ✅ | Notifications, Audit |
| 5 | `UserLoggedOutEvent` | `user.user_logged_out` | User | 1 | ❌ | Audit |
| 6 | `PasswordChangedEvent` | `user.password_changed` | User | 1 | ✅ | Notifications, Audit |
| 7 | `UserAccountLockedEvent` | `user.user_account_locked` | User | 1 | ✅ | Notifications, Audit |
| 8 | `UserAccountUnlockedEvent` | `user.user_account_unlocked` | User | 1 | ✅ | Notifications, Audit |
| 9 | `MFAEnabledEvent` | `user.mfa_enabled` | User | 1 | ✅ | Notifications, Audit |
| 10 | `MFADisabledEvent` | `user.mfa_disabled` | User | 1 | ✅ | Notifications, Audit |
| 11 | `UserRoleChangedEvent` | `user.user_role_changed` | User | 1 | ❌ | Patient, Provider, Audit |
| 12 | `PendingRegistrationCreatedEvent` | `pendingregistration.pending_registration_created` | PendingRegistration | 1 | ❌ | Notifications |
| 13 | `StaffInvitationCreatedEvent` | `staffinvitation.staff_invitation_created` | StaffInvitation | 1 | ✅ | Notifications |
| 14 | `UserAuthenticatedEvent` | `user.user_authenticated` | User | 1 | ❌ | Audit |
| 15 | `UserDeactivatedEvent` | `user.user_deactivated` | User | 1 | ✅ | Patient, Provider, Audit |

**Legend**:
- ✅ **Contains PHI**: Event contains Protected Health Information
- ⚠️ **Conditional PHI**: May contain PHI depending on fields
- ❌ **No PHI**: Event does not contain PHI

---

## Event Payload Structure

### Base Event Structure

All events follow this base structure:

```typescript
interface IntegrationEventPayload {
  eventType: string;           // Event class name (e.g., "UserCreatedEvent")
  aggregateId: string;         // ID of the aggregate root
  aggregateType: string;       // Type of aggregate (e.g., "User")
  occurredAt: Date;            // When the event occurred (ISO 8601)
  metadata: {
    correlationId: string;     // Event ID for tracing
  };
  payload: Record<string, unknown>; // Event-specific data
}
```

### Event-Specific Payloads

#### 1. UserCreatedEvent

**Routing Key**: `user.user_created`

**Payload**:
```json
{
  "eventType": "UserCreatedEvent",
  "aggregateId": "550e8400-e29b-41d4-a716-446655440000",
  "aggregateType": "User",
  "occurredAt": "2025-01-07T10:30:00.000Z",
  "metadata": {
    "correlationId": "evt_123456789"
  },
  "payload": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "doctor@hospital.vn",
    "role": "DOCTOR"
  }
}
```

**TypeScript Type**:
```typescript
interface UserCreatedPayload {
  userId: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'PATIENT';
}
```

---

#### 2. UserUpdatedEvent

**Routing Key**: `user.user_updated`

**Payload**:
```json
{
  "eventType": "UserUpdatedEvent",
  "aggregateId": "550e8400-e29b-41d4-a716-446655440000",
  "aggregateType": "User",
  "occurredAt": "2025-01-07T10:35:00.000Z",
  "metadata": {
    "correlationId": "evt_123456790"
  },
  "payload": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "updatedBy": "admin-user-id",
    "updatedFields": ["email", "phoneNumber"],
    "changes": [
      {
        "field": "email",
        "oldValue": "old@hospital.vn",
        "newValue": "new@hospital.vn"
      },
      {
        "field": "phoneNumber",
        "oldValue": "+84901234567",
        "newValue": "+84907654321"
      }
    ],
    "updatedAt": "2025-01-07T10:35:00.000Z"
  }
}
```

**TypeScript Type**:
```typescript
interface UserFieldChange {
  field: string;
  oldValue: any;
  newValue: any;
}

interface UserUpdatedPayload {
  userId: string;
  updatedBy: string;
  updatedFields: string[];
  changes: UserFieldChange[];
  updatedAt: string;
}
```

---

#### 3. UserDeletedEvent

**Routing Key**: `user.user_deleted`

**Payload**:
```json
{
  "eventType": "UserDeletedEvent",
  "aggregateId": "550e8400-e29b-41d4-a716-446655440000",
  "aggregateType": "User",
  "occurredAt": "2025-01-07T10:40:00.000Z",
  "metadata": {
    "correlationId": "evt_123456791"
  },
  "payload": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "deletedBy": "admin-user-id",
    "deletionType": "soft",
    "reason": "User requested account deletion",
    "email": "user@hospital.vn",
    "role": "PATIENT",
    "deletedAt": "2025-01-07T10:40:00.000Z"
  }
}
```

**TypeScript Type**:
```typescript
interface UserDeletedPayload {
  userId: string;
  deletedBy: string;
  deletionType: 'soft' | 'hard';
  reason: string;
  email: string;
  role: string;
  deletedAt: string;
}
```

---

#### 4. UserActivatedEvent

**Routing Key**: `user.user_activated`

**Payload**:
```json
{
  "eventType": "UserActivatedEvent",
  "aggregateId": "550e8400-e29b-41d4-a716-446655440000",
  "aggregateType": "User",
  "occurredAt": "2025-01-07T10:45:00.000Z",
  "metadata": {
    "correlationId": "evt_123456792"
  },
  "payload": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@hospital.vn",
    "activatedAt": "2025-01-07T10:45:00.000Z"
  }
}
```

**TypeScript Type**:
```typescript
interface UserActivatedPayload {
  userId: string;
  email: string;
  activatedAt: string;
}
```

---

#### 5. UserLoggedOutEvent

**Routing Key**: `user.user_logged_out`

**Payload**:
```json
{
  "eventType": "UserLoggedOutEvent",
  "aggregateId": "550e8400-e29b-41d4-a716-446655440000",
  "aggregateType": "User",
  "occurredAt": "2025-01-07T10:50:00.000Z",
  "metadata": {
    "correlationId": "evt_123456793"
  },
  "payload": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "sessionId": "session_abc123",
    "loggedOutAt": "2025-01-07T10:50:00.000Z"
  }
}
```

**TypeScript Type**:
```typescript
interface UserLoggedOutPayload {
  userId: string;
  sessionId: string;
  loggedOutAt: string;
}
```

---

#### 6. PasswordChangedEvent

**Routing Key**: `user.password_changed`

**Payload**:
```json
{
  "eventType": "PasswordChangedEvent",
  "aggregateId": "550e8400-e29b-41d4-a716-446655440000",
  "aggregateType": "User",
  "occurredAt": "2025-01-07T10:55:00.000Z",
  "metadata": {
    "correlationId": "evt_123456794"
  },
  "payload": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "changedBy": "550e8400-e29b-41d4-a716-446655440000",
    "invalidatedSessions": true,
    "email": "user@hospital.vn",
    "role": "DOCTOR",
    "changedAt": "2025-01-07T10:55:00.000Z"
  }
}
```

**TypeScript Type**:
```typescript
interface PasswordChangedPayload {
  userId: string;
  changedBy: string;
  invalidatedSessions: boolean;
  email: string;
  role: string;
  changedAt: string;
}
```

---

#### 7. UserAccountLockedEvent

**Routing Key**: `user.user_account_locked`

**Payload**:
```json
{
  "eventType": "UserAccountLockedEvent",
  "aggregateId": "550e8400-e29b-41d4-a716-446655440000",
  "aggregateType": "User",
  "occurredAt": "2025-01-07T11:00:00.000Z",
  "metadata": {
    "correlationId": "evt_123456795"
  },
  "payload": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "lockedBy": "admin-user-id",
    "reason": "Suspicious activity detected",
    "terminatedSessions": true,
    "email": "user@hospital.vn",
    "role": "DOCTOR",
    "lockedAt": "2025-01-07T11:00:00.000Z"
  }
}
```

**TypeScript Type**:
```typescript
interface UserAccountLockedPayload {
  userId: string;
  lockedBy: string;
  reason: string;
  terminatedSessions: boolean;
  email: string;
  role: string;
  lockedAt: string;
}
```

---

#### 8. UserAccountUnlockedEvent

**Routing Key**: `user.user_account_unlocked`

**Payload**:
```json
{
  "eventType": "UserAccountUnlockedEvent",
  "aggregateId": "550e8400-e29b-41d4-a716-446655440000",
  "aggregateType": "User",
  "occurredAt": "2025-01-07T11:05:00.000Z",
  "metadata": {
    "correlationId": "evt_123456796"
  },
  "payload": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "unlockedBy": "admin-user-id",
    "reason": "Issue resolved",
    "email": "user@hospital.vn",
    "role": "DOCTOR",
    "unlockedAt": "2025-01-07T11:05:00.000Z"
  }
}
```

**TypeScript Type**:
```typescript
interface UserAccountUnlockedPayload {
  userId: string;
  unlockedBy: string;
  reason: string;
  email: string;
  role: string;
  unlockedAt: string;
}
```

---

#### 9. MFAEnabledEvent

**Routing Key**: `user.mfa_enabled`

**Payload**:
```json
{
  "eventType": "MFAEnabledEvent",
  "aggregateId": "550e8400-e29b-41d4-a716-446655440000",
  "aggregateType": "User",
  "occurredAt": "2025-01-07T11:10:00.000Z",
  "metadata": {
    "correlationId": "evt_123456797"
  },
  "payload": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "method": "2fa_app",
    "enabledBy": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@hospital.vn",
    "role": "DOCTOR",
    "enabledAt": "2025-01-07T11:10:00.000Z"
  }
}
```

**TypeScript Type**:
```typescript
interface MFAEnabledPayload {
  userId: string;
  method: '2fa_app' | 'sms' | 'email';
  enabledBy: string;
  email: string;
  role: string;
  enabledAt: string;
}
```

---

#### 10. MFADisabledEvent

**Routing Key**: `user.mfa_disabled`

**Payload**:
```json
{
  "eventType": "MFADisabledEvent",
  "aggregateId": "550e8400-e29b-41d4-a716-446655440000",
  "aggregateType": "User",
  "occurredAt": "2025-01-07T11:15:00.000Z",
  "metadata": {
    "correlationId": "evt_123456798"
  },
  "payload": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "disabledBy": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@hospital.vn",
    "role": "DOCTOR",
    "disabledAt": "2025-01-07T11:15:00.000Z"
  }
}
```

**TypeScript Type**:
```typescript
interface MFADisabledPayload {
  userId: string;
  disabledBy: string;
  email: string;
  role: string;
  disabledAt: string;
}
```

---

#### 11. UserRoleChangedEvent

**Routing Key**: `user.user_role_changed`

**Payload**:
```json
{
  "eventType": "UserRoleChangedEvent",
  "aggregateId": "550e8400-e29b-41d4-a716-446655440000",
  "aggregateType": "User",
  "occurredAt": "2025-01-07T11:20:00.000Z",
  "metadata": {
    "correlationId": "evt_123456799"
  },
  "payload": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "oldRole": "NURSE",
    "newRole": "DOCTOR",
    "changedBy": "admin-user-id"
  }
}
```

**TypeScript Type**:
```typescript
interface UserRoleChangedPayload {
  userId: string;
  oldRole: 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'PATIENT';
  newRole: 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'PATIENT';
  changedBy: string;
}
```

---

#### 12. PendingRegistrationCreatedEvent

**Routing Key**: `pendingregistration.pending_registration_created`

**Payload**:
```json
{
  "eventType": "PendingRegistrationCreatedEvent",
  "aggregateId": "pending_reg_123",
  "aggregateType": "PendingRegistration",
  "occurredAt": "2025-01-07T11:25:00.000Z",
  "metadata": {
    "correlationId": "evt_123456800"
  },
  "payload": {
    "pendingRegistrationId": "pending_reg_123",
    "email": "newuser@hospital.vn",
    "fullName": "Nguyen Van A",
    "roleType": "PATIENT",
    "expiresAt": "2025-01-08T11:25:00.000Z"
  }
}
```

**TypeScript Type**:
```typescript
interface PendingRegistrationCreatedPayload {
  pendingRegistrationId: string;
  email: string;
  fullName: string;
  roleType: string;
  expiresAt: string;
}
```

---

#### 13. StaffInvitationCreatedEvent

**Routing Key**: `staffinvitation.staff_invitation_created`

**Payload**:
```json
{
  "eventType": "StaffInvitationCreatedEvent",
  "aggregateId": "staff@hospital.vn",
  "aggregateType": "StaffInvitation",
  "occurredAt": "2025-01-07T11:30:00.000Z",
  "metadata": {
    "correlationId": "evt_123456801"
  },
  "payload": {
    "email": "staff@hospital.vn",
    "role": "DOCTOR",
    "invitedBy": "admin-user-id",
    "invitationToken": "token_abc123",
    "expiresAt": "2025-01-14T11:30:00.000Z"
  }
}
```

**TypeScript Type**:
```typescript
interface StaffInvitationCreatedPayload {
  email: string;
  role: string;
  invitedBy: string;
  invitationToken: string;
  expiresAt: string;
}
```

---

#### 14. UserAuthenticatedEvent

**Routing Key**: `user.user_authenticated`

**Payload**:
```json
{
  "eventType": "UserAuthenticatedEvent",
  "aggregateId": "550e8400-e29b-41d4-a716-446655440000",
  "aggregateType": "User",
  "occurredAt": "2025-01-07T11:35:00.000Z",
  "metadata": {
    "correlationId": "evt_123456802"
  },
  "payload": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "timestamp": "2025-01-07T11:35:00.000Z"
  }
}
```

**TypeScript Type**:
```typescript
interface UserAuthenticatedPayload {
  userId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}
```

---

#### 15. UserDeactivatedEvent

**Routing Key**: `user.user_deactivated`

**Payload**:
```json
{
  "eventType": "UserDeactivatedEvent",
  "aggregateId": "550e8400-e29b-41d4-a716-446655440000",
  "aggregateType": "User",
  "occurredAt": "2025-01-07T11:40:00.000Z",
  "metadata": {
    "correlationId": "evt_123456803"
  },
  "payload": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "deactivatedBy": "admin-user-id",
    "reason": "Account suspended",
    "email": "user@hospital.vn",
    "role": "PATIENT",
    "deactivatedAt": "2025-01-07T11:40:00.000Z"
  }
}
```

**TypeScript Type**:
```typescript
interface UserDeactivatedPayload {
  userId: string;
  deactivatedBy: string;
  reason: string;
  email: string;
  role: string;
  deactivatedAt: string;
}
```

---

## Routing Key Format

### Convention

**Format**: `{aggregateType}.{eventType}`

- **aggregateType**: Lowercase aggregate name (e.g., `user`, `pendingregistration`, `staffinvitation`)
- **eventType**: Snake_case event name (e.g., `user_created`, `password_changed`, `mfa_enabled`)

### Transformation Rules

1. **Aggregate Type**: Convert to lowercase
   - `User` → `user`
   - `PendingRegistration` → `pendingregistration`

2. **Event Type**: Convert PascalCase to snake_case
   - `UserCreatedEvent` → `user_created`
   - `PasswordChangedEvent` → `password_changed`
   - `MFAEnabledEvent` → `mfa_enabled`

### Wildcard Patterns

Consumers can subscribe using wildcard patterns:

```typescript
// Subscribe to all user events
channel.bindQueue(queueName, 'hospital.events', 'user.*');

// Subscribe to all events
channel.bindQueue(queueName, 'hospital.events', '#');

// Subscribe to specific events
channel.bindQueue(queueName, 'hospital.events', 'user.user_created');
channel.bindQueue(queueName, 'hospital.events', 'user.password_changed');
```

---

## Event Versioning Strategy

### Versioning Approach

We use **Semantic Versioning** for events:

- **Major version**: Breaking changes (field removal, type changes)
- **Minor version**: Backward-compatible additions (new optional fields)
- **Patch version**: Bug fixes, documentation updates

### Version Field

All events include a `version` field in the base event structure:

```typescript
interface IntegrationEventPayload {
  // ... other fields
  version?: number; // Event schema version (default: 1)
}
```

### Backward Compatibility Rules

1. **Never remove fields** - Mark as deprecated instead
2. **Never change field types** - Create new field with different name
3. **Always add new fields as optional**
4. **Document breaking changes** in migration guide

### Migration Guide

#### Example: Migrating from v1 to v2

**Scenario**: Adding `phoneNumber` field to `UserCreatedEvent`

**v1 Payload**:
```json
{
  "userId": "123",
  "email": "user@hospital.vn",
  "role": "DOCTOR"
}
```

**v2 Payload** (backward compatible):
```json
{
  "userId": "123",
  "email": "user@hospital.vn",
  "role": "DOCTOR",
  "phoneNumber": "+84901234567"  // New optional field
}
```

**Consumer Code**:
```typescript
// Handles both v1 and v2
interface UserCreatedPayload {
  userId: string;
  email: string;
  role: string;
  phoneNumber?: string; // Optional for backward compatibility
}

function handleUserCreated(payload: UserCreatedPayload) {
  // Check if phoneNumber exists
  if (payload.phoneNumber) {
    // Use phoneNumber
  }
}
```

---

## Consumer Subscription Guide

### Prerequisites

1. **RabbitMQ Connection**: Ensure RabbitMQ is accessible
2. **Exchange**: `hospital.events` (topic exchange)
3. **Credentials**: RabbitMQ username/password

### TypeScript Example

#### 1. Setup Connection

```typescript
import * as amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672';
const EXCHANGE_NAME = 'hospital.events';

async function setupEventConsumer() {
  // Connect to RabbitMQ
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  // Assert exchange exists
  await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

  // Create queue
  const queueName = 'patient-service-queue';
  await channel.assertQueue(queueName, { durable: true });

  // Bind queue to routing keys
  await channel.bindQueue(queueName, EXCHANGE_NAME, 'user.user_created');
  await channel.bindQueue(queueName, EXCHANGE_NAME, 'user.user_updated');
  await channel.bindQueue(queueName, EXCHANGE_NAME, 'user.user_deleted');

  console.log(`Waiting for messages in queue: ${queueName}`);

  // Consume messages
  channel.consume(queueName, async (msg) => {
    if (msg) {
      try {
        const event = JSON.parse(msg.content.toString());
        await handleEvent(event);
        channel.ack(msg); // Acknowledge message
      } catch (error) {
        console.error('Error processing message:', error);
        channel.nack(msg, false, false); // Reject and don't requeue
      }
    }
  });
}
```

#### 2. Event Handler

```typescript
interface IntegrationEventPayload {
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  occurredAt: string;
  metadata: {
    correlationId: string;
  };
  payload: Record<string, unknown>;
}

async function handleEvent(event: IntegrationEventPayload) {
  console.log(`Received event: ${event.eventType}`);

  switch (event.eventType) {
    case 'UserCreatedEvent':
      await handleUserCreated(event.payload as UserCreatedPayload);
      break;
    case 'UserUpdatedEvent':
      await handleUserUpdated(event.payload as UserUpdatedPayload);
      break;
    case 'UserDeletedEvent':
      await handleUserDeleted(event.payload as UserDeletedPayload);
      break;
    default:
      console.warn(`Unknown event type: ${event.eventType}`);
  }
}

async function handleUserCreated(payload: UserCreatedPayload) {
  console.log(`User created: ${payload.userId}, Email: ${payload.email}`);
  
  // Example: Create patient record
  if (payload.role === 'PATIENT') {
    await createPatientRecord({
      userId: payload.userId,
      email: payload.email
    });
  }
}

async function handleUserUpdated(payload: UserUpdatedPayload) {
  console.log(`User updated: ${payload.userId}`);
  
  // Example: Update patient record if email changed
  if (payload.updatedFields.includes('email')) {
    await updatePatientEmail(payload.userId, payload.changes);
  }
}

async function handleUserDeleted(payload: UserDeletedPayload) {
  console.log(`User deleted: ${payload.userId}, Type: ${payload.deletionType}`);
  
  // Example: Soft delete patient record
  if (payload.deletionType === 'soft') {
    await softDeletePatientRecord(payload.userId);
  }
}
```

#### 3. Idempotency Protection

```typescript
const processedEvents = new Set<string>();

async function handleEvent(event: IntegrationEventPayload) {
  const eventId = event.metadata.correlationId;

  // Check if already processed
  if (processedEvents.has(eventId)) {
    console.log(`Event already processed: ${eventId}`);
    return;
  }

  // Process event
  await processEvent(event);

  // Mark as processed
  processedEvents.add(eventId);

  // Optional: Store in database for persistence
  await storeProcessedEvent(eventId);
}
```

#### 4. Error Handling & Retry

```typescript
async function handleEvent(event: IntegrationEventPayload) {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      await processEvent(event);
      return; // Success
    } catch (error) {
      retryCount++;
      console.error(`Error processing event (attempt ${retryCount}/${maxRetries}):`, error);

      if (retryCount >= maxRetries) {
        // Send to dead letter queue
        await sendToDeadLetterQueue(event, error);
        throw error;
      }

      // Exponential backoff
      await sleep(Math.pow(2, retryCount) * 1000);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## Event Publishing Best Practices

### 1. Idempotency

**Problem**: Same event published multiple times due to retries

**Solution**: Include unique `eventId` in metadata

```typescript
const event: IntegrationEventPayload = {
  eventType: 'UserCreatedEvent',
  aggregateId: userId,
  aggregateType: 'User',
  occurredAt: new Date(),
  metadata: {
    correlationId: uuidv4() // Unique event ID
  },
  payload: { /* ... */ }
};
```

### 2. Transactional Outbox Pattern

**Problem**: Event published but database transaction fails (or vice versa)

**Solution**: Store events in database, publish in separate process

```typescript
// 1. Save event to outbox table in same transaction
await db.transaction(async (trx) => {
  await trx('users').insert(userData);
  await trx('event_outbox').insert({
    event_id: eventId,
    event_type: 'UserCreatedEvent',
    payload: JSON.stringify(event),
    status: 'pending'
  });
});

// 2. Separate process publishes events
async function publishPendingEvents() {
  const events = await db('event_outbox')
    .where('status', 'pending')
    .limit(100);

  for (const event of events) {
    await eventPublisher.publish(JSON.parse(event.payload));
    await db('event_outbox')
      .where('event_id', event.event_id)
      .update({ status: 'published' });
  }
}
```

### 3. Event Ordering

**Problem**: Events processed out of order

**Solution**: Use sequence numbers or timestamps

```typescript
interface IntegrationEventPayload {
  // ... other fields
  metadata: {
    correlationId: string;
    sequenceNumber?: number; // Optional sequence number
  };
}

// Consumer: Process events in order
const eventQueue: IntegrationEventPayload[] = [];
let lastProcessedSequence = 0;

async function handleEvent(event: IntegrationEventPayload) {
  const sequence = event.metadata.sequenceNumber || 0;

  if (sequence <= lastProcessedSequence) {
    console.log('Event already processed or out of order');
    return;
  }

  // Add to queue
  eventQueue.push(event);
  eventQueue.sort((a, b) => 
    (a.metadata.sequenceNumber || 0) - (b.metadata.sequenceNumber || 0)
  );

  // Process in order
  while (eventQueue.length > 0) {
    const nextEvent = eventQueue[0];
    const nextSequence = nextEvent.metadata.sequenceNumber || 0;

    if (nextSequence === lastProcessedSequence + 1) {
      await processEvent(nextEvent);
      lastProcessedSequence = nextSequence;
      eventQueue.shift();
    } else {
      break; // Wait for missing events
    }
  }
}
```

### 4. Dead Letter Queue

**Problem**: Failed events block queue processing

**Solution**: Move failed events to DLQ after max retries

```typescript
const DLQ_EXCHANGE = 'hospital.events.dlq';

async function setupDeadLetterQueue(channel: amqp.Channel) {
  // Create DLQ exchange
  await channel.assertExchange(DLQ_EXCHANGE, 'topic', { durable: true });

  // Create DLQ queue
  const dlqName = 'patient-service-dlq';
  await channel.assertQueue(dlqName, { durable: true });
  await channel.bindQueue(dlqName, DLQ_EXCHANGE, '#');
}

async function sendToDeadLetterQueue(
  event: IntegrationEventPayload,
  error: Error
) {
  const dlqMessage = {
    originalEvent: event,
    error: {
      message: error.message,
      stack: error.stack
    },
    failedAt: new Date().toISOString(),
    retryCount: 3
  };

  await channel.publish(
    DLQ_EXCHANGE,
    event.eventType,
    Buffer.from(JSON.stringify(dlqMessage)),
    { persistent: true }
  );
}
```

### 5. Monitoring & Alerting

**Metrics to track**:
- Event publish rate
- Event processing latency
- Failed event count
- DLQ size
- Consumer lag

```typescript
import { Counter, Histogram } from 'prom-client';

const eventPublishedCounter = new Counter({
  name: 'events_published_total',
  help: 'Total number of events published',
  labelNames: ['event_type']
});

const eventProcessingDuration = new Histogram({
  name: 'event_processing_duration_seconds',
  help: 'Event processing duration',
  labelNames: ['event_type']
});

async function publishEvent(event: IntegrationEventPayload) {
  await eventPublisher.publish(event);
  eventPublishedCounter.inc({ event_type: event.eventType });
}

async function handleEvent(event: IntegrationEventPayload) {
  const end = eventProcessingDuration.startTimer({ event_type: event.eventType });
  try {
    await processEvent(event);
  } finally {
    end();
  }
}
```

---

## PHI/HIPAA Compliance

### Protected Health Information (PHI)

**Definition**: Any information that can identify a patient and relates to their health condition, treatment, or payment.

**PHI Fields in Events**:
- Email addresses
- Full names
- Phone numbers
- Citizen ID numbers
- Date of birth
- Addresses
- Medical record numbers

### Compliance Requirements

#### 1. Encryption

**At Rest**:
- RabbitMQ messages stored on disk must be encrypted
- Database event outbox must use encrypted columns

**In Transit**:
- Use TLS/SSL for RabbitMQ connections
- Use HTTPS for API calls

```typescript
// RabbitMQ with TLS
const RABBITMQ_URL = 'amqps://admin:admin@rabbitmq:5671';

const connection = await amqp.connect(RABBITMQ_URL, {
  ca: [fs.readFileSync('/path/to/ca.pem')],
  cert: fs.readFileSync('/path/to/cert.pem'),
  key: fs.readFileSync('/path/to/key.pem')
});
```

#### 2. Access Control

**Principle of Least Privilege**:
- Only authorized services can consume PHI events
- Use RabbitMQ user permissions

```bash
# Create user with limited permissions
rabbitmqctl add_user patient_service secure_password
rabbitmqctl set_permissions -p / patient_service "^patient-service-.*" "^hospital.events$" "^patient-service-.*"
```

#### 3. Audit Logging

**Log all PHI access**:
- Who accessed the event
- When it was accessed
- What action was performed

```typescript
async function handleEvent(event: IntegrationEventPayload) {
  // Check if event contains PHI
  if (containsPHI(event)) {
    await auditLog.log({
      action: 'EVENT_CONSUMED',
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      consumedBy: 'patient-service',
      consumedAt: new Date(),
      ipAddress: getServerIP()
    });
  }

  await processEvent(event);
}

function containsPHI(event: IntegrationEventPayload): boolean {
  const phiEvents = [
    'UserCreatedEvent',
    'UserUpdatedEvent',
    'UserDeletedEvent',
    'UserActivatedEvent',
    'PasswordChangedEvent',
    'UserAccountLockedEvent',
    'UserAccountUnlockedEvent',
    'MFAEnabledEvent',
    'MFADisabledEvent',
    'StaffInvitationCreatedEvent',
    'UserDeactivatedEvent'
  ];

  return phiEvents.includes(event.eventType);
}
```

#### 4. Data Minimization

**Only include necessary PHI**:
- Don't include full medical records in events
- Use references (IDs) instead of full data

```typescript
// ❌ Bad: Including full patient data
{
  "eventType": "UserCreatedEvent",
  "payload": {
    "userId": "123",
    "email": "patient@hospital.vn",
    "fullName": "Nguyen Van A",
    "citizenId": "001234567890",
    "dateOfBirth": "1990-01-01",
    "address": "123 Main St, Hanoi",
    "medicalHistory": { /* ... */ } // Too much PHI!
  }
}

// ✅ Good: Minimal PHI
{
  "eventType": "UserCreatedEvent",
  "payload": {
    "userId": "123",
    "email": "patient@hospital.vn",
    "role": "PATIENT"
  }
}
```

#### 5. Event Anonymization

**For analytics/reporting**:

```typescript
function anonymizeEvent(event: IntegrationEventPayload): IntegrationEventPayload {
  const anonymized = { ...event };

  if (anonymized.payload.email) {
    anonymized.payload.email = '***@***.***';
  }

  if (anonymized.payload.fullName) {
    anonymized.payload.fullName = '***';
  }

  if (anonymized.payload.phoneNumber) {
    anonymized.payload.phoneNumber = '+84*********';
  }

  return anonymized;
}
```

---

## TypeScript Type Definitions

### Complete Type Definitions File

```typescript
/**
 * Hospital Management System V2 - Event Type Definitions
 * @version 2.0.0
 */

// Base event structure
export interface IntegrationEventPayload {
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  occurredAt: Date | string;
  metadata: {
    correlationId: string;
    sequenceNumber?: number;
  };
  payload: Record<string, unknown>;
  version?: number;
}

// User role types
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'PATIENT';

// MFA method types
export type MFAMethod = '2fa_app' | 'sms' | 'email';

// Deletion types
export type DeletionType = 'soft' | 'hard';

// Event payload types
export interface UserCreatedPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface UserFieldChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface UserUpdatedPayload {
  userId: string;
  updatedBy: string;
  updatedFields: string[];
  changes: UserFieldChange[];
  updatedAt: string;
}

export interface UserDeletedPayload {
  userId: string;
  deletedBy: string;
  deletionType: DeletionType;
  reason: string;
  email: string;
  role: string;
  deletedAt: string;
}

export interface UserActivatedPayload {
  userId: string;
  email: string;
  activatedAt: string;
}

export interface UserLoggedOutPayload {
  userId: string;
  sessionId: string;
  loggedOutAt: string;
}

export interface PasswordChangedPayload {
  userId: string;
  changedBy: string;
  invalidatedSessions: boolean;
  email: string;
  role: string;
  changedAt: string;
}

export interface UserAccountLockedPayload {
  userId: string;
  lockedBy: string;
  reason: string;
  terminatedSessions: boolean;
  email: string;
  role: string;
  lockedAt: string;
}

export interface UserAccountUnlockedPayload {
  userId: string;
  unlockedBy: string;
  reason: string;
  email: string;
  role: string;
  unlockedAt: string;
}

export interface MFAEnabledPayload {
  userId: string;
  method: MFAMethod;
  enabledBy: string;
  email: string;
  role: string;
  enabledAt: string;
}

export interface MFADisabledPayload {
  userId: string;
  disabledBy: string;
  email: string;
  role: string;
  disabledAt: string;
}

export interface UserRoleChangedPayload {
  userId: string;
  oldRole: UserRole;
  newRole: UserRole;
  changedBy: string;
}

export interface PendingRegistrationCreatedPayload {
  pendingRegistrationId: string;
  email: string;
  fullName: string;
  roleType: string;
  expiresAt: string;
}

export interface StaffInvitationCreatedPayload {
  email: string;
  role: string;
  invitedBy: string;
  invitationToken: string;
  expiresAt: string;
}

export interface UserAuthenticatedPayload {
  userId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface UserDeactivatedPayload {
  userId: string;
  deactivatedBy: string;
  reason: string;
  email: string;
  role: string;
  deactivatedAt: string;
}

// Event handler type
export type EventHandler<T = any> = (payload: T) => Promise<void>;

// Event consumer interface
export interface IEventConsumer {
  subscribe(routingKey: string, handler: EventHandler): Promise<void>;
  unsubscribe(routingKey: string): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}
```

---

## Appendix

### A. RabbitMQ Configuration

**Exchange Configuration**:
```bash
# Create exchange
rabbitmqadmin declare exchange name=hospital.events type=topic durable=true

# List exchanges
rabbitmqadmin list exchanges
```

**Queue Configuration**:
```bash
# Create queue
rabbitmqadmin declare queue name=patient-service-queue durable=true

# Bind queue to exchange
rabbitmqadmin declare binding source=hospital.events destination=patient-service-queue routing_key="user.*"

# List queues
rabbitmqadmin list queues
```

### B. Testing Events

**Publish Test Event**:
```bash
# Using rabbitmqadmin
rabbitmqadmin publish exchange=hospital.events routing_key=user.user_created payload='{"eventType":"UserCreatedEvent","aggregateId":"test-123","aggregateType":"User","occurredAt":"2025-01-07T10:00:00.000Z","metadata":{"correlationId":"test-evt-123"},"payload":{"userId":"test-123","email":"test@hospital.vn","role":"PATIENT"}}'
```

**Consume Test Event**:
```bash
# Using rabbitmqadmin
rabbitmqadmin get queue=patient-service-queue ackmode=ack_requeue_false
```

### C. Monitoring Commands

```bash
# Check queue depth
rabbitmqctl list_queues name messages messages_ready messages_unacknowledged

# Check consumer count
rabbitmqctl list_consumers

# Check exchange bindings
rabbitmqctl list_bindings
```

---

## Support & Contact

**Documentation Maintainer**: Hospital Management Team  
**Version**: 2.0.0  
**Last Updated**: 2025-01-07

For questions or issues, please contact the development team or create an issue in the project repository.

---

**End of Documentation**
