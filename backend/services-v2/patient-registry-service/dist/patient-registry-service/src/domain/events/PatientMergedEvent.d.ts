/**
 * PatientMergedEvent
 *
 * Published when duplicate patients are merged
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
import { Patient } from '../aggregates/Patient';
import { PatientId } from '../value-objects/PatientId';
export interface PatientMergedEventData {
    duplicatePatientId: string;
    masterPatientId: string;
    reason: string;
    performedBy: string;
    mergedAt: Date;
}
export declare class PatientMergedEvent extends DomainEvent {
    readonly duplicatePatient: Patient;
    readonly masterPatientId: PatientId;
    readonly reason: string;
    readonly performedBy: string;
    constructor(duplicatePatient: Patient, masterPatientId: PatientId, reason: string, performedBy: string);
    getEventData(): PatientMergedEventData;
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): PatientMergedEventData;
}
//# sourceMappingURL=PatientMergedEvent.d.ts.map