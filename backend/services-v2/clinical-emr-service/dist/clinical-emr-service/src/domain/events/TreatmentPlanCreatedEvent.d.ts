/**
 * TreatmentPlanCreatedEvent - Domain Event
 * Triggered when a new treatment plan is created
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven, FHIR R4
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export interface TreatmentPlanCreatedEventPayload {
    planId: string;
    medicalRecordId: string;
    patientId: string;
    primaryDoctorId: string;
    diagnosis: string;
    treatmentGoals: string;
    startDate: Date;
    patientConsent: boolean;
    createdBy: string;
    createdAt: Date;
}
export declare class TreatmentPlanCreatedEvent extends DomainEvent {
    private readonly payload;
    readonly planId: string;
    readonly medicalRecordId: string;
    readonly patientId: string;
    readonly primaryDoctorId: string;
    readonly diagnosis: string;
    readonly treatmentGoals: string;
    readonly startDate: Date;
    readonly patientConsent: boolean;
    readonly createdBy: string;
    readonly createdAt: Date;
    constructor(payload: TreatmentPlanCreatedEventPayload, aggregateId?: string, eventVersion?: number, correlationId?: string, causationId?: string, userId?: string);
    toPrimitives(): any;
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=TreatmentPlanCreatedEvent.d.ts.map