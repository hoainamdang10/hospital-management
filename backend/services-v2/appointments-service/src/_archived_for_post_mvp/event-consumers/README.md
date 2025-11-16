# Event Consumers - Archived for Post-MVP

## Why Removed from MVP

The BillingEventConsumer and ClinicalEMREventConsumer have been disabled for the following reasons:

### BillingEventConsumer

**Status**: Billing service is only 50% complete

**Missing Dependencies**:
- Billing service is incomplete and not operational
- No real billing events being published yet
- Pre-authorization workflow not implemented
- Insurance verification system not ready
- Billing rate updates not configured

**Events Handled** (would handle if enabled):
- `PreAuthorizationRequested` - Tracks pre-auth requests
- `PreAuthorizationApproved` - Processes pre-auth approvals
- `PreAuthorizationDenied` - Handles pre-auth denials
- `BillingRateUpdated` - Updates appointment billing rates
- `InsuranceCoverageVerified` - Updates patient insurance coverage

**Repository Methods Used** (still available for future use):
- `IQueueRepository.addToPreAuthTrackingQueue()` - Track pre-auth requests
- `IQueueRepository.updatePreAuthTracking()` - Update pre-auth status
- `IAppointmentRepository.updateBillingRates()` - Update billing rates
- `IAppointmentRepository.updatePatientInsuranceCoverage()` - Update insurance info

**Impact**:
- ✅ No impact on MVP - Billing integration not required for core appointment scheduling
- ✅ Appointments can still be scheduled, confirmed, and completed without billing
- ✅ Manual billing can be handled outside the system initially

### ClinicalEMREventConsumer

**Status**: Already disabled in previous refactoring

**Reason**:
- Clinical EMR service is 60% complete
- Presentation layer (controllers/routes) not implemented
- FHIR R4 compliance not verified
- Focus on core appointment scheduling for MVP

**Impact**:
- ✅ No impact on MVP - Clinical records can be added post-appointment
- ✅ Appointments work independently of EMR integration
- ✅ Manual record-keeping possible during MVP phase

## Better Alternative for MVP

**Simplified Workflow**:
1. Schedule appointments without billing/clinical integration
2. Complete appointments and mark them as done
3. Handle billing and clinical records manually or via separate workflows
4. Add full integration post-MVP when services are complete

**Benefits**:
- Faster MVP deployment
- Reduced complexity and dependencies
- Focus on core appointment scheduling functionality
- Easier debugging and monitoring
- Better service isolation

## Disabled Code Locations

### container.ts (DI Container)
- **Lines 67-69**: Import statements commented out
- **Lines 223-225**: Private field declarations commented out
- **Lines 752-768**: Initialization code commented out
- **Lines 776**: Console log updated (6 → 4 event handlers)
- **Lines 1101-1110**: Getter method commented out

### main.ts (Service Entry Point)
- **Lines 368-370**: Initialization code removed
- **Lines 403-405**: Disconnection code removed

### index.ts (Events Exports)
- **Lines 35-37**: Exports commented out

## Files Not Removed

The actual consumer files remain in the codebase but are not instantiated:
- `infrastructure/events/BillingEventConsumer.ts` (~341 LOC)
- `infrastructure/events/ClinicalEMREventConsumer.ts` (~XXX LOC)

JSDoc comments in repository interfaces also remain to document usage:
- `application/services/IReminderService.ts` - "Used by BillingEventConsumer" comments
- `domain/repositories/IAppointmentRepository.ts` - "Used by BillingEventConsumer" comments
- `domain/repositories/IQueueRepository.ts` - "Used by BillingEventConsumer" comments

These comments are useful for future developers to understand the purpose of these methods.

## Restoration Plan (Post-MVP)

To restore event consumers when services are ready:

### For BillingEventConsumer:
1. **Complete Billing Service** (currently 50%)
   - Implement payment lifecycle features
   - Add Vietnamese VAT calculation
   - Complete pre-authorization workflow
   - Add insurance verification system
   - Achieve 80%+ test coverage

2. **Uncomment code** in:
   - container.ts (import, field, initialization, getter)
   - main.ts (initialization, disconnection)
   - index.ts (export)

3. **Verify Billing Events** are being published correctly

4. **Test integration** end-to-end:
   - Schedule appointment → Pre-auth request
   - Pre-auth approval → Appointment confirmed
   - Rate updates → Appointments updated
   - Insurance verification → Coverage validated

5. **Monitor** for event processing errors

### For ClinicalEMREventConsumer:
1. **Complete Clinical EMR Service** (currently 60%)
   - Implement presentation layer (controllers/routes)
   - Verify FHIR R4 compliance
   - Add ICD-10/SNOMED CT coding
   - Complete integration tests

2. **Follow same uncomment process** as Billing

3. **Test appointment → EMR record creation workflow**

## Current Event Handler Count

**MVP Scope**: 4 active event handlers
1. AppointmentReadModelEventHandler (internal)
2. PatientEventConsumer (Pure Outbox)
3. ProviderEventConsumer (Pure Outbox)
4. StaffEventConsumer (RabbitMQ)
5. DepartmentEventConsumer (RabbitMQ)

**Disabled for MVP**: 2 event handlers
- ❌ BillingEventConsumer - Billing service incomplete (50%)
- ❌ ClinicalEMREventConsumer - Clinical service incomplete (60%)

## Estimated LOC Impact

Code **commented** (not deleted):
- container.ts: ~35 LOC
- main.ts: ~10 LOC
- index.ts: ~2 LOC

**Total**: ~47 LOC commented out

Code **retained** but not instantiated:
- BillingEventConsumer.ts: ~341 LOC
- ClinicalEMREventConsumer.ts: ~XXX LOC (to be confirmed)

## Date Archived

**2025-11-15** (Phase 2.3 - Disable non-operational event consumers)

## References

- Phase 2 Implementation Plan
- Billing Service Status: 50% complete (see CLAUDE.md)
- Clinical EMR Service Status: 60% complete (see CLAUDE.md)
- Alternative: Manual billing and clinical record handling during MVP
- Related: Phase 2.1 (Waitlist removal), Phase 2.2 (BulkReschedule removal)
