/**
 * PrescriptionDispensedEvent - Domain Event
 * Triggered when prescription is dispensed by pharmacy
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven, FHIR R4
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export interface PrescriptionDispensedEventPayload {
    prescriptionId: string;
    medicalRecordId: string;
    patientId: string;
    dispensedBy: string;
    dispensedAt: Date;
    pharmacyId: string;
    medicationCount: number;
}
export declare class PrescriptionDispensedEvent extends DomainEvent {
    private readonly payload;
    readonly prescriptionId: string;
    readonly medicalRecordId: string;
    readonly patientId: string;
    readonly dispensedBy: string;
    readonly dispensedAt: Date;
    readonly pharmacyId: string;
    readonly medicationCount: number;
    constructor(payload: PrescriptionDispensedEventPayload, aggregateId?: string, eventVersion?: number, correlationId?: string, causationId?: string, userId?: string);
    toPrimitives(): any;
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=PrescriptionDispensedEvent.d.ts.map