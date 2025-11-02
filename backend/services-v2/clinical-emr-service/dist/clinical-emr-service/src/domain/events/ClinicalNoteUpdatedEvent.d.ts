/**
 * ClinicalNoteUpdatedEvent - Domain Event
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export interface ClinicalNoteUpdatedEventPayload {
    noteId: string;
    medicalRecordId: string;
    patientId: string;
    updatedFields: string[];
    previousValues: Record<string, any>;
    newValues: Record<string, any>;
    updatedBy: string;
    updatedAt: Date;
    updateReason?: string;
}
export declare class ClinicalNoteUpdatedEvent extends DomainEvent {
    private readonly payload;
    constructor(payload: ClinicalNoteUpdatedEventPayload, aggregateId?: string, eventVersion?: number, correlationId?: string, causationId?: string, userId?: string);
    get noteId(): string;
    get medicalRecordId(): string;
    get patientId(): string;
    get updatedFields(): string[];
    get previousValues(): Record<string, any>;
    get newValues(): Record<string, any>;
    get updatedBy(): string;
    get updatedAtTime(): Date;
    get updateReason(): string | undefined;
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=ClinicalNoteUpdatedEvent.d.ts.map