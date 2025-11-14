/**
 * Conflict Resolution Service Interface
 * Handles appointment scheduling conflicts and suggests alternatives
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

export interface ConflictInfo {
  appointmentId: string;
  startTime: Date;
  endTime: Date;
  reason: string;
}

export interface TimeSlotSuggestion {
  startTime: Date;
  endTime: Date;
  doctorId: string;
  doctorName?: string;
  confidence: number; // 0-100: how well it matches original request
  reason: string;
}

export interface ConflictCheckRequest {
  doctorId: string;
  startTime: Date;
  endTime: Date;
  excludeAppointmentId?: string;
}

export interface ConflictCheckResponse {
  hasConflicts: boolean;
  conflicts: ConflictInfo[];
  suggestions?: TimeSlotSuggestion[];
}

export interface FindAlternativeSlotsRequest {
  doctorId: string;
  departmentId?: string;
  preferredDate: Date;
  durationMinutes: number;
  priority?: string;
  maxSuggestions?: number;
}

export interface FindAlternativeSlotsResponse {
  suggestions: TimeSlotSuggestion[];
  totalFound: number;
}

/**
 * Conflict Resolution Service Interface
 */
export interface IConflictResolutionService {
  /**
   * Check for scheduling conflicts
   */
  checkConflicts(request: ConflictCheckRequest): Promise<ConflictCheckResponse>;

  /**
   * Find alternative time slots when conflict exists
   */
  findAlternativeSlots(
    request: FindAlternativeSlotsRequest
  ): Promise<FindAlternativeSlotsResponse>;

  /**
   * Suggest nearest available slot
   */
  suggestNearestAvailableSlot(
    doctorId: string,
    preferredTime: Date,
    durationMinutes: number
  ): Promise<TimeSlotSuggestion | null>;

  /**
   * Suggest alternative doctors in same department
   */
  suggestAlternativeDoctors(
    departmentId: string,
    preferredTime: Date,
    durationMinutes: number,
    maxSuggestions?: number
  ): Promise<TimeSlotSuggestion[]>;

  // ==================== MISSING METHODS FROM COMPILE ERRORS ====================

  /**
   * Find available time slots for scheduling
   * Used by event consumers for waitlist management
   */
  findAvailableTimeSlots(
    providerId: string,
    date: Date,
    duration: number
  ): Promise<{ startTime: Date; endTime: Date }[]>;

  /**
   * Find urgent appointment slot
   * Finding urgent slots is appointment scheduling responsibility
   */
  findUrgentAppointmentSlot(criteria: {
    departmentId?: string;
    urgency: 'urgent' | 'emergency';
    preferredTime?: Date;
    durationMinutes: number;
    patientId: string;
  }): Promise<{
    startTime: Date;
    endTime: Date;
    providerId: string;
    departmentId: string;
    confidence: number;
  } | null>;
}

