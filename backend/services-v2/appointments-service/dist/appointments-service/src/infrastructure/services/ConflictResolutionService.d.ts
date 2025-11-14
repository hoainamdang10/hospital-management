/**
 * Conflict Resolution Service Implementation
 * Handles appointment conflicts and suggests alternatives
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
import { IConflictResolutionService, ConflictCheckRequest, ConflictCheckResponse, FindAlternativeSlotsRequest, FindAlternativeSlotsResponse, TimeSlotSuggestion } from '../../application/services/IConflictResolutionService';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
/**
 * Conflict Resolution Service Implementation
 */
export declare class ConflictResolutionService implements IConflictResolutionService {
    private readonly appointmentRepository;
    constructor(appointmentRepository: IAppointmentRepository);
    /**
     * Check for scheduling conflicts
     */
    checkConflicts(request: ConflictCheckRequest): Promise<ConflictCheckResponse>;
    /**
     * Find alternative time slots
     */
    findAlternativeSlots(request: FindAlternativeSlotsRequest): Promise<FindAlternativeSlotsResponse>;
    /**
     * Suggest nearest available slot
     */
    suggestNearestAvailableSlot(doctorId: string, preferredTime: Date, durationMinutes: number): Promise<TimeSlotSuggestion | null>;
    /**
     * Suggest alternative doctors in same department
     */
    suggestAlternativeDoctors(departmentId: string, preferredTime: Date, durationMinutes: number, maxSuggestions?: number): Promise<TimeSlotSuggestion[]>;
    /**
     * Generate alternative slots for same day
     */
    private findSameDayAlternatives;
    /**
     * Generate alternative slots for next day
     */
    private findNextDayAlternatives;
    /**
     * Check if time slot is available
     */
    private isSlotAvailable;
    /**
     * Calculate confidence score (0-100)
     */
    private calculateConfidence;
    /**
     * Generate human-readable reason text
     */
    private generateReasonText;
    /**
     * Generate alternative slots
     */
    private generateAlternativeSlots;
    /**
     * Find available time slots for scheduling
     * Used by event consumers for waitlist management
     */
    findAvailableTimeSlots(providerId: string, date: Date, duration: number): Promise<{
        startTime: Date;
        endTime: Date;
    }[]>;
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
    /**
     * Helper method to find available providers for urgent appointments
     */
    private findAvailableProvidersForUrgent;
}
//# sourceMappingURL=ConflictResolutionService.d.ts.map