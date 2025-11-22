/**
 * Appointment No-Show Event - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export interface AppointmentNoShowEventData {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    markedNoShowAt: Date;
    markedBy: string;
    reason?: string;
}
/**
 * Appointment No-Show Event
 * Emitted when patient does not show up for scheduled appointment
 */
export declare class AppointmentNoShowEvent extends DomainEvent {
    readonly appointmentId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly appointmentDate: string;
    readonly appointmentTime: string;
    readonly markedBy: string;
    readonly reason?: string | undefined;
    constructor(appointmentId: string, patientId: string, doctorId: string, appointmentDate: string, appointmentTime: string, markedBy: string, reason?: string | undefined, correlationId?: string, causationId?: string, userId?: string);
    /**
     * Get event data payload (required by DomainEvent base class)
     */
    getEventData(): AppointmentNoShowEventData;
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
    getPayload(): AppointmentNoShowEventData;
}
//# sourceMappingURL=AppointmentNoShowEvent.d.ts.map