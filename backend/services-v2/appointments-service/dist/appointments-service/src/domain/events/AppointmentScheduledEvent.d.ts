/**
 * Appointment Scheduled Event - Domain Layer
 * V3 Clean Architecture + DDD + Event-Driven Implementation
 * Follows Identity and Provider service pattern - accepts primitive values
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA, Vietnamese Healthcare Standards
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface AppointmentScheduledEventData {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    durationMinutes: number;
    type: string;
    priority: string;
    status: string;
    consultationFee: number;
    createdBy: string;
    scheduledAt: Date;
    reason?: string;
    notes?: string;
}
/**
 * Appointment Scheduled Domain Event
 * Triggered when a new appointment is successfully scheduled
 *
 * Pattern: Accepts primitive values/value objects (following Identity & Provider service pattern)
 * This allows better serialization and decoupling from aggregate structure
 */
export declare class AppointmentScheduledEvent extends DomainEvent {
    readonly appointmentId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly appointmentDate: string;
    readonly appointmentTime: string;
    readonly durationMinutes: number;
    readonly type: string;
    readonly priority: string;
    readonly status: string;
    readonly consultationFee: number;
    readonly createdBy: string;
    readonly reason?: string | undefined;
    readonly notes?: string | undefined;
    constructor(appointmentId: string, patientId: string, doctorId: string, appointmentDate: string, appointmentTime: string, durationMinutes: number, type: string, priority: string, status: string, consultationFee: number, createdBy: string, reason?: string | undefined, notes?: string | undefined, correlationId?: string, causationId?: string, userId?: string);
    /**
     * Get event data payload (required by DomainEvent base class)
     */
    getEventData(): AppointmentScheduledEventData;
    /**
     * Check if event contains PHI (required by DomainEvent base class)
     */
    containsPHI(): boolean;
    /**
     * Get patient ID (required for healthcare events)
     */
    getPatientId(): string | null;
    /**
     * Get payload for event publishing
     */
    getPayload(): AppointmentScheduledEventData;
}
//# sourceMappingURL=AppointmentScheduledEvent.d.ts.map