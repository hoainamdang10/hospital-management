/**
 * PersonalInfo Value Object
 * Encapsulates personal information for staff members
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ValueObject } from '@shared/domain/base/value-object';

export interface PersonalInfoProps {
  fullName: string;
  citizenId?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  phoneNumber?: string;
  email?: string;
  address?: string;
}

export class PersonalInfo extends ValueObject<PersonalInfoProps> {
  private constructor(props: PersonalInfoProps) {
    super(props);
  }

  /**
   * Validate format - required by ValueObject base class
   */
  protected validateFormat(): void {
    if (!this.props.fullName || this.props.fullName.trim().length === 0) {
      throw new Error('Tên đầy đủ không được để trống');
    }

    if (this.props.fullName.trim().length < 2) {
      throw new Error('Tên đầy đủ phải có ít nhất 2 ký tự');
    }

    // Validate citizen ID format if provided (12 digits)
    if (this.props.citizenId && !/^\d{12}$/.test(this.props.citizenId)) {
      throw new Error('CCCD phải có 12 chữ số');
    }

    // Validate phone number format if provided
    if (this.props.phoneNumber && !/^[0-9]{10,11}$/.test(this.props.phoneNumber)) {
      throw new Error('Số điện thoại không hợp lệ');
    }

    // Validate email format if provided
    if (this.props.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.props.email)) {
      throw new Error('Email không hợp lệ');
    }
  }

  public static create(props: PersonalInfoProps): PersonalInfo {
    return new PersonalInfo({
      fullName: props.fullName.trim(),
      citizenId: props.citizenId?.trim(),
      dateOfBirth: props.dateOfBirth,
      gender: props.gender,
      phoneNumber: props.phoneNumber?.trim(),
      email: props.email?.trim(),
      address: props.address?.trim()
    });
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get citizenId(): string | undefined {
    return this.props.citizenId;
  }

  get dateOfBirth(): Date | undefined {
    return this.props.dateOfBirth;
  }

  get gender(): 'male' | 'female' | 'other' | undefined {
    return this.props.gender;
  }

  get phoneNumber(): string | undefined {
    return this.props.phoneNumber;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get address(): string | undefined {
    return this.props.address;
  }
}

