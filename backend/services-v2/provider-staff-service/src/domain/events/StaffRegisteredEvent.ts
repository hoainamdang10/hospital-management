/**
 * StaffRegisteredEvent - Domain Event
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event Sourcing, HIPAA
 */

import { DomainEvent } from '../../../shared/domain/base/domain-event';
import { StaffId } from '../value-objects/StaffId';
import { PersonalInfo } from '../value-objects/PersonalInfo';
import { ProfessionalInfo } from '../value-objects/ProfessionalInfo';

export class StaffRegisteredEvent extends DomainEvent {
  constructor(
    public readonly staffId: StaffId,
    public readonly userId: string,
    public readonly staffType: string,
    public readonly personalInfo: PersonalInfo,
    public readonly professionalInfo: ProfessionalInfo,
    correlationId?: string,
    causationId?: string,
    requestedBy?: string
  ) {
    super(
      'StaffRegistered',
      staffId.value,
      'ProviderStaff',
      {
        staffId: staffId.value,
        userId,
        staffType,
        personalInfo: personalInfo.toPersistence(),
        professionalInfo: professionalInfo.toPersistence()
      },
      1,
      correlationId,
      causationId,
      requestedBy
    );
  }

  public getEventData(): any {
    return {
      staffId: this.staffId.value,
      userId: this.userId,
      staffType: this.staffType,
      personalInfo: this.personalInfo.toPersistence(),
      professionalInfo: this.professionalInfo.toPersistence(),
      occurredAt: this.occurredAt.toISOString()
    };
  }

  public containsPHI(): boolean {
    return true; // Contains personal information
  }

  public getPatientId(): string | null {
    return null; // Staff events don't have patient ID
  }
}

