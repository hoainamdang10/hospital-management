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

export class ClinicalNoteCosignedEvent extends DomainEvent {
  private readonly payload: ClinicalNoteCosignedEventPayload;

  constructor(
    payload: ClinicalNoteCosignedEventPayload,
    aggregateId?: string,
    eventVersion: number = 1,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    super(
      'ClinicalNoteCosigned',
      aggregateId || payload.noteId,
      'ClinicalNote',
      payload,
      eventVersion,
      correlationId,
      causationId,
      userId || payload.cosignedBy,
      { source: 'domain', priority: 'normal', retryable: true }
    );
    this.payload = payload;
  }

  public getEventData(): ClinicalNoteCosignedEventPayload {
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

  get cosignedBy(): string {
    return this.payload.cosignedBy;
  }

  get cosignedAtTime(): Date {
    return this.payload.cosignedAt;
  }

  get cosignComment(): string | undefined {
    return this.payload.cosignComment;
  }
}
