/**
 * TreatmentPlanUpdatedEvent - Domain Event
 * Triggered when treatment plan is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven, FHIR R4
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export interface TreatmentPlanUpdatedEventPayload {
    planId: string;
    medicalRecordId: string;
    patientId: string;
    updatedFields: string[];
    previousValues?: Record<string, any>;
    newValues?: Record<string, any>;
    updatedBy: string;
    updatedAt: Date;
    updateReason?: string;
}
export declare class TreatmentPlanUpdatedEvent extends DomainEvent {
    private readonly payload;
    readonly planId: string;
    readonly medicalRecordId: string;
    readonly patientId: string;
    readonly updatedFields: string[];
    readonly previousValues?: Record<string, any>;
    readonly newValues?: Record<string, any>;
    readonly updatedBy: string;
    readonly updatedAt: Date;
    readonly updateReason?: string;
    constructor(payload: TreatmentPlanUpdatedEventPayload, aggregateId?: string, eventVersion?: number, correlationId?: string, causationId?: string, userId?: string);
    toPrimitives(): any;
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=TreatmentPlanUpdatedEvent.d.ts.map