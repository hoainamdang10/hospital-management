/**
 * PersonalInfo Value Object
 * Encapsulates personal information with Vietnamese healthcare standards
 */

import { ValueObject } from '../../../shared/domain/ValueObject';

interface PersonalInfoProps {
  fullName: string;
  phoneNumber: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  nationalId?: string;
  emergencyContact?: string;
}

export class PersonalInfo extends ValueObject<PersonalInfoProps> {
  private constructor(props: PersonalInfoProps) {
    super(props);
  }

  public static create(props: PersonalInfoProps): PersonalInfo {
    // Validate required fields
    if (!props.fullName || props.fullName.trim().length === 0) {
      throw new Error('Họ và tên không được để trống');
    }

    if (!props.phoneNumber || props.phoneNumber.trim().length === 0) {
      throw new Error('Số điện thoại không được để trống');
    }

    // Validate Vietnamese phone number format
    if (!this.isValidVietnamesePhoneNumber(props.phoneNumber)) {
      throw new Error('Số điện thoại không đúng định dạng Việt Nam (10 số, bắt đầu bằng 0)');
    }

    // Validate full name (Vietnamese characters)
    if (!this.isValidVietnameseName(props.fullName)) {
      throw new Error('Họ và tên chỉ được chứa chữ cái và khoảng trắng');
    }

    // Validate national ID if provided
    if (props.nationalId && !this.isValidVietnameseNationalId(props.nationalId)) {
      throw new Error('Số CMND/CCCD không đúng định dạng (9 hoặc 12 số)');
    }

    // Validate date of birth
    if (props.dateOfBirth && props.dateOfBirth > new Date()) {
      throw new Error('Ngày sinh không được là ngày trong tương lai');
    }

    return new PersonalInfo({
      fullName: props.fullName.trim(),
      phoneNumber: props.phoneNumber.trim(),
      dateOfBirth: props.dateOfBirth,
      gender: props.gender,
      address: props.address?.trim(),
      nationalId: props.nationalId?.trim(),
      emergencyContact: props.emergencyContact?.trim()
    });
  }

  // Getters
  public get fullName(): string {
    return this.props.fullName;
  }

  public get phoneNumber(): string {
    return this.props.phoneNumber;
  }

  public get dateOfBirth(): Date | undefined {
    return this.props.dateOfBirth;
  }

  public get gender(): 'male' | 'female' | 'other' | undefined {
    return this.props.gender;
  }

  public get address(): string | undefined {
    return this.props.address;
  }

  public get nationalId(): string | undefined {
    return this.props.nationalId;
  }

  public get emergencyContact(): string | undefined {
    return this.props.emergencyContact;
  }

  // Business methods
  public getAge(): number | undefined {
    if (!this.props.dateOfBirth) return undefined;
    
    const today = new Date();
    const birthDate = this.props.dateOfBirth;
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  public getDisplayName(): string {
    return this.props.fullName;
  }

  public getFormattedPhoneNumber(): string {
    // Format: 0xxx xxx xxx
    const phone = this.props.phoneNumber;
    return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  }

  public isMinor(): boolean {
    const age = this.getAge();
    return age !== undefined && age < 18;
  }

  // Validation methods
  private static isValidVietnamesePhoneNumber(phone: string): boolean {
    // Vietnamese phone number: 10 digits starting with 0
    const phoneRegex = /^0[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  private static isValidVietnameseName(name: string): boolean {
    // Vietnamese name: letters, spaces, and Vietnamese diacritics
    const nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/;
    return nameRegex.test(name);
  }

  private static isValidVietnameseNationalId(nationalId: string): boolean {
    // Vietnamese National ID: 9 digits (old CMND) or 12 digits (new CCCD)
    const nationalIdRegex = /^[0-9]{9}$|^[0-9]{12}$/;
    return nationalIdRegex.test(nationalId);
  }

  // Update methods
  public updatePhoneNumber(phoneNumber: string): PersonalInfo {
    return PersonalInfo.create({
      ...this.props,
      phoneNumber
    });
  }

  public updateAddress(address: string): PersonalInfo {
    return PersonalInfo.create({
      ...this.props,
      address
    });
  }

  public updateEmergencyContact(emergencyContact: string): PersonalInfo {
    return PersonalInfo.create({
      ...this.props,
      emergencyContact
    });
  }

  public equals(other: PersonalInfo): boolean {
    return (
      this.props.fullName === other.props.fullName &&
      this.props.phoneNumber === other.props.phoneNumber &&
      this.props.dateOfBirth?.getTime() === other.props.dateOfBirth?.getTime() &&
      this.props.gender === other.props.gender &&
      this.props.address === other.props.address &&
      this.props.nationalId === other.props.nationalId &&
      this.props.emergencyContact === other.props.emergencyContact
    );
  }
}
