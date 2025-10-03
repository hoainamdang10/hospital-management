/**
 * PersonalInfo Value Object - Patient Registry
 * Patient personal information with Vietnamese healthcare standards
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { ValueObject } from '../../../../shared/domain/base/value-object';

export interface PersonalInfoProps {
  fullName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  nationalId: string; // CMND/CCCD
  nationality: string;
  ethnicity?: string | undefined;
  occupation?: string | undefined;
  maritalStatus?: string | undefined;
}

export class PersonalInfo extends ValueObject<PersonalInfoProps> {
  private constructor(props: PersonalInfoProps) {
    super(props);
  }

  /**
   * Validate format - required by ValueObject base class
   */
  protected validateFormat(): void {
    // Validate full name
    if (!this.props.fullName || this.props.fullName.trim().length === 0) {
      throw new Error('Họ tên không được để trống');
    }

    if (this.props.fullName.trim().length < 2) {
      throw new Error('Họ tên phải có ít nhất 2 ký tự');
    }

    // Validate date of birth
    if (!this.props.dateOfBirth) {
      throw new Error('Ngày sinh không được để trống');
    }

    const today = new Date();
    if (this.props.dateOfBirth >= today) {
      throw new Error('Ngày sinh phải trước ngày hiện tại');
    }

    const age = today.getFullYear() - this.props.dateOfBirth.getFullYear();
    if (age > 150) {
      throw new Error('Tuổi không hợp lệ');
    }

    // Validate gender
    if (!this.props.gender) {
      throw new Error('Giới tính không được để trống');
    }

    if (!['male', 'female', 'other'].includes(this.props.gender)) {
      throw new Error('Giới tính không hợp lệ');
    }

    // Validate national ID
    if (!this.props.nationalId || this.props.nationalId.trim().length === 0) {
      throw new Error('CMND/CCCD không được để trống');
    }

    if (!PersonalInfo.isValidCitizenId(this.props.nationalId)) {
      throw new Error('Số CMND/CCCD không hợp lệ');
    }

    // Validate nationality
    if (!this.props.nationality || this.props.nationality.trim().length === 0) {
      throw new Error('Quốc tịch không được để trống');
    }
  }

  /**
   * Create PersonalInfo
   */
  public static create(props: PersonalInfoProps): PersonalInfo {
    return new PersonalInfo({
      fullName: props.fullName.trim(),
      dateOfBirth: props.dateOfBirth,
      gender: props.gender,
      nationalId: props.nationalId.trim(),
      nationality: props.nationality.trim(),
      ethnicity: props.ethnicity?.trim(),
      occupation: props.occupation?.trim(),
      maritalStatus: props.maritalStatus?.trim()
    });
  }

  /**
   * Validate Vietnamese citizen ID (CMND/CCCD)
   */
  private static isValidCitizenId(citizenId: string): boolean {
    // CMND: 9 or 12 digits, CCCD: 12 digits
    const citizenIdRegex = /^\d{9}$|^\d{12}$/;
    return citizenIdRegex.test(citizenId.replace(/\s/g, ''));
  }

  // Getters
  public get fullName(): string {
    return this.props.fullName;
  }

  public get dateOfBirth(): Date {
    return this.props.dateOfBirth;
  }

  public get gender(): 'male' | 'female' | 'other' {
    return this.props.gender;
  }

  public get nationalId(): string {
    return this.props.nationalId;
  }

  public get nationality(): string {
    return this.props.nationality;
  }

  public get ethnicity(): string | undefined {
    return this.props.ethnicity;
  }

  public get occupation(): string | undefined {
    return this.props.occupation;
  }

  public get maritalStatus(): string | undefined {
    return this.props.maritalStatus;
  }

  /**
   * Get age from date of birth
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
   * Check if patient is minor (< 18 years old)
   */
  public isMinor(): boolean {
    return this.getAge() < 18;
  }

  /**
   * Check if patient is elderly (>= 65 years old)
   */
  public isElderly(): boolean {
    return this.getAge() >= 65;
  }

  /**
   * Vietnamese healthcare compliance check
   */
  public isVietnameseCompliant(): boolean {
    return (
      this.props.fullName.length >= 2 &&
      PersonalInfo.isValidCitizenId(this.props.nationalId) &&
      this.props.nationality.length > 0
    );
  }

  /**
   * HIPAA compliance check
   */
  public isHIPAACompliant(): boolean {
    // HIPAA requires full name, date of birth, and gender
    return (
      this.props.fullName.length >= 2 &&
      !!this.props.dateOfBirth &&
      !!this.props.gender
    );
  }

  /**
   * Check if personal info is valid
   */
  public isValid(): boolean {
    try {
      this.validateFormat();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Convert to persistence format
   */
  public toPersistence(): any {
    return {
      fullName: this.props.fullName,
      dateOfBirth: this.props.dateOfBirth.toISOString(),
      gender: this.props.gender,
      nationalId: this.props.nationalId,
      nationality: this.props.nationality,
      ethnicity: this.props.ethnicity,
      occupation: this.props.occupation,
      maritalStatus: this.props.maritalStatus
    };
  }

  /**
   * Create from persistence data
   */
  public static fromPersistence(data: any): PersonalInfo {
    return PersonalInfo.create({
      fullName: data.fullName,
      dateOfBirth: new Date(data.dateOfBirth),
      gender: data.gender,
      nationalId: data.nationalId,
      nationality: data.nationality,
      ethnicity: data.ethnicity,
      occupation: data.occupation,
      maritalStatus: data.maritalStatus
    });
  }

  /**
   * Get display name (for logging, no sensitive data)
   */
  public getDisplayName(): string {
    return this.props.fullName;
  }

  /**
   * Get masked national ID (for logging)
   */
  public getMaskedNationalId(): string {
    const id = this.props.nationalId;
    if (id.length <= 4) return '***';
    return '***' + id.slice(-4);
  }

  /**
   * Get summary for logging (no sensitive data)
   */
  public getSummaryForLogging(): object {
    return {
      fullName: this.props.fullName,
      age: this.getAge(),
      gender: this.props.gender,
      nationality: this.props.nationality,
      isMinor: this.isMinor(),
      isElderly: this.isElderly()
    };
  }
}

