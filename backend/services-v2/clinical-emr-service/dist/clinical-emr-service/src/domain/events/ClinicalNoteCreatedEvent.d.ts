/**
 * ClinicalNoteCreatedEvent - Domain Event
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
import { ClinicalNoteType } from '../aggregates/ClinicalNote.aggregate';
export interface ClinicalNoteCreatedEventPayload {
    noteId: string;
    medicalRecordId: string;
    patientId: string;
    authorId: string;
    noteType: ClinicalNoteType;
    noteTitle: string;
    requiresCosign: boolean;
    createdBy: string;
    createdAt: Date;
}
export declare class ClinicalNoteCreatedEvent extends DomainEvent {
    private readonly payload;
    constructor(payload: ClinicalNoteCreatedEventPayload, aggregateId?: string, eventVersion?: number, correlationId?: string, causationId?: string, userId?: string);
    getEventData(): ClinicalNoteCreatedEventPayload;
    containsPHI(): boolean;
    getPatientId(): string | null;
    get noteId(): string;
    get medicalRecordId(): string;
    get patientIdValue(): string;
    get authorId(): string;
    get noteType(): ClinicalNoteType;
    get noteTitle(): string;
    get requiresCosign(): boolean;
    get createdBy(): string;
    get createdAtTime(): Date;
}
//# sourceMappingURL=ClinicalNoteCreatedEvent.d.ts.map