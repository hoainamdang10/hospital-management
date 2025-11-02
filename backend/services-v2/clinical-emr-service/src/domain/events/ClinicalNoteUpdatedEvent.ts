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

export class ClinicalNoteUpdatedEvent extends DomainEvent {
  private readonly payload: any;
  constructor(
    payload: ClinicalNoteUpdatedEventPayload,
    aggregateId?: string,
    eventVersion: number = 1
  ,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    super(
      'ClinicalNoteUpdated',
      aggregateId || payload.noteId,
      'ClinicalNote',
      payload,
      eventVersion,
      correlationId,
      causationId,
      userId
    );
    this.payload = payload;
  }

  get noteId(): string {
    return this.payload.noteId;
  }

  get medicalRecordId(): string {
    return this.payload.medicalRecordId;
  }

  get patientId(): string {
    return this.payload.patientId;
  }

  get updatedFields(): string[] {
    return this.payload.updatedFields;
  }

  get previousValues(): Record<string, any> {
    return this.payload.previousValues;
  }

  get newValues(): Record<string, any> {
    return this.payload.newValues;
  }

  get updatedBy(): string {
    return this.payload.updatedBy;
  }

  get updatedAtTime(): Date {
    return this.payload.updatedAt;
  }

  get updateReason(): string | undefined {
    return this.payload.updateReason;
  }

  public getEventData(): any {
    return this.payload || {
      ...Object.keys(this).reduce((acc: any, key: string) => {
        if (!key.startsWith('event') && key !== 'metadata' && key !== 'payload') {
          acc[key] = (this as any)[key];
        }
        return acc;
      }, {} as Record<string, any>)
    };
  }

  public containsPHI(): boolean {
    return true;
  }

  public getPatientId(): string | null {
    return this.patientId || this.payload?.patientId || null;
  }

}
