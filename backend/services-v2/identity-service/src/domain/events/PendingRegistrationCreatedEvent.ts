/**
 * PendingRegistrationCreatedEvent
 * Domain event fired when a new pending registration is created
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event Sourcing
 */

import { HealthcareDomainEvent } from '@shared/domain/base/domain-event';

export interface PendingRegistrationCreatedEventData {
  pendingRegistrationId: string;
  email: string;
  fullName: string;
  roleType: string;
  expiresAt: Date;
}

export class PendingRegistrationCreatedEvent extends HealthcareDomainEvent {
  public readonly type = 'PendingRegistrationCreated';
  public readonly data: PendingRegistrationCreatedEventData;

  constructor(
    pendingRegistrationId: string,
    email: string,
    fullName: string,
    roleType: string,
    expiresAt: Date
  ) {
    super(
      'PendingRegistrationCreated',
      pendingRegistrationId,
      'PendingRegistration',
      {
        pendingRegistrationId,
        email,
        fullName,
        roleType,
        expiresAt
      },
      1, // version
      undefined, // correlationId
      undefined, // causationId
      undefined, // userId (no user yet)
      {
        source: 'domain',
        priority: 'normal',
        retryable: true
      }
    );

    this.data = {
      pendingRegistrationId,
      email,
      fullName,
      roleType,
      expiresAt
    };
  }

  /**
   * Get event data
   */
  public getEventData(): PendingRegistrationCreatedEventData {
    return this.data;
  }

  /**
   * Get patient ID (not applicable for pending registration)
   */
  public getPatientId(): string | null {
    return null;
  }

  /**
   * Anonymize event data (remove PII)
   */
  public anonymize(): HealthcareDomainEvent {
    const anonymized = new PendingRegistrationCreatedEvent(
      this.data.pendingRegistrationId,
      '***@***.***',
      '***',
      this.data.roleType,
      this.data.expiresAt
    );
    return anonymized;
  }

  /**
   * Pending registration does not contain PHI yet
   */
  public containsPHI(): boolean {
    return false;
  }
}

