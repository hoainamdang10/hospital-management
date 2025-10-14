/**
 * ProfessionalInfo Value Object
 * Encapsulates professional information for healthcare staff
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ValueObject } from '@shared/domain/base/value-object';

export interface ProfessionalInfoProps {
  licenseNumber?: string;
  specialization?: string;
  yearsOfExperience?: number;
  qualifications?: string[];
  certifications?: string[];
}

export class ProfessionalInfo extends ValueObject<ProfessionalInfoProps> {
  private constructor(props: ProfessionalInfoProps) {
    super(props);
  }

  /**
   * Validate format - required by ValueObject base class
   */
  protected validateFormat(): void {
    // Validate years of experience
    if (this.props.yearsOfExperience !== undefined) {
      if (this.props.yearsOfExperience < 0) {
        throw new Error('Số năm kinh nghiệm không được âm');
      }
      if (this.props.yearsOfExperience > 70) {
        throw new Error('Số năm kinh nghiệm không hợp lệ');
      }
    }

    // Validate license number format if provided
    if (this.props.licenseNumber && this.props.licenseNumber.trim().length === 0) {
      throw new Error('Số giấy phép hành nghề không được để trống');
    }
  }

  public static create(props: ProfessionalInfoProps): ProfessionalInfo {
    return new ProfessionalInfo({
      licenseNumber: props.licenseNumber?.trim(),
      specialization: props.specialization?.trim(),
      yearsOfExperience: props.yearsOfExperience,
      qualifications: props.qualifications || [],
      certifications: props.certifications || []
    });
  }

  get licenseNumber(): string | undefined {
    return this.props.licenseNumber;
  }

  get specialization(): string | undefined {
    return this.props.specialization;
  }

  get yearsOfExperience(): number | undefined {
    return this.props.yearsOfExperience;
  }

  get qualifications(): string[] {
    return this.props.qualifications || [];
  }

  get certifications(): string[] {
    return this.props.certifications || [];
  }
}

