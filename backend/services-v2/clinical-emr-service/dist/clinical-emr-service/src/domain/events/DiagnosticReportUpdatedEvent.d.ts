/**
 * DiagnosticReportUpdatedEvent - Domain Event
 * Published when diagnostic report results are updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Event-Driven Architecture
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export interface DiagnosticReportUpdatedEventPayload {
    reportId: string;
    medicalRecordId: string;
    patientId: string;
    updatedFields: string[];
    previousValues: Record<string, any>;
    newValues: Record<string, any>;
    updatedBy: string;
    updatedAt: Date;
    updateReason?: string;
}
export declare class DiagnosticReportUpdatedEvent extends DomainEvent {
    private readonly payload;
    readonly reportId: string;
    readonly medicalRecordId: string;
    readonly patientId: string;
    readonly updatedFields: string[];
    readonly previousValues: Record<string, any>;
    readonly newValues: Record<string, any>;
    readonly updatedBy: string;
    readonly updatedAt: Date;
    readonly updateReason?: string;
    constructor(payload: DiagnosticReportUpdatedEventPayload, aggregateId?: string, eventVersion?: number, correlationId?: string, causationId?: string, userId?: string);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=DiagnosticReportUpdatedEvent.d.ts.map