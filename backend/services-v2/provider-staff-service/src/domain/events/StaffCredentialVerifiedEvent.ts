/**
 * StaffCredentialVerifiedEvent - Domain Event
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '../../../shared/domain/base/domain-event';
import { StaffId } from '../value-objects/StaffId';

export class StaffCredentialVerifiedEvent extends DomainEvent {
  constructor(
    public readonly staffId: StaffId,
    public readonly credentialNumber: string,
    public readonly issuingAuthority: string,
    correlationId?: string,
    causationId?: string,
    verifiedBy?: string
  ) {
    super(
      'StaffCredentialVerified',
      staffId.value,
      'ProviderStaff',
      {
        staffId: staffId.value,
        credentialNumber,
        issuingAuthority
      },
      1,
      correlationId,
      causationId,
      verifiedBy
    );
  }

  public getEventData(): any {
    return {
      staffId: this.staffId.value,
      credentialNumber: this.credentialNumber,
      issuingAuthority: this.issuingAuthority,
      occurredAt: this.occurredAt.toISOString()
    };
  }

  public containsPHI(): boolean {
    return false;
  }

  public getPatientId(): string | null {
    return null;
  }
}

