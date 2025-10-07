# Identity Service - Event Catalog

**Version**: 1.0.0  
**Last Updated**: 2025-01-06  
**Status**: 📋 Draft

---

## Overview

This document catalogs all domain events published by Identity Service, including:
- Event names and types
- Payload schemas
- Event sources
- Expected subscribers
- Retry behavior
- Event versioning

---

## Event Infrastructure

### Message Broker
- **Technology**: RabbitMQ
- **Exchange**: `identity.events`
- **Exchange Type**: Topic
- **Routing Key Pattern**: `identity.{aggregate}.{action}`

### Event Format
```json
{
  "eventId": "uuid",
  "eventType": "UserRegistered",
  "eventVersion": "1.0",
  "aggregateId": "user-uuid",
  "aggregateType": "User",
  "occurredAt": "2025-01-06T10:30:00Z",
  "payload": {
    // Event-specific data
  },
  "metadata": {
    "correlationId": "uuid",
    "causationId": "uuid",
    "userId": "uuid",
    "source": "identity-service"
  }
}
```

---

## Event Catalog

### 1. UserRegistered

**Event Type**: `UserRegistered`  
**Routing Key**: `identity.user.registered`  
**Aggregate**: User  
**Version**: 1.0

#### Description
Published when a new user successfully registers (patient self-registration or staff registration by admin).

#### Payload Schema
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "PATIENT",
  "fullName": "Nguyễn Văn A",
  "phoneNumber": "0901234567",
  "registrationType": "SELF_REGISTRATION",
  "status": "PENDING_ACTIVATION",
  "registeredAt": "2025-01-06T10:30:00Z"
}
```

#### Payload Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | UUID | Yes | Unique user identifier |
| email | String | Yes | User email address |
| role | Enum | Yes | User role (PATIENT, DOCTOR, NURSE, etc.) |
| fullName | String | Yes | User full name |
| phoneNumber | String | Yes | User phone number |
| registrationType | Enum | Yes | SELF_REGISTRATION or ADMIN_CREATED |
| status | Enum | Yes | Account status |
| registeredAt | ISO 8601 | Yes | Registration timestamp |

#### Expected Subscribers
- **Patient Registry Service**: Create patient profile (if role = PATIENT)
- **Provider/Staff Service**: Create provider profile (if role = DOCTOR, NURSE, etc.)
- **Notification Service**: Send welcome email
- **Audit Service**: Log registration event

#### Retry Behavior
- **Max Retries**: 3
- **Retry Delay**: Exponential backoff (1s, 2s, 4s)
- **Dead Letter Queue**: `identity.events.dlq`

#### Example
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "UserRegistered",
  "eventVersion": "1.0",
  "aggregateId": "123e4567-e89b-12d3-a456-426614174000",
  "aggregateType": "User",
  "occurredAt": "2025-01-06T10:30:00Z",
  "payload": {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "email": "patient@example.com",
    "role": "PATIENT",
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0901234567",
    "registrationType": "SELF_REGISTRATION",
    "status": "PENDING_ACTIVATION",
    "registeredAt": "2025-01-06T10:30:00Z"
  },
  "metadata": {
    "correlationId": "550e8400-e29b-41d4-a716-446655440001",
    "causationId": "550e8400-e29b-41d4-a716-446655440002",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "source": "identity-service"
  }
}
```

---

### 2. UserActivated

**Event Type**: `UserActivated`  
**Routing Key**: `identity.user.activated`  
**Aggregate**: User  
**Version**: 1.0

#### Description
Published when a user activates their account via email verification link.

#### Payload Schema
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "PATIENT",
  "activatedAt": "2025-01-06T11:00:00Z"
}
```

#### Expected Subscribers
- **Patient Registry Service**: Update patient status to ACTIVE
- **Provider/Staff Service**: Update provider status to ACTIVE
- **Notification Service**: Send activation confirmation email
- **Audit Service**: Log activation event

#### Retry Behavior
- **Max Retries**: 3
- **Retry Delay**: Exponential backoff (1s, 2s, 4s)

---

### 3. UserLoggedIn

**Event Type**: `UserLoggedIn`  
**Routing Key**: `identity.user.logged-in`  
**Aggregate**: User  
**Version**: 1.0

#### Description
Published when a user successfully logs in.

#### Payload Schema
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "DOCTOR",
  "loginMethod": "PASSWORD",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "loggedInAt": "2025-01-06T12:00:00Z"
}
```

#### Expected Subscribers
- **Audit Service**: Log login event
- **Analytics Service**: Track user activity
- **Security Service**: Monitor suspicious logins

#### Retry Behavior
- **Max Retries**: 1 (non-critical event)
- **Retry Delay**: 1s

---

### 4. UserLoggedOut

**Event Type**: `UserLoggedOut`  
**Routing Key**: `identity.user.logged-out`  
**Aggregate**: User  
**Version**: 1.0

#### Description
Published when a user logs out.

#### Payload Schema
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "loggedOutAt": "2025-01-06T13:00:00Z"
}
```

#### Expected Subscribers
- **Audit Service**: Log logout event
- **Session Service**: Invalidate session

---

### 5. UserAccountLocked

**Event Type**: `UserAccountLocked`  
**Routing Key**: `identity.user.account-locked`  
**Aggregate**: User  
**Version**: 1.0

#### Description
Published when a user account is locked due to too many failed login attempts.

#### Payload Schema
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "reason": "TOO_MANY_FAILED_ATTEMPTS",
  "failedAttempts": 5,
  "lockedAt": "2025-01-06T14:00:00Z",
  "unlockAt": "2025-01-06T15:00:00Z"
}
```

#### Expected Subscribers
- **Notification Service**: Send account locked email
- **Security Service**: Log security event
- **Audit Service**: Log lock event

---

### 6. UserAccountUnlocked

**Event Type**: `UserAccountUnlocked`  
**Routing Key**: `identity.user.account-unlocked`  
**Aggregate**: User  
**Version**: 1.0

#### Description
Published when a locked user account is unlocked (automatically or by admin).

#### Payload Schema
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "unlockedBy": "ADMIN",
  "unlockedAt": "2025-01-06T15:00:00Z"
}
```

#### Expected Subscribers
- **Notification Service**: Send account unlocked email
- **Audit Service**: Log unlock event

---

### 7. UserPasswordChanged

**Event Type**: `UserPasswordChanged`  
**Routing Key**: `identity.user.password-changed`  
**Aggregate**: User  
**Version**: 1.0

#### Description
Published when a user changes their password.

#### Payload Schema
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "changedAt": "2025-01-06T16:00:00Z"
}
```

#### Expected Subscribers
- **Notification Service**: Send password changed confirmation email
- **Security Service**: Log password change
- **Audit Service**: Log password change event

---

### 8. UserRoleChanged

**Event Type**: `UserRoleChanged`  
**Routing Key**: `identity.user.role-changed`  
**Aggregate**: User  
**Version**: 1.0

#### Description
Published when a user's role is changed by an admin.

#### Payload Schema
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "oldRole": "NURSE",
  "newRole": "DOCTOR",
  "changedBy": "admin-uuid",
  "changedAt": "2025-01-06T17:00:00Z"
}
```

#### Expected Subscribers
- **Patient Registry Service**: Update patient role (if applicable)
- **Provider/Staff Service**: Update provider role
- **Notification Service**: Send role change notification
- **Audit Service**: Log role change event

---

## Event Versioning

### Version Format
- **Major.Minor**: `1.0`, `1.1`, `2.0`
- **Major**: Breaking changes (incompatible payload)
- **Minor**: Non-breaking changes (new optional fields)

### Backward Compatibility
- Subscribers must handle multiple event versions
- Old events remain in queue until processed
- New fields are optional

### Migration Strategy
1. Publish both old and new versions during transition
2. Update all subscribers to handle new version
3. Deprecate old version after 6 months
4. Remove old version support

---

## Monitoring & Observability

### Metrics
- Event publish rate
- Event processing rate
- Event processing latency
- Failed event count
- Dead letter queue size

### Logging
- All events logged with correlation ID
- Failed events logged with error details
- Retry attempts logged

### Alerting
- Alert on high dead letter queue size
- Alert on event processing failures
- Alert on event publish failures

---

## Testing

### Unit Tests
- Test event creation
- Test event serialization
- Test event validation

### Integration Tests
- Test event publishing
- Test event consumption
- Test retry behavior
- Test dead letter queue

---

**Status**: 📋 Draft - To be completed with all events  
**Next Update**: Add remaining events (MFA, password reset, user deletion)

