/**
 * PatientMergedEvent
 *
 * Published when duplicate patients are merged
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface PatientMergedEventData {
    duplicatePatientId: string;
    masterPatientId: string;
    reason: string;
    performedBy: string;
    mergedAt: Date;
}
export declare class PatientMergedEvent extends DomainEvent {
    readonly duplicatePatientId: string;
    readonly masterPatientId: string;
    readonly reason: string;
    readonly performedBy: string;
    constructor(duplicatePatientId: string, masterPatientId: string, reason: string, performedBy: string, correlationId?: string, causationId?: string, userIdForAudit?: string);
    getEventData(): PatientMergedEventData;
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): PatientMergedEventData;
}
//# sourceMappingURL=PatientMergedEvent.d.ts.map