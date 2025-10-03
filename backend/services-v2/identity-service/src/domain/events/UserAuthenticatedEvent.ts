/**
 * UserAuthenticatedEvent Domain Event
 * Fired when a user successfully authenticates
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { UserId } from '../value-objects/UserId';

export class UserAuthenticatedEvent extends DomainEvent {
  constructor(
    public readonly userIdVO: UserId,
    public readonly ipAddress: string,
    public readonly userAgent: string,
    public readonly timestamp: Date
  ) {
    super(
      'UserAuthenticated',
      userIdVO.value,
      'User',
      { ipAddress, userAgent, timestamp },
      1, // eventVersion
      undefined, // correlationId
      undefined, // causationId
      userIdVO.value // userId as string for base class
    );
  }

  getEventData(): any {
    return {
      userId: this.userIdVO.value,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      timestamp: this.timestamp
    };
  }

  containsPHI(): boolean {
    return false; // IP and user agent are not PHI
  }

  getPatientId(): string | null {
    return null;
  }
}
