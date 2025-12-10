/**
 * Appointment Event Adapter
 * Maps appointment events to use case requests with type safety
 *
 *  COMPILE-TIME SAFE: TypeScript enforces interface compatibility
 *  CENTRALIZED: Single source of truth for mapping logic
 *  TESTABLE: Unit tests verify conversions
 *  TOLERANT READER: Handles missing optional fields gracefully
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { CreateAppointmentRemindersRequest } from "../../../application/use-cases/CreateAppointmentRemindersUseCase";
import {
  AppointmentConfirmedEventData,
  AppointmentScheduledEventData,
} from "../AppointmentEventConsumer";

/**
 * Notification Preferences (subset for mapping)
 */
interface NotificationPreferencesSubset {
  phoneNumber?: string; //  Match actual field name
  email?: string;
  language?: string; //  Match actual field name
  preferredChannels?: string[];
}

/**
 * Appointment Event Adapter
 * Type-safe mapping functions for appointment events
 */
export class AppointmentEventAdapter {
  /**
   * Map AppointmentConfirmedEvent to CreateAppointmentRemindersRequest
   *
   *  Type conversions:
   * - appointmentDate: string → Date object
   * - Remove fields not in interface
   * - Add default values for optional fields
   *
   * @param event - AppointmentConfirmedEvent data from Appointments Service
   * @param preferences - Optional notification preferences
   * @returns Typed request matching exact CreateAppointmentRemindersRequest interface
   */
  static toCreateRemindersRequest(
    event: AppointmentConfirmedEventData,
    preferences?: NotificationPreferencesSubset | null
  ): CreateAppointmentRemindersRequest {
    // ===== TYPE CONVERSION: String to Date =====
    const appointmentDate =
      typeof event.appointmentDate === "string"
        ? new Date(event.appointmentDate)
        : event.appointmentDate;

    // ===== MAP TO EXACT INTERFACE =====
    //  TypeScript will error if interface changes
    const request: CreateAppointmentRemindersRequest = {
      appointmentId: event.appointmentId,
      tenantId: "hospital-1",

      // Patient information
      patientId: event.patientId,
      patientName: event.patientName || undefined,
      patientPhone: preferences?.phoneNumber || undefined,
      patientEmail: preferences?.email || undefined,
      patientLanguage: preferences?.language || "vi",

      // Doctor information
      doctorId: event.doctorId,
      doctorName: event.doctorName || undefined,
      doctorSpecialization: undefined, // Not available in confirmed event

      // Appointment details
      appointmentDate, //  Date object (converted)
      appointmentTime: event.appointmentTime,
      appointmentType: undefined, // Not available in confirmed event
      reason: undefined,
    };

    return request;
  }

  /**
   * Map AppointmentScheduledEvent to CreateAppointmentRemindersRequest
   *
   *  NOTE: In MVP, reminders are created from appointment.confirmed, not scheduled
   * This is kept for future use if flow changes
   */
  static toCreateRemindersFromScheduled(
    event: AppointmentScheduledEventData,
    preferences?: NotificationPreferencesSubset | null
  ): CreateAppointmentRemindersRequest {
    const appointmentDate =
      typeof event.appointmentDate === "string"
        ? new Date(event.appointmentDate)
        : (event.appointmentDate as Date);

    return {
      appointmentId: event.appointmentId,
      tenantId: "hospital-1",

      // Patient information
      patientId: event.patientId,
      patientName: event.patientName || undefined,
      patientPhone: preferences?.phoneNumber || undefined,
      patientEmail: preferences?.email || undefined,
      patientLanguage: preferences?.language || "vi",
      
      // Doctor information
      doctorId: event.doctorId,
      doctorName: event.doctorName || undefined,
      doctorSpecialization: undefined,
      
      // Appointment details
      appointmentDate,
      appointmentTime: event.appointmentTime,
      appointmentType: event.type || undefined,
      reason: event.notes || undefined,
      };
      }

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
  } {
    const errors: string[] = [];

    // Required fields
    if (!request.appointmentId) {
      errors.push("appointmentId is required");
    }
    if (!request.patientId) {
      errors.push("patientId is required");
    }
    if (!request.appointmentDate) {
      errors.push("appointmentDate is required");
    }
    if (!request.appointmentTime) {
      errors.push("appointmentTime is required");
    }

    // Type validation
    if (request.appointmentDate && !(request.appointmentDate instanceof Date)) {
      errors.push("appointmentDate must be a Date object");
    }

    // Contact method validation
    if (!request.patientPhone && !request.patientEmail) {
      errors.push(
        "Patient must have at least one contact method (phone or email)"
      );
    }

    // Appointment date in future
    if (request.appointmentDate && request.appointmentDate <= new Date()) {
      errors.push("Appointment date must be in the future");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
