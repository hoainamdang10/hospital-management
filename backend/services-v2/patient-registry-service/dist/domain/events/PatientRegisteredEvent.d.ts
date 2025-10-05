/**
 * PatientRegisteredEvent - Domain Event
 * Published when a new patient is registered
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { DomainEvent } from '../../shared/domain/base/domain-event';
import { Patient } from '../aggregates/Patient';
export declare class PatientRegisteredEvent extends DomainEvent {
    readonly patient: Patient;
    constructor(patient: Patient);
    getPayload(): any;
}
//# sourceMappingURL=PatientRegisteredEvent.d.ts.map