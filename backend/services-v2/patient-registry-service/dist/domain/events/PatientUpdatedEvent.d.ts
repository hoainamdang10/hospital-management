/**
 * PatientUpdatedEvent - Domain Event
 * Published when patient information is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { PatientId } from '../value-objects/PatientId';
export interface PatientUpdatedEventPayload {
    patientId: PatientId;
    updateType: string;
    updatedAt: Date;
}
export declare class PatientUpdatedEvent extends DomainEvent {
    readonly patientId: PatientId;
    readonly updateType: string;
    readonly updatedAt: Date;
    constructor(patientId: PatientId, updateType: string, updatedAt?: Date);
    /**
     * Get event payload for event bus
     */
    getPayload(): PatientUpdatedEventPayload;
    /**
     * Get event summary for logging
     */
    getSummaryForLogging(): object;
}
//# sourceMappingURL=PatientUpdatedEvent.d.ts.map