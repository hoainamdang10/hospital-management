/**
 * UserCreatedEvent Domain Event
 * Fired when a new user is created
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { UserId } from '../value-objects/UserId';
import { Email } from '../value-objects/Email';
import { HealthcareRole } from '../entities/HealthcareRole';
import { PersonalInfo } from '../value-objects/PersonalInfo';

export class UserCreatedEvent extends DomainEvent {
  constructor(
    public readonly userIdVO: UserId,
    public readonly userEmail: Email,
    public readonly userRole: HealthcareRole,
    public readonly personalInfo?: PersonalInfo // Optional for backward compatibility
  ) {
    super(
      'UserCreated',
      userIdVO.value,
      'User',
      { email: userEmail.value, role: userRole.type },
      1, // eventVersion
      undefined, // correlationId
      undefined, // causationId
      userIdVO.value // userId as string for base class
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      userId: this.userIdVO.value,
      email: this.userEmail.value,
      role: this.userRole.type,
      personalInfo: this.personalInfo ? {
        fullName: this.personalInfo.fullName,
        phoneNumber: this.personalInfo.phoneNumber,
        address: this.personalInfo.address,
        dateOfBirth: this.personalInfo.dateOfBirth,
        gender: this.personalInfo.gender,
        citizenId: this.personalInfo.citizenId
      } : undefined
    };
  }

  containsPHI(): boolean {
    return true; // Contains email which is PHI
  }

  getPatientId(): string | null {
    return null; // User is not a patient
  }
}
