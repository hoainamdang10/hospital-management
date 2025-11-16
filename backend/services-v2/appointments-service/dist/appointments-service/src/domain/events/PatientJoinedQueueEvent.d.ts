/**
 * Patient Joined Queue Event - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface PatientJoinedQueueEventData {
    queueId: string;
    doctorId: string;
    patientId: string;
    appointmentId?: string;
    queueNumber: number;
    priority: string;
    joinedAt: Date;
}
/**
 * Patient Joined Queue Event
 * Emitted when patient joins the waiting queue
 */
export declare class PatientJoinedQueueEvent extends DomainEvent {
    readonly queueId: string;
    readonly doctorId: string;
    readonly patientId: string;
    readonly appointmentId: string | undefined;
    readonly queueNumber: number;
    readonly priority: string;
    constructor(queueId: string, doctorId: string, patientId: string, appointmentId: string | undefined, queueNumber: number, priority: string, correlationId?: string, causationId?: string, userId?: string);
    /**
     * Get event data payload (required by DomainEvent base class)
     */
    getEventData(): PatientJoinedQueueEventData;
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
    getPayload(): PatientJoinedQueueEventData;
}
//# sourceMappingURL=PatientJoinedQueueEvent.d.ts.map