# Waitlist System - Archived for Post-MVP

## Why Removed from MVP

The appointment waitlist system has been archived for the following reasons:

### Complexity vs. Value
- **5 use cases** with complex business logic
- **Low practical usage** in Vietnamese healthcare context
- **High maintenance cost** for limited benefit

### Missing Infrastructure
- **Cron job required**: Auto-matching waitlist entries to available slots (not implemented)
- **Complex notification system**: Real-time alerts when slots become available
- **Scheduler service**: Background job processing (removed from V2)

### Better Alternative for MVP
Use **ConflictResolutionService** to suggest alternative slots immediately when booking conflicts occur. This provides:
- Instant feedback to users
- No background processing needed
- Simpler implementation
- Same user benefit

## Archived Files

### Domain Layer (2 files)
- `domain/entities/AppointmentWaitlist.entity.ts` - Waitlist aggregate entity
- `domain/repositories/IAppointmentWaitlistRepository.ts` - Repository interface

### Application Layer (5 use cases)
- `application/use-cases/AddToWaitlistUseCase.ts` - Add patient to waitlist
- `application/use-cases/GetWaitlistUseCase.ts` - Query waitlist entries
- `application/use-cases/UpdateWaitlistEntryUseCase.ts` - Update entry status
- `application/use-cases/RemoveFromWaitlistUseCase.ts` - Remove from waitlist
- `application/use-cases/ConvertWaitlistToAppointmentUseCase.ts` - Convert to appointment

### Infrastructure Layer (1 file)
- `infrastructure/repositories/SupabaseAppointmentWaitlistRepository.ts` - Database implementation

### Presentation Layer (2 files)
- `presentation/controllers/WaitlistController.ts` - HTTP controller
- `presentation/routes/waitlist.routes.ts` - API routes

## Database Migration Status

**Migration 018** (`018_create_appointment_waitlist.sql`) has been **KEPT** in the migrations folder. The database table still exists and is not dropped. This allows for easier restoration if needed post-MVP.

## Restoration Plan (Post-MVP)

To restore waitlist functionality:

1. **Move files back** from `_archived_for_post_mvp/waitlist/` to their original locations
2. **Implement cron job** for auto-matching waitlist to available slots
3. **Integrate with Notifications service** for real-time alerts
4. **Uncomment container.ts registrations**
5. **Run integration tests**
6. **Deploy with monitoring**

## Estimated LOC Removed

Approximately **~1,500 lines** of code removed from active codebase, including:
- Domain logic: ~300 LOC
- Use cases: ~800 LOC
- Infrastructure: ~200 LOC
- Presentation: ~200 LOC

## Date Archived

**2025-11-15** (Phase 2 refactoring - Simplify for MVP)

## References

- Phase 2 Implementation Plan
- [ConflictResolutionService.ts](../../../infrastructure/services/ConflictResolutionService.ts) - Alternative solution
- [Migration 018](../../../../migrations/018_create_appointment_waitlist.sql) - Database schema (kept)
