/**
 * PatientUpdatedEvent - Domain Event
 * Published when patient information is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { DomainEvent } from '../../../shared/domain/base/domain-event';
import { Patient } from '../aggregates/Patient';
export declare class PatientUpdatedEvent extends DomainEvent {
    readonly patient: Patient;
    readonly updateType: string;
    readonly updatedBy: string;
    constructor(patient: Patient, updateType: string, updatedBy: string);
    getPayload(): any;
}
//# sourceMappingURL=PatientUpdatedEvent.d.ts.map