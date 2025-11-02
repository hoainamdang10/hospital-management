/**
 * Appointment Started Event - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface AppointmentStartedEventData {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    startedAt: Date;
    roomId?: string;
}
/**
 * Appointment Started Event
 * Emitted when doctor starts the appointment
 */
export declare class AppointmentStartedEvent extends DomainEvent {
    readonly appointmentId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly startedAt: Date;
    readonly roomId?: string | undefined;
    constructor(appointmentId: string, patientId: string, doctorId: string, startedAt: Date, roomId?: string | undefined, correlationId?: string, causationId?: string, userId?: string);
    /**
     * Get event data payload (required by DomainEvent base class)
     */
    getEventData(): AppointmentStartedEventData;
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
    getPayload(): AppointmentStartedEventData;
}
//# sourceMappingURL=AppointmentStartedEvent.d.ts.map