/**
 * PatientLinkedEvent
 *
 * Published when patients are linked (FHIR-style)
 */
import { DomainEvent } from '../../../shared/domain/base/domain-event';
import { Patient } from '../aggregates/Patient';
import { PatientId } from '../value-objects/PatientId';
export declare class PatientLinkedEvent extends DomainEvent {
    readonly patient: Patient;
    readonly otherPatientId: PatientId;
    readonly linkType: 'refer' | 'seealso';
    readonly performedBy: string;
    constructor(patient: Patient, otherPatientId: PatientId, linkType: 'refer' | 'seealso', performedBy: string);
    getPayload(): any;
}
//# sourceMappingURL=PatientLinkedEvent.d.ts.map