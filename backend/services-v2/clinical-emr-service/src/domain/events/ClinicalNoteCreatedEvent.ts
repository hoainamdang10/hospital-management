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

export class ClinicalNoteCreatedEvent extends DomainEvent {
  private readonly payload: ClinicalNoteCreatedEventPayload;

  constructor(
    payload: ClinicalNoteCreatedEventPayload,
    aggregateId?: string,
    eventVersion: number = 1,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    super(
      'ClinicalNoteCreated',
      aggregateId || payload.noteId,
      'ClinicalNote',
      payload,
      eventVersion,
      correlationId,
      causationId,
      userId || payload.createdBy,
      { source: 'domain', priority: 'normal', retryable: true }
    );
    this.payload = payload;
  }

  public getEventData(): ClinicalNoteCreatedEventPayload {
    return this.payload;
  }

  public containsPHI(): boolean {
    return true;
  }

  public getPatientId(): string | null {
    return this.payload.patientId;
  }

  get noteId(): string {
    return this.payload.noteId;
  }

  get medicalRecordId(): string {
    return this.payload.medicalRecordId;
  }

  get patientIdValue(): string {
    return this.payload.patientId;
  }

  get authorId(): string {
    return this.payload.authorId;
  }

  get noteType(): ClinicalNoteType {
    return this.payload.noteType;
  }

  get noteTitle(): string {
    return this.payload.noteTitle;
  }

  get requiresCosign(): boolean {
    return this.payload.requiresCosign;
  }

  get createdBy(): string {
    return this.payload.createdBy;
  }

  get createdAtTime(): Date {
    return this.payload.createdAt;
  }
}
