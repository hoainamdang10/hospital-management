/**
 * PatientDeactivatedEvent
 *
 * Published when a patient is deactivated
 */
import { DomainEvent } from '../../shared/domain/base/domain-event';
import { Patient } from '../aggregates/Patient';
export declare class PatientDeactivatedEvent extends DomainEvent {
    readonly patient: Patient;
    readonly reason: string;
    readonly performedBy: string;
    constructor(patient: Patient, reason: string, performedBy: string);
    getPayload(): any;
}
//# sourceMappingURL=PatientDeactivatedEvent.d.ts.map