/**
 * PatientUpdatedEvent - Domain Event
 * Published when patient information is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface PatientUpdatedEventData {
  patientId: string;
  identityUserId: string; // Identity Service user ID
  updateType: string;
  updatedBy: string;
  updatedAt: Date;
  // Data fields for syncing to Identity Service
  personalInfo?: {
    fullName?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
    citizenId?: string;
  };
  contactInfo?: {
    phoneNumber?: string;
    email?: string;
    address?: {
      street?: string;
      ward?: string;
      district?: string;
      city?: string;
      province?: string;
      country?: string;
    };
  };
}

export class PatientUpdatedEvent extends DomainEvent {
  constructor(
    public readonly patientId: string,
    public readonly identityUserId: string, // Identity Service user ID - renamed to avoid override
    public readonly updateType: string,
    public readonly updatedBy: string,
    public readonly personalInfo?: PatientUpdatedEventData['personalInfo'],
    public readonly contactInfo?: PatientUpdatedEventData['contactInfo'],
    correlationId?: string,
    causationId?: string,
    userIdForAudit?: string
  ) {
    const eventData = {
      patientId,
      userId: identityUserId, // Map to expected field name
      updateType,
      updatedBy,
      personalInfo,
      contactInfo
    };

    super(
      'PatientUpdated',
      patientId,
      'Patient',
      eventData,
      1,
      correlationId,
      causationId,
      userIdForAudit
    );
  }

  public getEventData(): PatientUpdatedEventData {
    return {
      patientId: this.patientId,
      identityUserId: this.identityUserId, // Use renamed field
      updateType: this.updateType,
      updatedBy: this.updatedBy,
      updatedAt: this.occurredAt,
      personalInfo: this.personalInfo,
      contactInfo: this.contactInfo
    };
  }

  public containsPHI(): boolean {
    return true;
  }

  public getPatientId(): string | null {
    return this.patientId;
  }

  public getPayload(): PatientUpdatedEventData {
    return this.getEventData();
  }
}

