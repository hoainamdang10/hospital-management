/**
 * StaffRegisteredEvent - Domain Event
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event Sourcing, HIPAA
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { StaffId } from '../value-objects/StaffId';
import { PersonalInfo } from '../value-objects/PersonalInfo';
import { ProfessionalInfo } from '../value-objects/ProfessionalInfo';
import { WorkSchedule } from '../value-objects/WorkSchedule';

export class StaffRegisteredEvent extends DomainEvent {
  constructor(
    public readonly staffId: StaffId,
    public override readonly userId: string,
    public readonly staffType: string,
    public readonly personalInfo: PersonalInfo,
    public readonly professionalInfo: ProfessionalInfo,
    public readonly licenseNumber: string,
    public readonly employmentType: string,
    public readonly hireDate: Date,
    public readonly workSchedule: WorkSchedule,
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
        professionalInfo: professionalInfo.toPersistence(),
        licenseNumber,
        employmentType,
        hireDate: hireDate.toISOString(),
        workSchedule: workSchedule.toPersistence()
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
      licenseNumber: this.licenseNumber,
      employmentType: this.employmentType,
      hireDate: this.hireDate.toISOString(),
      workSchedule: this.workSchedule.toPersistence(),
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

