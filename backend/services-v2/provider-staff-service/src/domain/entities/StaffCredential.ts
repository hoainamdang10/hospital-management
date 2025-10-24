/**
 * StaffCredential Entity
 * Vietnamese Healthcare Staff Credential
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { Entity } from '@shared/domain/base/entity';

interface StaffCredentialProps {
  credentialNumber: string;
  credentialType: string; // 'license', 'certificate', 'registration'
  issuingAuthority: string;
  issueDate: Date;
  expiryDate?: Date;
  isValid: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class StaffCredential extends Entity<StaffCredentialProps> {
  private constructor(props: StaffCredentialProps, id?: string) {
    super(props, id);
  }

  public static create(props: Omit<StaffCredentialProps, 'createdAt' | 'updatedAt' | 'isValid'>): StaffCredential {
    const now = new Date();
    
    return new StaffCredential({
      ...props,
      credentialNumber: props.credentialNumber.trim().toUpperCase(),
      issuingAuthority: props.issuingAuthority.trim(),
      isValid: true,
      createdAt: now,
      updatedAt: now
    });
  }

  public static fromPersistenceData(data: any): StaffCredential {
    return new StaffCredential({
      credentialNumber: data.credential_number,
      credentialType: data.credential_type,
      issuingAuthority: data.issuing_authority,
      issueDate: new Date(data.issue_date),
      expiryDate: data.expiry_date ? new Date(data.expiry_date) : undefined,
      isValid: data.is_valid,
      verifiedAt: data.verified_at ? new Date(data.verified_at) : undefined,
      verifiedBy: data.verified_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }, data.id);
  }

  // Getters
  public get credentialNumber(): string {
    return this.props.credentialNumber;
  }

  public get credentialType(): string {
    return this.props.credentialType;
  }

  public get issuingAuthority(): string {
    return this.props.issuingAuthority;
  }

  public get issueDate(): Date {
    return this.props.issueDate;
  }

  public get expiryDate(): Date | undefined {
    return this.props.expiryDate;
  }

  public get isValid(): boolean {
    return this.props.isValid;
  }

  // Business methods
  public isExpired(): boolean {
    if (!this.props.expiryDate) return false;
    return this.props.expiryDate < new Date();
  }

  public verify(verifiedBy: string): void {
    this.props.isValid = true;
    this.props.verifiedAt = new Date();
    this.props.verifiedBy = verifiedBy;
    this.props.updatedAt = new Date();
  }

  public revoke(): void {
    this.props.isValid = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Renew credential with new expiry date
   * Business rule: Can only renew if current credential is valid
   */
  public renew(newExpiryDate: Date, renewedBy: string): void {
    if (!this.props.isValid) {
      throw new Error('Không thể gia hạn chứng chỉ đã bị thu hồi');
    }

    if (newExpiryDate <= new Date()) {
      throw new Error('Ngày hết hạn mới phải trong tương lai');
    }

    if (this.props.expiryDate && newExpiryDate <= this.props.expiryDate) {
      throw new Error('Ngày hết hạn mới phải sau ngày hết hạn hiện tại');
    }

    this.props.expiryDate = newExpiryDate;
    this.props.verifiedAt = new Date();
    this.props.verifiedBy = renewedBy;
    this.props.updatedAt = new Date();
  }

  /**
   * Check if credential is expiring soon (within 30 days)
   */
  public isExpiringSoon(daysThreshold: number = 30): boolean {
    if (!this.props.expiryDate) return false;
    
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() + daysThreshold);
    
    return this.props.expiryDate <= thresholdDate && this.props.expiryDate > now;
  }

  public isHIPAACompliant(): boolean {
    return this.props.isValid && !this.isExpired();
  }

  public validate(): void {
    if (!this.props.credentialNumber || this.props.credentialNumber.trim().length === 0) {
      throw new Error('Số chứng chỉ không được để trống');
    }

    if (!this.props.issuingAuthority || this.props.issuingAuthority.trim().length === 0) {
      throw new Error('Cơ quan cấp không được để trống');
    }

    if (this.props.issueDate > new Date()) {
      throw new Error('Ngày cấp không thể trong tương lai');
    }

    if (this.props.expiryDate && this.props.expiryDate <= this.props.issueDate) {
      throw new Error('Ngày hết hạn phải sau ngày cấp');
    }
  }

  public toPersistence(): any {
    return {
      id: this.id,
      credential_number: this.props.credentialNumber,
      credential_type: this.props.credentialType,
      issuing_authority: this.props.issuingAuthority,
      issue_date: this.props.issueDate.toISOString(),
      expiry_date: this.props.expiryDate?.toISOString(),
      is_valid: this.props.isValid,
      verified_at: this.props.verifiedAt?.toISOString(),
      verified_by: this.props.verifiedBy,
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString()
    };
  }
}

