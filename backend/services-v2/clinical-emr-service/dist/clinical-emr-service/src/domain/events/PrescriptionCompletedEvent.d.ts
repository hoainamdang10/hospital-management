/**
 * PrescriptionCompletedEvent - Domain Event
 * Triggered when prescription is completed
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven, FHIR R4
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export interface PrescriptionCompletedEventPayload {
    prescriptionId: string;
    medicalRecordId: string;
    patientId: string;
    prescribedBy: string;
    completedBy: string;
    completedAt: Date;
}
export declare class PrescriptionCompletedEvent extends DomainEvent {
    private readonly payload;
    readonly prescriptionId: string;
    readonly medicalRecordId: string;
    readonly patientId: string;
    readonly prescribedBy: string;
    readonly completedBy: string;
    readonly completedAt: Date;
    constructor(payload: PrescriptionCompletedEventPayload, aggregateId?: string, eventVersion?: number, correlationId?: string, causationId?: string, userId?: string);
    toPrimitives(): any;
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=PrescriptionCompletedEvent.d.ts.map