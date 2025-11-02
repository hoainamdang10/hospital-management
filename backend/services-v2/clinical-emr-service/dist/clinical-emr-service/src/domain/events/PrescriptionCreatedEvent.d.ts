/**
 * PrescriptionCreatedEvent - Domain Event
 * Triggered when a new prescription is created
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven, FHIR R4
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export interface PrescriptionCreatedEventPayload {
    prescriptionId: string;
    medicalRecordId: string;
    patientId: string;
    prescribedBy: string;
    medicationCount: number;
    prescribedDate: Date;
    createdBy: string;
    createdAt: Date;
}
export declare class PrescriptionCreatedEvent extends DomainEvent {
    readonly prescriptionId: string;
    readonly medicalRecordId: string;
    readonly patientId: string;
    readonly prescribedBy: string;
    readonly medicationCount: number;
    readonly prescribedDate: Date;
    readonly createdBy: string;
    readonly createdAt: Date;
    private readonly payload;
    constructor(payload: PrescriptionCreatedEventPayload, eventVersion?: number, correlationId?: string, causationId?: string, userId?: string);
    getEventData(): PrescriptionCreatedEventPayload;
    containsPHI(): boolean;
    getPatientId(): string | null;
    toPrimitives(): any;
}
//# sourceMappingURL=PrescriptionCreatedEvent.d.ts.map