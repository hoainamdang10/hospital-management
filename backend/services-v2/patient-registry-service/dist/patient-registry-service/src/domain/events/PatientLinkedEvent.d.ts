/**
 * PatientLinkedEvent
 *
 * Published when patients are linked (FHIR-style)
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
import { Patient } from '../aggregates/Patient';
import { PatientId } from '../value-objects/PatientId';
export interface PatientLinkedEventData {
    patientId: string;
    otherPatientId: string;
    linkType: 'refer' | 'seealso';
    performedBy: string;
    linkedAt: Date;
}
export declare class PatientLinkedEvent extends DomainEvent {
    readonly patient: Patient;
    readonly otherPatientId: PatientId;
    readonly linkType: 'refer' | 'seealso';
    readonly performedBy: string;
    constructor(patient: Patient, otherPatientId: PatientId, linkType: 'refer' | 'seealso', performedBy: string);
    getEventData(): PatientLinkedEventData;
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): PatientLinkedEventData;
}
//# sourceMappingURL=PatientLinkedEvent.d.ts.map