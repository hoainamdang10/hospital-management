/**
 * Patient Left Queue Event - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface PatientLeftQueueEventData {
    queueId: string;
    doctorId: string;
    patientId: string;
    appointmentId?: string;
    queueNumber: number;
    reason: string;
    leftAt: Date;
}
/**
 * Patient Left Queue Event
 * Emitted when patient leaves the waiting queue (cancelled, no-show, or completed)
 */
export declare class PatientLeftQueueEvent extends DomainEvent {
    readonly queueId: string;
    readonly doctorId: string;
    readonly patientId: string;
    readonly appointmentId: string | undefined;
    readonly queueNumber: number;
    readonly reason: string;
    constructor(queueId: string, doctorId: string, patientId: string, appointmentId: string | undefined, queueNumber: number, reason: string, correlationId?: string, causationId?: string, userId?: string);
    /**
     * Get event data payload (required by DomainEvent base class)
     */
    getEventData(): PatientLeftQueueEventData;
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
    getPayload(): PatientLeftQueueEventData;
}
//# sourceMappingURL=PatientLeftQueueEvent.d.ts.map