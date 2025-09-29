/**
 * Personal Info Value Object - Domain Layer
 * Vietnamese healthcare personal information with validation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Vietnamese Healthcare Standards, FHIR R4
 */

import { HealthcareValueObject } from '../../../shared/domain/base/entity';

export interface PersonalInfoProps {
  fullName: string;
  dateOfBirth: Date;
  gender: Gender;
  nationalId?: string;
  ethnicity?: string;
  religion?: string;
  occupation?: string;
  maritalStatus?: MaritalStatus;
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
  SEPARATED = 'separated'
}

/**
 * Personal Information Value Object
 * Contains patient's personal and demographic information
 */
export class PersonalInfo extends HealthcareValueObject<PersonalInfoProps> {
  private constructor(props: PersonalInfoProps) {
    super(props);
  }

  /**
   * Create Personal Info
   */
  public static create(
    fullName: string,
    dateOfBirth: Date,
    gender: Gender,
    nationalId?: string,
    ethnicity?: string,
    religion?: string,
    occupation?: string,
    maritalStatus?: MaritalStatus
  ): PersonalInfo {
    return new PersonalInfo({
      fullName: fullName.trim(),
      dateOfBirth,
      gender,
      nationalId: nationalId?.trim(),
      ethnicity: ethnicity?.trim(),
      religion: religion?.trim(),
      occupation: occupation?.trim(),
      maritalStatus
    });
  }

  /**
   * Getters
   */
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

  get ethnicity(): string | undefined {
    return this.props.ethnicity;
  }

  get religion(): string | undefined {
    return this.props.religion;
  }

  get occupation(): string | undefined {
    return this.props.occupation;
  }

  get maritalStatus(): MaritalStatus | undefined {
    return this.props.maritalStatus;
  }

  /**
   * Calculate age
   */
  get age(): number {
    const today = new Date();
    let age = today.getFullYear() - this.props.dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - this.props.dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.props.dateOfBirth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Check if patient is adult (>= 18 years old)
   */
  get isAdult(): boolean {
    return this.age >= 18;
  }

  /**
   * Check if patient is elderly (>= 65 years old)
   */
  get isElderly(): boolean {
    return this.age >= 65;
  }

  /**
   * Check if patient is pediatric (< 18 years old)
   */
  get isPediatric(): boolean {
    return this.age < 18;
  }

  /**
   * Get age group for medical purposes
   */
  get ageGroup(): string {
    if (this.age < 2) return 'Infant';
    if (this.age < 12) return 'Child';
    if (this.age < 18) return 'Adolescent';
    if (this.age < 65) return 'Adult';
    return 'Elderly';
  }

  /**
   * Validate format
   */
  protected validateFormat(): void {
    // Validate full name
    if (!this.props.fullName || this.props.fullName.trim().length === 0) {
      throw new Error('Họ và tên không được để trống');
    }

    if (this.props.fullName.length < 2) {
      throw new Error('Họ và tên phải có ít nhất 2 ký tự');
    }

    if (this.props.fullName.length > 100) {
      throw new Error('Họ và tên không được vượt quá 100 ký tự');
    }

    // Validate Vietnamese name format
    const vietnameseNameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/;
    if (!vietnameseNameRegex.test(this.props.fullName)) {
      throw new Error('Họ và tên chỉ được chứa chữ cái tiếng Việt và khoảng trắng');
    }

    // Validate date of birth
    if (!this.props.dateOfBirth) {
      throw new Error('Ngày sinh không được để trống');
    }

    const today = new Date();
    if (this.props.dateOfBirth > today) {
      throw new Error('Ngày sinh không thể là ngày trong tương lai');
    }

    // Check reasonable age limits
    if (this.age > 150) {
      throw new Error('Tuổi không hợp lệ (quá 150 tuổi)');
    }

    if (this.age < 0) {
      throw new Error('Tuổi không thể âm');
    }

    // Validate national ID if provided
    if (this.props.nationalId) {
      this.validateNationalId(this.props.nationalId);
    }

    // Validate gender
    if (!Object.values(Gender).includes(this.props.gender)) {
      throw new Error('Giới tính không hợp lệ');
    }
  }

  /**
   * Validate Vietnamese National ID (CCCD/CMND)
   */
  private validateNationalId(nationalId: string): void {
    // Remove spaces and dashes
    const cleanId = nationalId.replace(/[\s-]/g, '');

    // CCCD format: 12 digits
    // CMND format: 9 digits
    if (!/^\d{9}$|^\d{12}$/.test(cleanId)) {
      throw new Error('Số CCCD/CMND phải có 9 hoặc 12 chữ số');
    }

    // Additional validation for CCCD (12 digits)
    if (cleanId.length === 12) {
      // First 3 digits represent province code
      const provinceCode = cleanId.substring(0, 3);
      const validProvinceCodes = [
        '001', '002', '004', '006', '008', '010', '011', '012', '014', '015',
        '017', '019', '020', '022', '024', '025', '026', '027', '030', '031',
        '033', '034', '035', '036', '037', '038', '040', '042', '044', '045',
        '046', '048', '049', '051', '052', '054', '056', '058', '060', '062',
        '064', '066', '067', '068', '070', '072', '074', '075', '077', '079',
        '080', '082', '083', '084', '086', '087', '089', '091', '092', '093',
        '094', '095', '096'
      ];

      if (!validProvinceCodes.includes(provinceCode)) {
        throw new Error('Mã tỉnh/thành phố trong CCCD không hợp lệ');
      }
    }
  }

  /**
   * Contains PHI - Personal info always contains PHI
   */
  containsPHI(): boolean {
    return true;
  }

  /**
   * Validate PHI format for HIPAA compliance
   */
  protected validatePHIFormat(): void {
    // Ensure sensitive data is properly handled
    if (this.props.nationalId && this.props.nationalId.length < 9) {
      throw new Error('Số CCCD/CMND không đủ độ dài để đảm bảo bảo mật');
    }
  }

  /**
   * Anonymize for non-PHI use
   */
  anonymize(): Partial<PersonalInfoProps> {
    return {
      fullName: this.maskName(this.props.fullName),
      dateOfBirth: this.maskDateOfBirth(this.props.dateOfBirth),
      gender: this.props.gender,
      nationalId: this.props.nationalId ? this.maskNationalId(this.props.nationalId) : undefined,
      ethnicity: this.props.ethnicity,
      religion: this.props.religion,
      occupation: this.props.occupation,
      maritalStatus: this.props.maritalStatus
    };
  }

  /**
   * Mask name for anonymization
   */
  private maskName(fullName: string): string {
    const parts = fullName.split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0) + '*'.repeat(parts[0].length - 1);
    }
    
    // Keep first name, mask middle and last names
    const firstName = parts[0];
    const maskedParts = parts.slice(1).map(part => part.charAt(0) + '*'.repeat(part.length - 1));
    
    return [firstName, ...maskedParts].join(' ');
  }

  /**
   * Mask date of birth (keep year, mask month and day)
   */
  private maskDateOfBirth(dateOfBirth: Date): Date {
    return new Date(dateOfBirth.getFullYear(), 0, 1);
  }

  /**
   * Mask national ID
   */
  private maskNationalId(nationalId: string): string {
    if (nationalId.length <= 4) {
      return '*'.repeat(nationalId.length);
    }
    
    const visiblePart = nationalId.substring(0, 3);
    const maskedPart = '*'.repeat(nationalId.length - 3);
    
    return visiblePart + maskedPart;
  }

  /**
   * String representation
   */
  toString(): string {
    return `${this.props.fullName} (${this.props.gender}, ${this.age} tuổi)`;
  }

  /**
   * Get FHIR-compliant representation
   */
  toFHIR(): any {
    return {
      name: [{
        use: 'official',
        text: this.props.fullName,
        family: this.getLastName(),
        given: this.getFirstAndMiddleNames()
      }],
      gender: this.props.gender,
      birthDate: this.props.dateOfBirth.toISOString().split('T')[0],
      identifier: this.props.nationalId ? [{
        use: 'official',
        type: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
            code: 'NI',
            display: 'National identifier'
          }]
        },
        value: this.props.nationalId
      }] : undefined
    };
  }

  /**
   * Get last name (surname)
   */
  private getLastName(): string {
    const parts = this.props.fullName.split(' ');
    return parts[parts.length - 1];
  }

  /**
   * Get first and middle names
   */
  private getFirstAndMiddleNames(): string[] {
    const parts = this.props.fullName.split(' ');
    return parts.slice(0, -1);
  }
}
