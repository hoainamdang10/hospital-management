# Contract Review Checklist - Scheduler Service

## Overview

This checklist helps review the Scheduler Service contract before implementation.

**Review Date**: _____________
**Reviewers**: _____________
**Status**: [ ] Draft | [ ] In Review | [ ] Approved | [ ] Rejected

---

## 1. OpenAPI Specification Review

**File**: `docs/openapi.yaml`

### 1.1. Endpoints

- [ ] **POST /api/v1/schedules:createOrUpdateByDedup**
  - [ ] Request schema complete and correct
  - [ ] Response schema complete and correct
  - [ ] Idempotency behavior documented
  - [ ] Validation rules clear (mutual exclusive by scheduleType)
  - [ ] Error responses documented
  - [ ] Examples provided

- [ ] **POST /api/v1/schedules:cancelByOwner**
  - [ ] Uses POST (not DELETE with body) ✅
  - [ ] Request schema includes ownerService, ownerResourceType, ownerResourceId
  - [ ] Response includes cancelledCount and cancelledScheduleIds
  - [ ] Behavior documented (cancels DUE runs, keeps RUNNING runs)

- [ ] **GET /api/v1/schedules/{scheduleId}**
  - [ ] Path parameter validated (UUID)
  - [ ] Response includes all schedule fields
  - [ ] 404 error documented

- [ ] **POST /api/v1/schedules/{scheduleId}:runNow**
  - [ ] Constraints documented (only ACTIVE schedules)
  - [ ] Response includes runId and status
  - [ ] 409 error for non-ACTIVE schedules

- [ ] **GET /api/v1/schedules/{scheduleId}/runs**
  - [ ] Query parameters documented (status, fromUtc, toUtc, limit, cursor)
  - [ ] Pagination implemented (cursor-based)
  - [ ] Response includes runs array and pagination metadata

### 1.2. Schemas

- [ ] **CreateScheduleRequest**
  - [ ] All required fields marked
  - [ ] Mutual exclusive validation documented
  - [ ] Future-proof fields included (misfirePolicy, graceWindowMs, priority)
  - [ ] Examples for each scheduleType (ONCE, CRON, RRULE)

- [ ] **RetryPolicy**
  - [ ] Strategy enum complete (exp, linear, fixed)
  - [ ] Validation rules documented (maxAttempts > 0, baseMs > 0)

- [ ] **ScheduleResponse**
  - [ ] All fields documented
  - [ ] nextRunAtUtc nullable (null if no future runs)

- [ ] **ErrorResponse**
  - [ ] Error codes complete
  - [ ] trace_id included for debugging
  - [ ] details object for additional context

### 1.3. Headers

- [ ] **X-Tenant-Id** (required)
  - [ ] Must match tenantId in body
  - [ ] Validation documented

- [ ] **X-Correlation-Id** (optional)
  - [ ] Auto-generated if missing
  - [ ] Propagated to response

- [ ] **X-Idempotency-Key** (optional)
  - [ ] For network-level retries
  - [ ] Separate from dedupKey

- [ ] **X-Trace-Id** (response)
  - [ ] Included in all responses
  - [ ] For debugging

### 1.4. Authentication

- [ ] JWT required (except /health)
- [ ] aud=scheduler
- [ ] scope=scheduling.write | scheduling.read
- [ ] tenant_id claim validated

### 1.5. Error Handling

- [ ] **400 Validation Error**
  - [ ] Clear error messages
  - [ ] Field-level details

- [ ] **401 Unauthorized**
  - [ ] Invalid/missing JWT

- [ ] **403 Forbidden**
  - [ ] Insufficient permissions
  - [ ] Tenant mismatch

- [ ] **404 Not Found**
  - [ ] Resource not found

- [ ] **409 Conflict**
  - [ ] Schedule not ACTIVE (for runNow)

- [ ] **429 Rate Limited**
  - [ ] Rate limit headers included
  - [ ] Retry-After header

- [ ] **500 Internal Error**
  - [ ] Generic error message
  - [ ] trace_id for debugging

---

## 2. Message Bus Contract Review

**File**: `docs/message-contract.md`

### 2.1. Event Schema

- [ ] **Headers** (RabbitMQ properties)
  - [ ] correlation_id (UUID v4)
  - [ ] causation_id (schedule_id)
  - [ ] schedule_id (UUID v4)
  - [ ] run_id (UUID v4)
  - [ ] tenant_id (string)
  - [ ] idempotency_key (format: sched:{schedule_id}:{run_id})
  - [ ] emitted_at (ISO 8601)
  - [ ] timestamp (ISO 8601 - due_at_utc)
  - [ ] schema_version ("v1")
  - [ ] content_type ("application/json")
  - [ ] event_type ("schedule.run.due")

- [ ] **Payload** (RabbitMQ body)
  - [ ] scheduleId (UUID v4)
  - [ ] runId (UUID v4)
  - [ ] tenantId (string)
  - [ ] dueAtUtc (ISO 8601)
  - [ ] topicOrCommand (routing key)
  - [ ] payloadJson (original payload)
  - [ ] attempt (0-based)

### 2.2. Topic Naming

- [ ] Format: `{ownerService}.{resourceType}.{action}`
- [ ] Examples provided for all services
- [ ] Naming convention clear and consistent

### 2.3. Idempotency

- [ ] Idempotency key format documented
- [ ] Purpose explained (Inbox pattern)
- [ ] Consumer usage examples provided

### 2.4. Event Types

- [ ] `schedule.run.due` documented
- [ ] Routing key = topicOrCommand
- [ ] Headers and payload examples provided

### 2.5. Versioning

- [ ] Current version: v1
- [ ] Schema evolution strategy documented
- [ ] Backward compatibility rules

---

## 3. Topic Allowlist Review

**File**: `config/topic-allowlist.json`

### 3.1. Services

- [ ] **appointments**
  - [ ] All required topics listed
  - [ ] Wildcards appropriate (appointments.appointment.reminder.*)

- [ ] **billing**
  - [ ] All required topics listed
  - [ ] Wildcards appropriate (billing.invoice.generate.*, billing.payment.*)

- [ ] **notifications**
  - [ ] All required topics listed
  - [ ] Wildcard appropriate (notifications.*)

- [ ] **clinical**
  - [ ] All required topics listed
  - [ ] Wildcards appropriate (clinical.prescription.*)

- [ ] **patient-registry**
  - [ ] All required topics listed
  - [ ] Wildcards appropriate (patient-registry.patient.*)

### 3.2. Validation

- [ ] Topic format regex correct
- [ ] Service match rule documented
- [ ] Allowlist check rule documented

### 3.3. Examples

- [ ] Valid examples provided
- [ ] Invalid examples provided
- [ ] Reasons explained

---

## 4. Consumer Guide Review

**File**: `docs/consumer-guide.md`

### 4.1. Inbox Pattern

- [ ] Table schema provided
- [ ] Unique constraint on idempotency_key
- [ ] Indexes documented (unprocessed, processed)

### 4.2. Handler Pattern

- [ ] Check inbox for duplicate
- [ ] Insert inbox + process in transaction
- [ ] Mark as processed
- [ ] Error handling (transient vs permanent)

### 4.3. Best Practices

- [ ] Idempotency explained
- [ ] Error handling strategies
- [ ] Timeout handling
- [ ] Monitoring metrics

### 4.4. Troubleshooting

- [ ] Duplicate events
- [ ] Inbox growing unbounded
- [ ] Processing stuck

### 4.5. Examples

- [ ] Complete code examples
- [ ] RabbitMQ setup
- [ ] Event handler implementation
- [ ] Business logic examples

---

## 5. Cross-Cutting Concerns

### 5.1. Security

- [ ] JWT authentication required
- [ ] Tenant isolation enforced (X-Tenant-Id)
- [ ] No sensitive data in logs
- [ ] Audit logging for all operations

### 5.2. Performance

- [ ] Pagination for list endpoints
- [ ] Cursor-based pagination (not offset)
- [ ] Rate limiting documented
- [ ] Timeout handling

### 5.3. Observability

- [ ] Trace IDs in all responses
- [ ] Correlation IDs propagated
- [ ] Metrics documented (consumer guide)
- [ ] Health check endpoint

### 5.4. Reliability

- [ ] Idempotency for all write operations
- [ ] Retry policies documented
- [ ] Error handling comprehensive
- [ ] Dead letter queue for failed events

### 5.5. Scalability

- [ ] Stateless API design
- [ ] Horizontal scaling supported
- [ ] Database constraints prevent duplicates
- [ ] Worker segmentation (0-9)

---

## 6. Integration Points

### 6.1. Appointments Service

- [ ] Topics defined (reminder.24h, reminder.2h, cancelled)
- [ ] Payload schema documented
- [ ] Use cases clear

### 6.2. Billing Service

- [ ] Topics defined (invoice.generate.monthly, payment.reminder)
- [ ] Payload schema documented
- [ ] Use cases clear

### 6.3. Notifications Service

- [ ] Topics defined (email.send, sms.send, alert.send)
- [ ] Payload schema documented
- [ ] Use cases clear

### 6.4. Clinical Service

- [ ] Topics defined (prescription.refill.reminder, lab.result.check)
- [ ] Payload schema documented
- [ ] Use cases clear

### 6.5. Patient Registry Service

- [ ] Topics defined (followup.reminder, birthday.greeting)
- [ ] Payload schema documented
- [ ] Use cases clear

---

## 7. Documentation Quality

- [ ] Clear and concise
- [ ] Examples provided
- [ ] Edge cases documented
- [ ] Error scenarios covered
- [ ] Diagrams/visuals (if needed)

---

## 8. Backward Compatibility

- [ ] Schema versioning strategy
- [ ] Deprecation policy
- [ ] Migration guide (for future changes)

---

## 9. Testing Strategy

- [ ] Unit tests planned
- [ ] Integration tests planned
- [ ] Contract tests planned (OpenAPI validation)
- [ ] E2E tests planned

---

## 10. Deployment Considerations

- [ ] Database migrations documented
- [ ] Environment variables documented
- [ ] Rollback strategy
- [ ] Monitoring/alerting

---

## Review Outcome

### Approved

- [ ] Contract approved as-is
- [ ] Ready for Phase 2 (SDK implementation)

### Approved with Minor Changes

- [ ] Changes required: _____________
- [ ] Re-review needed: [ ] Yes | [ ] No

### Rejected

- [ ] Major issues found: _____________
- [ ] Re-design required

---

## Action Items

| Item | Owner | Due Date | Status |
|------|-------|----------|--------|
| | | | |
| | | | |
| | | | |

---

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Backend Lead** | | | |
| **Frontend Lead** | | | |
| **DevOps Lead** | | | |
| **Product Owner** | | | |

---

## Notes

_Add any additional notes or comments here_

---

**Next Steps After Approval**:

1. **Phase 2**: Implement SDK Client + Adapter (0.5-1 day)
2. **Phase 3**: Implement MVP - Vertical Slice (1-2 days)
3. **Integration**: Integrate with domain services
4. **Testing**: End-to-end testing
5. **Deployment**: Production deployment

---

**Contact**: support@hospital-v2.com | #scheduler-service

