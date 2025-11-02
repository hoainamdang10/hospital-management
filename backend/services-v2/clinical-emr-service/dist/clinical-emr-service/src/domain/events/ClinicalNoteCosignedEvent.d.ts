/**
 * ClinicalNoteCosignedEvent - Domain Event
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export interface ClinicalNoteCosignedEventPayload {
    noteId: string;
    medicalRecordId: string;
    patientId: string;
    authorId: string;
    cosignedBy: string;
    cosignedAt: Date;
    cosignComment?: string;
}
export declare class ClinicalNoteCosignedEvent extends DomainEvent {
    private readonly payload;
    constructor(payload: ClinicalNoteCosignedEventPayload, aggregateId?: string, eventVersion?: number, correlationId?: string, causationId?: string, userId?: string);
    getEventData(): ClinicalNoteCosignedEventPayload;
    containsPHI(): boolean;
    getPatientId(): string | null;
    get noteId(): string;
    get medicalRecordId(): string;
    get patientIdValue(): string;
    get authorId(): string;
    get cosignedBy(): string;
    get cosignedAtTime(): Date;
    get cosignComment(): string | undefined;
}
//# sourceMappingURL=ClinicalNoteCosignedEvent.d.ts.map