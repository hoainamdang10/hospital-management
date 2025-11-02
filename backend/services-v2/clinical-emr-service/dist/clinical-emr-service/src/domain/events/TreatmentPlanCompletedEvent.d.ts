/**
 * TreatmentPlanCompletedEvent - Domain Event
 * Triggered when treatment plan is completed
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven, FHIR R4
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export interface TreatmentPlanCompletedEventPayload {
    planId: string;
    medicalRecordId: string;
    patientId: string;
    primaryDoctorId: string;
    completedBy: string;
    completedAt: Date;
    completionNotes?: string;
}
export declare class TreatmentPlanCompletedEvent extends DomainEvent {
    private readonly payload;
    readonly planId: string;
    readonly medicalRecordId: string;
    readonly patientId: string;
    readonly primaryDoctorId: string;
    readonly completedBy: string;
    readonly completedAt: Date;
    readonly completionNotes?: string;
    constructor(payload: TreatmentPlanCompletedEventPayload, aggregateId?: string, eventVersion?: number, correlationId?: string, causationId?: string, userId?: string);
    toPrimitives(): any;
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=TreatmentPlanCompletedEvent.d.ts.map