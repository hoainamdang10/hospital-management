/**
 * PatientDeactivatedEvent
 *
 * Published when a patient is deactivated
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
import { Patient } from '../aggregates/Patient';
export interface PatientDeactivatedEventData {
    patientId: string;
    reason: string;
    performedBy: string;
    deactivatedAt: Date;
}
export declare class PatientDeactivatedEvent extends DomainEvent {
    readonly patient: Patient;
    readonly reason: string;
    readonly performedBy: string;
    constructor(patient: Patient, reason: string, performedBy: string);
    getEventData(): PatientDeactivatedEventData;
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): PatientDeactivatedEventData;
}
//# sourceMappingURL=PatientDeactivatedEvent.d.ts.map