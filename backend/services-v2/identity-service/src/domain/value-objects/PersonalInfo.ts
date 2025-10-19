/**
 * PersonalInfo Value Object
 * User personal information with Vietnamese standards
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ValueObject } from '@shared/domain/base/value-object';

interface PersonalInfoProps {
  fullName: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  citizenId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
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

    // Validate phone number if provided
    if (this.props.phoneNumber && !PersonalInfo.isValidVietnamesePhone(this.props.phoneNumber)) {
      throw new Error('Số điện thoại không hợp lệ');
    }

    // Validate citizen ID if provided
    if (this.props.citizenId && !PersonalInfo.isValidCitizenId(this.props.citizenId)) {
      throw new Error('Số CMND/CCCD không hợp lệ');
    }
  }

  public static create(props: PersonalInfoProps): PersonalInfo {
    return new PersonalInfo({
      fullName: props.fullName.trim(),
      phoneNumber: props.phoneNumber?.trim(),
      address: props.address?.trim(),
      dateOfBirth: props.dateOfBirth,
      gender: props.gender,
      citizenId: props.citizenId?.trim(),
      emergencyContactName: props.emergencyContactName?.trim(),
      emergencyContactPhone: props.emergencyContactPhone?.trim()
    });
  }

  // REMOVED: fromSupabaseData() method
  // This method violated Clean Architecture by coupling domain to external concerns
  // Use PersonalInfo.create() directly in mappers

  private static isValidVietnamesePhone(phone: string): boolean {
    // Vietnamese phone: 10 digits, starts with 0
    const phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  private static isValidCitizenId(citizenId: string): boolean {
    // CMND: 9 or 12 digits, CCCD: 12 digits
    const citizenIdRegex = /^\d{9}$|^\d{12}$/;
    return citizenIdRegex.test(citizenId.replace(/\s/g, ''));
  }

  // Getters
  public get fullName(): string {
    return this.props.fullName;
  }

  public get phoneNumber(): string | undefined {
    return this.props.phoneNumber;
  }

  public get address(): string | undefined {
    return this.props.address;
  }

  public get dateOfBirth(): Date | undefined {
    return this.props.dateOfBirth;
  }

  public get gender(): 'male' | 'female' | 'other' | undefined {
    return this.props.gender;
  }

  public get citizenId(): string | undefined {
    return this.props.citizenId;
  }

  public get emergencyContactName(): string | undefined {
    return this.props.emergencyContactName;
  }

  public get emergencyContactPhone(): string | undefined {
    return this.props.emergencyContactPhone;
  }

  /**
   * Check if personal info is complete
   */
  public isComplete(): boolean {
    return !!(
      this.props.fullName &&
      this.props.phoneNumber &&
      this.props.address &&
      this.props.dateOfBirth &&
      this.props.gender &&
      this.props.citizenId
    );
  }

  /**
   * Check if has Vietnamese citizen ID
   */
  public hasVietnameseId(): boolean {
    return !!this.props.citizenId && PersonalInfo.isValidCitizenId(this.props.citizenId);
  }

  /**
   * Check if has valid phone number
   */
  public hasValidPhoneNumber(): boolean {
    return !!this.props.phoneNumber && PersonalInfo.isValidVietnamesePhone(this.props.phoneNumber);
  }

  /**
   * Calculate age from date of birth
   */
  public getAge(): number | null {
    if (!this.props.dateOfBirth) {
      return null;
    }

    const today = new Date();
    const birthDate = new Date(this.props.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }
}
