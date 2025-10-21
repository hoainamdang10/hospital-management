/**
 * PatientUpdatedEvent - Domain Event
 * Published when patient information is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface PatientUpdatedEventData {
    patientId: string;
    updateType: string;
    updatedBy: string;
    updatedAt: Date;
}
export declare class PatientUpdatedEvent extends DomainEvent {
    readonly patientId: string;
    readonly updateType: string;
    readonly updatedBy: string;
    constructor(patientId: string, updateType: string, updatedBy: string, correlationId?: string, causationId?: string, userIdForAudit?: string);
    getEventData(): PatientUpdatedEventData;
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): PatientUpdatedEventData;
}
//# sourceMappingURL=PatientUpdatedEvent.d.ts.map