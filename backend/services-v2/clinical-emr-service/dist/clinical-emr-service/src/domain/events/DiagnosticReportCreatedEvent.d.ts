/**
 * DiagnosticReportCreatedEvent - Domain Event
 * Published when a new diagnostic report is created
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Event-Driven Architecture
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export interface DiagnosticReportCreatedEventPayload {
    reportId: string;
    medicalRecordId: string;
    patientId: string;
    orderedBy: string;
    reportType: string;
    testName: string;
    createdBy: string;
    createdAt: Date;
}
export declare class DiagnosticReportCreatedEvent extends DomainEvent {
    readonly reportId: string;
    readonly medicalRecordId: string;
    readonly patientId: string;
    readonly orderedBy: string;
    readonly reportType: string;
    readonly testName: string;
    readonly createdBy: string;
    readonly createdAt: Date;
    private readonly payload;
    constructor(payload: DiagnosticReportCreatedEventPayload, eventVersion?: number, correlationId?: string, causationId?: string, userId?: string);
    getEventData(): DiagnosticReportCreatedEventPayload;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=DiagnosticReportCreatedEvent.d.ts.map