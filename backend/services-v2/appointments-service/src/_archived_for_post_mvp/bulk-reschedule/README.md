# Bulk Reschedule System - Archived for Post-MVP

## Why Removed from MVP

The bulk reschedule appointments feature has been archived for the following reasons:

### Complexity vs. Value
- **Incomplete implementation**: Only skeleton logic (marks appointments as "pending_patient_confirmation")
- **Low practical usage**: Bulk rescheduling rarely occurs in Vietnamese healthcare context
- **High maintenance cost**: Complex workflow requiring multiple integrations

### Missing Infrastructure
- **Notification system required**: Multi-channel notifications (SMS, email, in-app) to all affected patients
- **Alternative slot finder**: Smart algorithm to find suitable alternatives for all patients
- **Confirmation tracking**: System to track patient confirmations and auto-reschedule
- **Rollback mechanism**: If some patients can't find alternatives, need partial rollback
- **Audit trail**: Track all bulk operations for compliance

### Better Alternative for MVP
**Manual rescheduling workflow**:
1. Admin/doctor cancels appointments one by one using `CancelAppointmentUseCase`
2. Each cancellation triggers notification to patient
3. Patient can book new appointment via normal scheduling flow
4. Provides better control and flexibility

**Benefits**:
- Uses existing, tested infrastructure
- Better patient experience (personal attention)
- No complex coordination logic needed
- Easier to debug and monitor

## Archived Files

### Application Layer (1 use case)
- `application/use-cases/BulkRescheduleAppointments.use-case.ts` - Bulk reschedule use case (~180 LOC)

### Related Code (Not Removed)
The following code references BulkReschedule but will be commented out:
- `infrastructure/di/container.ts` - DI registration
- `infrastructure/services/AuthorizationService.ts` - `canBulkReschedule()` method
- `application/services/IAuthorizationService.ts` - Interface definition
- `presentation/controllers/AppointmentController.ts` - Controller method
- `presentation/routes/appointment.routes.ts` - Route registration

## Restoration Plan (Post-MVP)

To restore bulk reschedule functionality:

1. **Move file back** from `_archived_for_post_mvp/bulk-reschedule/` to `application/use-cases/`
2. **Implement notification system** for batch SMS/email to patients
3. **Implement alternative slot finder** that works for multiple patients
4. **Add confirmation tracking system** to manage patient responses
5. **Add rollback mechanism** for partial failures
6. **Implement comprehensive audit logging** for compliance
7. **Uncomment container.ts registrations**
8. **Write integration tests**
9. **Deploy with monitoring**

## Estimated LOC Removed

Approximately **~200 lines** of code removed from active codebase:
- Use case: ~180 LOC
- Comments in DI container: ~20 LOC (will be added)

## Date Archived

**2025-11-15** (Phase 2 refactoring - Simplify for MVP)

## References

- Phase 2 Implementation Plan
- Alternative: Use individual `CancelAppointmentUseCase` + normal scheduling
- [AuthorizationService.canBulkReschedule()](../../infrastructure/services/AuthorizationService.ts) - Authorization check (will be commented)
