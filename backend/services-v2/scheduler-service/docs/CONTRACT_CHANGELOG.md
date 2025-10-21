# Contract Changelog - Scheduler Service

## Version 1.0.1 (2025-10-21)

### Changes Based on Research & Best Practices

#### 1. RRULE startAtUtc - Made Optional ⚠️

**Change**: `startAtUtc` is now **optional** for RRULE schedules (was forbidden)

**Rationale**:
- RFC 5545 (iCalendar) requires DTSTART for RRULE
- RRULE needs anchor point for recurrence calculation
- `startAtUtc` serves as DTSTART equivalent

**Validation Rules**:
```yaml
BEFORE:
  RRULE:
    required: [rrule]
    forbidden: [cronExpr, startAtUtc]

AFTER:
  RRULE:
    required: [rrule]
    optional: [startAtUtc]  # Anchor point for recurrence
    forbidden: [cronExpr]
    
    # If startAtUtc not provided, use current time as anchor
```

**Impact**:
- ✅ RFC 5545 compliant
- ✅ More flexible for clients
- ⚠️ Breaking change if clients rely on validation error

**Migration**:
- Existing RRULE schedules without `startAtUtc`: Use creation time as anchor
- New RRULE schedules: Can optionally provide `startAtUtc`

---

#### 2. Priority Field - Removed ❌

**Change**: `priority` field **removed** from CreateScheduleRequest

**Rationale**:
- Adds complexity to worker implementation (priority queue)
- Not critical for MVP use cases
- Can be added in Phase 2 without breaking changes
- Research shows priority queues can cause starvation

**Removed Field**:
```yaml
priority:
  type: integer
  minimum: 0
  maximum: 10
  default: 0
  description: Priority for execution (0=lowest, 10=highest)
```

**Impact**:
- ✅ Simpler MVP implementation
- ✅ FIFO execution (fair, no starvation)
- ⚠️ No priority support in v1.0

**Migration**:
- All schedules execute in FIFO order
- Critical schedules: Use separate queue or service (future)

---

#### 3. Validation Rules - Updated 📝

**Change**: Updated validation description for RRULE

**Before**:
```
- RRULE: Requires `rrule`, forbids `cronExpr` and `startAtUtc`
```

**After**:
```
- RRULE: Requires `rrule`, forbids `cronExpr`, `startAtUtc` is optional (anchor point)
```

**Impact**:
- ✅ Clearer documentation
- ✅ Matches RFC 5545 behavior

---

### Approved As-Is (No Changes)

#### 1. POST /schedules:cancelByOwner ✅

**Decision**: Keep POST method (not DELETE with body)

**Rationale**:
- Industry standard (Azure, AWS, Google Cloud)
- DELETE with body is unreliable across HTTP clients
- Supports complex filter criteria

**Source**: Azure Architecture Center, Stack Overflow

---

#### 2. dedupKey Format ✅

**Decision**: Keep free-form string (recommended format, not enforced)

**Rationale**:
- Client flexibility
- Industry standard (Stripe, PayPal)
- Recommended format: `{resourceType}:{resourceId}:{action}`

**Source**: Stripe API Documentation

---

#### 3. Separate Idempotency Keys ✅

**Decision**: Keep separate `dedupKey` (business) and `Idempotency-Key` header (network)

**Rationale**:
- Two-level idempotency is industry standard
- Clear separation of concerns
- Stripe, PayPal, Square all use this pattern

**Source**: Stripe API, Microservices.io

---

#### 4. X-Tenant-Id Header ✅

**Decision**: Keep required header + required in body

**Rationale**:
- Defense in depth
- Fast validation in middleware
- Common in enterprise SaaS (Auth0, Okta)
- Validate header === body

**Source**: Azure Multi-Tenant API Design

---

#### 5. misfirePolicy ✅

**Decision**: Keep in MVP (simplified version)

**Rationale**:
- Essential for production reliability
- Quartz Scheduler has similar concept
- Simplified to 3 policies: `fire_now`, `skip`, `reschedule`

**Source**: Quartz Scheduler Documentation

---

#### 6. Cancel RUNNING Runs ✅

**Decision**: Keep RUNNING runs unchanged (don't cancel)

**Rationale**:
- Quartz Scheduler behavior
- Avoid interrupting in-progress work
- RUNNING runs will complete naturally

**Source**: Quartz Scheduler Documentation

---

## Version 1.0.0 (2025-10-21)

### Initial Release

**Deliverables**:
- OpenAPI Specification (921 lines)
- Message Bus Contract
- Topic Allowlist (5 services, 40+ topics)
- Consumer Guide (Inbox Pattern)

**Endpoints**:
- POST /api/v1/schedules:createOrUpdateByDedup
- POST /api/v1/schedules:cancelByOwner
- GET /api/v1/schedules/{scheduleId}
- POST /api/v1/schedules/{scheduleId}:runNow
- GET /api/v1/schedules/{scheduleId}/runs

**Features**:
- Idempotent operations (dedupKey)
- Multi-tenant isolation (X-Tenant-Id)
- Retry policies (exp, linear, fixed)
- Misfire policies (fire_now, skip, reschedule)
- Cursor-based pagination
- Standardized error responses

---

## Research Sources

### Industry Standards
- **RFC 5545**: Internet Calendaring and Scheduling Core Object Specification (iCalendar)
- **RFC 7231**: HTTP/1.1 Semantics and Content
- **Azure Architecture Center**: Web API Design Best Practices
- **Microservices.io**: Idempotent Consumer Pattern

### API Design
- **Stripe API**: Idempotency, Error Handling
- **PayPal API**: Idempotency Keys
- **Square API**: Multi-Tenant Design
- **Auth0**: Multi-Tenant Authentication

### Scheduler Systems
- **Quartz Scheduler**: Misfire Policies, Trigger Design
- **Jaspersoft**: Scheduler Configuration
- **Baeldung**: Quartz Tutorial

### Community
- **Stack Overflow**: REST API Design, DELETE with Body
- **Reddit r/node**: Bulk Delete Patterns
- **Reddit r/dotnet**: Multi-Tenant Headers

---

## Migration Guide

### From v1.0.0 to v1.0.1

#### For API Clients

**RRULE Schedules**:
```typescript
// BEFORE (v1.0.0) - Would fail validation
{
  scheduleType: 'RRULE',
  rrule: 'FREQ=DAILY;INTERVAL=1',
  startAtUtc: '2025-10-22T09:00:00Z'  // ❌ Forbidden
}

// AFTER (v1.0.1) - Now valid
{
  scheduleType: 'RRULE',
  rrule: 'FREQ=DAILY;INTERVAL=1',
  startAtUtc: '2025-10-22T09:00:00Z'  // ✅ Optional
}

// AFTER (v1.0.1) - Also valid (uses current time as anchor)
{
  scheduleType: 'RRULE',
  rrule: 'FREQ=DAILY;INTERVAL=1'
  // startAtUtc omitted - uses now() as anchor
}
```

**Priority Field**:
```typescript
// BEFORE (v1.0.0) - Would be accepted
{
  scheduleType: 'ONCE',
  startAtUtc: '2025-10-22T09:00:00Z',
  priority: 5  // ❌ Removed in v1.0.1
}

// AFTER (v1.0.1) - Remove priority
{
  scheduleType: 'ONCE',
  startAtUtc: '2025-10-22T09:00:00Z'
  // priority removed
}
```

#### For Service Implementation

**RRULE Validation**:
```typescript
// Update validation logic
if (scheduleType === 'RRULE') {
  if (!rrule) {
    throw new ValidationError('RRULE schedules require rrule');
  }
  if (cronExpr) {
    throw new ValidationError('RRULE schedules cannot have cronExpr');
  }
  // startAtUtc is now optional (was forbidden)
  // If not provided, use current time as anchor
  if (!startAtUtc) {
    startAtUtc = new Date();
  }
}
```

**Priority Handling**:
```typescript
// Remove priority-based sorting
// BEFORE
const runs = await db.query(
  'SELECT * FROM schedule_runs WHERE status = $1 ORDER BY priority DESC, due_at_utc',
  ['DUE']
);

// AFTER
const runs = await db.query(
  'SELECT * FROM schedule_runs WHERE status = $1 ORDER BY due_at_utc',
  ['DUE']
);
```

---

## Backward Compatibility

### Breaking Changes

1. **RRULE startAtUtc** ⚠️
   - **Impact**: Clients relying on validation error will no longer receive error
   - **Mitigation**: Update client validation logic
   - **Severity**: Low (unlikely clients rely on this error)

2. **Priority Field Removed** ⚠️
   - **Impact**: Clients sending `priority` will receive validation error
   - **Mitigation**: Remove `priority` from client requests
   - **Severity**: Medium (if clients use priority)

### Non-Breaking Changes

1. **Validation Description** ✅
   - Documentation update only
   - No API behavior change

---

## Future Roadmap

### Phase 2 (Planned)

**Priority Support**:
- Add `priority` field back
- Implement priority queue
- Weighted round-robin to prevent starvation

**Advanced Misfire Policies**:
- `FIRE_AND_PROCEED` - Fire + continue schedule
- `RESCHEDULE_WITH_REMAINING_COUNT` - Reschedule with count

**Backfill Endpoint**:
- `POST /api/v1/schedules:backfill`
- Recover from downtime

**Pause/Resume**:
- `POST /api/v1/schedules/{id}:pause`
- `POST /api/v1/schedules/{id}:resume`

---

## Contact

For questions or feedback:
- **Team**: Hospital Management System V2
- **Email**: support@hospital-v2.com
- **Slack**: #scheduler-service

