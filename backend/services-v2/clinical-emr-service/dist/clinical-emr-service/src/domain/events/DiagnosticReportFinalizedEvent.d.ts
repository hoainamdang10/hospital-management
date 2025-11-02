/**
 * DiagnosticReportFinalizedEvent - Domain Event
 * Published when diagnostic report is finalized by verifying doctor
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Event-Driven Architecture
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export interface DiagnosticReportFinalizedEventPayload {
    reportId: string;
    medicalRecordId: string;
    patientId: string;
    orderedBy: string;
    verifiedBy: string;
    verifiedAt: Date;
    verificationComment?: string;
}
export declare class DiagnosticReportFinalizedEvent extends DomainEvent {
    private readonly payload;
    readonly reportId: string;
    readonly medicalRecordId: string;
    readonly patientId: string;
    readonly orderedBy: string;
    readonly verifiedBy: string;
    readonly verifiedAt: Date;
    readonly verificationComment?: string;
    constructor(payload: DiagnosticReportFinalizedEventPayload, aggregateId?: string, eventVersion?: number, correlationId?: string, causationId?: string, userId?: string);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=DiagnosticReportFinalizedEvent.d.ts.map