/**
 * StaffCertification Entity
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Entity } from '@shared/domain/base/entity';

interface StaffCertificationProps {
  certificationName: string;
  issuingOrganization: string;
  issueDate: Date;
  expiryDate?: Date;
  isValid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class StaffCertification extends Entity<StaffCertificationProps> {
  private constructor(props: StaffCertificationProps, id?: string) {
    super(props, id);
  }

  public static create(props: Omit<StaffCertificationProps, 'createdAt' | 'updatedAt' | 'isValid'>): StaffCertification {
    const now = new Date();
    return new StaffCertification({ ...props, isValid: true, createdAt: now, updatedAt: now });
  }

  public static fromPersistenceData(data: any): StaffCertification {
    return new StaffCertification({
      certificationName: data.certification_name,
      issuingOrganization: data.issuing_organization,
      issueDate: new Date(data.issue_date),
      expiryDate: data.expiry_date ? new Date(data.expiry_date) : undefined,
      isValid: data.is_valid,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }, data.id);
  }

  public get certificationName(): string {
    return this.props.certificationName;
  }

  public get issuingOrganization(): string {
    return this.props.issuingOrganization;
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

  public isExpired(): boolean {
    if (!this.props.expiryDate) return false;
    return this.props.expiryDate < new Date();
  }

  public isHIPAACompliant(): boolean {
    return this.props.isValid && !this.isExpired();
  }

  public validate(): void {
    if (!this.props.certificationName || this.props.certificationName.trim().length === 0) {
      throw new Error('Tên chứng chỉ không được để trống');
    }
  }

  public toPersistence(): any {
    return {
      id: this.id,
      certification_name: this.props.certificationName,
      issuing_organization: this.props.issuingOrganization,
      issue_date: this.props.issueDate.toISOString(),
      expiry_date: this.props.expiryDate?.toISOString(),
      is_valid: this.props.isValid,
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString()
    };
  }
}

