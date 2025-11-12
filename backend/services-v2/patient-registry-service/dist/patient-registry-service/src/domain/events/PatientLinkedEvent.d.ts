/**
 * PatientLinkedEvent
 *
 * Published when patients are linked (FHIR-style)
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface PatientLinkedEventData {
    patientId: string;
    otherPatientId: string;
    linkType: 'refer' | 'seealso';
    performedBy: string;
    linkedAt: Date;
}
export declare class PatientLinkedEvent extends DomainEvent {
    readonly patientId: string;
    readonly otherPatientId: string;
    readonly linkType: 'refer' | 'seealso';
    readonly performedBy: string;
    constructor(patientId: string, otherPatientId: string, linkType: 'refer' | 'seealso', performedBy: string, correlationId?: string, causationId?: string, userIdForAudit?: string);
    getEventData(): PatientLinkedEventData;
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): PatientLinkedEventData;
}
//# sourceMappingURL=PatientLinkedEvent.d.ts.map