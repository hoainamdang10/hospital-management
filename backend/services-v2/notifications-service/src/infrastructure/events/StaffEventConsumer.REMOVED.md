# StaffEventConsumer - REMOVED

**Status**: ❌ Removed from MVP scope  
**Date**: 2025-11-16  
**Reason**: Staff notifications handled through AppointmentEventConsumer

## Why Removed

Staff-related notifications are now handled through `AppointmentEventConsumer`:
- Doctor receives notification when appointment confirmed
- Doctor receives notification when appointment cancelled
- No need for separate staff schedule/shift notifications in MVP

## Original Functionality

This consumer handled:
- Staff schedule notifications
- Shift assignment notifications
- Staff availability changes
- Department assignments

## Current Implementation

Doctor notifications now handled in:
- `AppointmentEventConsumer.handleAppointmentConfirmed()` - sends to doctor
- `AppointmentEventConsumer.handleAppointmentCancelled()` - sends to doctor

Using `recipientType: 'DOCTOR'` with same templates.

## Migration Impact

- No database changes
- No API changes
- Doctor notifications still working (via AppointmentEventConsumer)
- Reduced code complexity
