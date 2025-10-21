/**
 * PatientDeactivatedEvent
 *
 * Published when a patient is deactivated
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface PatientDeactivatedEventData {
    patientId: string;
    reason: string;
    performedBy: string;
    deactivatedAt: Date;
}
export declare class PatientDeactivatedEvent extends DomainEvent {
    readonly patientId: string;
    readonly reason: string;
    readonly performedBy: string;
    constructor(patientId: string, reason: string, performedBy: string, correlationId?: string, causationId?: string, userIdForAudit?: string);
    getEventData(): PatientDeactivatedEventData;
    containsPHI(): boolean;
    getPatientId(): string | null;
    getPayload(): PatientDeactivatedEventData;
}
//# sourceMappingURL=PatientDeactivatedEvent.d.ts.map