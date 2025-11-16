/**
 * Appointment Event Adapter
 * Maps appointment events to use case requests with type safety
 *
 * ✅ COMPILE-TIME SAFE: TypeScript enforces interface compatibility
 * ✅ CENTRALIZED: Single source of truth for mapping logic
 * ✅ TESTABLE: Unit tests verify conversions
 * ✅ TOLERANT READER: Handles missing optional fields gracefully
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { CreateAppointmentRemindersRequest } from "../../../application/use-cases/CreateAppointmentRemindersUseCase";
import { AppointmentConfirmedEventData, AppointmentScheduledEventData } from "../AppointmentEventConsumer";
/**
 * Notification Preferences (subset for mapping)
 */
interface NotificationPreferencesSubset {
    phoneNumber?: string;
    email?: string;
    language?: string;
    preferredChannels?: string[];
}
/**
 * Appointment Event Adapter
 * Type-safe mapping functions for appointment events
 */
export declare class AppointmentEventAdapter {
    /**
     * Map AppointmentConfirmedEvent to CreateAppointmentRemindersRequest
     *
     * ✅ Type conversions:
     * - appointmentDate: string → Date object
     * - Remove fields not in interface
     * - Add default values for optional fields
     *
     * @param event - AppointmentConfirmedEvent data from Appointments Service
     * @param preferences - Optional notification preferences
     * @returns Typed request matching exact CreateAppointmentRemindersRequest interface
     */
    static toCreateRemindersRequest(event: AppointmentConfirmedEventData, preferences?: NotificationPreferencesSubset | null): CreateAppointmentRemindersRequest;
    /**
     * Map AppointmentScheduledEvent to CreateAppointmentRemindersRequest
     *
     * ⚠️ NOTE: In MVP, reminders are created from appointment.confirmed, not scheduled
     * This is kept for future use if flow changes
     */
    static toCreateRemindersFromScheduled(event: AppointmentScheduledEventData, preferences?: NotificationPreferencesSubset | null): CreateAppointmentRemindersRequest;
    /**
     * Validate CreateAppointmentRemindersRequest
     * Runtime validation to catch data issues early
     *
     * @param request - Request to validate
     * @returns Validation result with error messages
     */
    static validateRemindersRequest(request: CreateAppointmentRemindersRequest): {
        valid: boolean;
        errors: string[];
    };
}
export {};
//# sourceMappingURL=AppointmentEventAdapter.d.ts.map