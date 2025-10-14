/**
 * AppointmentDetails Value Object - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 * Matches database columns: reason, chief_complaint, symptoms, notes, special_instructions
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */
import { HealthcareValueObject } from '@shared/domain/base/value-object';
export interface AppointmentDetailsProps {
    reason?: string;
    chiefComplaint?: string;
    symptoms?: string[];
    notes?: string;
    specialInstructions?: string;
}
/**
 * AppointmentDetails Value Object
 * Contains clinical information about the appointment
 */
export declare class AppointmentDetails extends HealthcareValueObject<AppointmentDetailsProps> {
    private constructor();
    /**
     * Create AppointmentDetails
     */
    static create(reason?: string, chiefComplaint?: string, symptoms?: string[], notes?: string, specialInstructions?: string): AppointmentDetails;
    /**
     * Create empty details
     */
    static empty(): AppointmentDetails;
    /**
     * Validate value object format (required by ValueObject base class)
     */
    protected validateFormat(): void;
    /**
     * Get reason
     */
    get reason(): string | undefined;
    /**
     * Get chief complaint
     */
    get chiefComplaint(): string | undefined;
    /**
     * Get symptoms
     */
    get symptoms(): string[];
    /**
     * Get notes
     */
    get notes(): string | undefined;
    /**
     * Get special instructions
     */
    get specialInstructions(): string | undefined;
    /**
     * Check if details are empty
     */
    isEmpty(): boolean;
    /**
     * Add symptom
     */
    addSymptom(symptom: string): AppointmentDetails;
    /**
     * Remove symptom
     */
    removeSymptom(symptom: string): AppointmentDetails;
    /**
     * Update reason
     */
    updateReason(reason: string): AppointmentDetails;
    /**
     * Update chief complaint
     */
    updateChiefComplaint(chiefComplaint: string): AppointmentDetails;
    /**
     * Update notes
     */
    updateNotes(notes: string): AppointmentDetails;
    /**
     * Update special instructions
     */
    updateSpecialInstructions(specialInstructions: string): AppointmentDetails;
    /**
     * Healthcare-specific: Contains PHI
     */
    containsPHI(): boolean;
    /**
     * Anonymize for logging
     */
    anonymize(): AppointmentDetails;
    /**
     * String representation
     */
    toString(): string;
}
//# sourceMappingURL=AppointmentDetails.vo.d.ts.map