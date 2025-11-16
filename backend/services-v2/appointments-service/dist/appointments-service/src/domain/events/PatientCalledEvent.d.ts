/**
 * Patient Called Event - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface PatientCalledEventData {
    queueId: string;
    doctorId: string;
    patientId: string;
    appointmentId?: string;
    queueNumber: number;
    calledAt: Date;
}
/**
 * Patient Called Event
 * Emitted when patient is called from the waiting queue
 */
export declare class PatientCalledEvent extends DomainEvent {
    readonly queueId: string;
    readonly doctorId: string;
    readonly patientId: string;
    readonly appointmentId: string | undefined;
    readonly queueNumber: number;
    constructor(queueId: string, doctorId: string, patientId: string, appointmentId: string | undefined, queueNumber: number, correlationId?: string, causationId?: string, userId?: string);
    /**
     * Get event data payload (required by DomainEvent base class)
     */
    getEventData(): PatientCalledEventData;
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
    getPayload(): PatientCalledEventData;
}
//# sourceMappingURL=PatientCalledEvent.d.ts.map