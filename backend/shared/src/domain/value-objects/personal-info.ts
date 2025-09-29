/**
 * Personal Info Value Object - Healthcare Domain
 * Encapsulates patient personal information with validation
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance HIPAA, Healthcare Standards
 */

import { ValueObject } from '../base/value-object';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

interface PersonalInfoProps {
  fullName: string;
  dateOfBirth: Date;
  gender: Gender;
  nationalId?: string;
  nationality?: string;
  occupation?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
}

/**
 * Personal Info Value Object
 * Contains validated personal information for patients
 */
export class PersonalInfo extends ValueObject<PersonalInfoProps> {
  private static readonly NAME_PATTERN = /^[\p{L}\s\-'\.]{2,100}$/u;
  private static readonly NATIONAL_ID_PATTERN = /^\d{9,12}$/;

  private constructor(props: PersonalInfoProps) {
    super(props);
  }

  /**
   * Create personal info with validation
   */
  public static create(
    fullName: string,
    dateOfBirth: Date,
    gender: Gender,
    nationalId?: string,
    nationality?: string,
    occupation?: string,
    maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed'
  ): PersonalInfo {
    const personalInfo = new PersonalInfo({
      fullName: fullName.trim(),
      dateOfBirth,
      gender,
      nationalId: nationalId?.trim(),
      nationality: nationality?.trim(),
      occupation: occupation?.trim(),
      maritalStatus,
    });

    if (!personalInfo.isValid()) {
      throw new Error('Thông tin cá nhân không hợp lệ');
    }

    return personalInfo;
  }

  /**
   * Validate personal information
   */
  public isValid(): boolean {
    // Validate full name
    if (!this.props.fullName || !PersonalInfo.NAME_PATTERN.test(this.props.fullName)) {
      return false;
    }

    // Validate date of birth
    if (!this.props.dateOfBirth || this.props.dateOfBirth > new Date()) {
      return false;
    }

    // Validate age (must be reasonable)
    const age = this.getAge();
    if (age < 0 || age > 150) {
      return false;
    }

    // Validate gender
    if (!Object.values(Gender).includes(this.props.gender)) {
      return false;
    }

    // Validate national ID if provided
    if (this.props.nationalId && !PersonalInfo.NATIONAL_ID_PATTERN.test(this.props.nationalId)) {
      return false;
    }

    return true;
  }

  /**
   * Calculate age from date of birth
   */
  public getAge(): number {
    const today = new Date();
    const birthDate = this.props.dateOfBirth;
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Check if person is minor (under 18)
   */
  public isMinor(): boolean {
    return this.getAge() < 18;
  }

  /**
   * Check if person is elderly (over 65)
   */
  public isElderly(): boolean {
    return this.getAge() >= 65;
  }

  /**
   * Get formatted full name
   */
  public getFormattedName(): string {
    return this.props.fullName
      .split(' ')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Get first name
   */
  public getFirstName(): string {
    const parts = this.props.fullName.trim().split(' ');
    return parts[0];
  }

  /**
   * Get last name
   */
  public getLastName(): string {
    const parts = this.props.fullName.trim().split(' ');
    return parts[parts.length - 1];
  }

  /**
   * Get gender display text in Vietnamese
   */
  public getGenderDisplayText(): string {
    switch (this.props.gender) {
      case Gender.MALE:
        return 'Nam';
      case Gender.FEMALE:
        return 'Nữ';
      case Gender.OTHER:
        return 'Khác';
      default:
        return 'Không xác định';
    }
  }

  /**
   * Get marital status display text in Vietnamese
   */
  public getMaritalStatusDisplayText(): string {
    if (!this.props.maritalStatus) return 'Không xác định';
    
    switch (this.props.maritalStatus) {
      case 'single':
        return 'Độc thân';
      case 'married':
        return 'Đã kết hôn';
      case 'divorced':
        return 'Đã ly hôn';
      case 'widowed':
        return 'Góa phụ/Góa chồng';
      default:
        return 'Không xác định';
    }
  }

  // Getters
  get fullName(): string {
    return this.props.fullName;
  }

  get dateOfBirth(): Date {
    return this.props.dateOfBirth;
  }

  get gender(): Gender {
    return this.props.gender;
  }

  get nationalId(): string | undefined {
    return this.props.nationalId;
  }

  get nationality(): string | undefined {
    return this.props.nationality;
  }

  get occupation(): string | undefined {
    return this.props.occupation;
  }

  get maritalStatus(): string | undefined {
    return this.props.maritalStatus;
  }
}
