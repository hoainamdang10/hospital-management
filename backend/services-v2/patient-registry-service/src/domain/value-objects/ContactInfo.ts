/**
 * ContactInfo Value Object
 * Patient contact information with Vietnamese standards
 */

import { ValueObject } from '@shared/domain/base/value-object';

export interface ContactInfoProps {
  primaryPhone: string;
  secondaryPhone?: string | undefined;
  email?: string | undefined;
  address: Address;
  preferredContactMethod: 'phone' | 'email' | 'sms';
}

export interface Address {
  street: string;
  ward: string;
  district: string;
  city: string;
  province: string; // Province/City level (e.g., "Hồ Chí Minh", "Đồng Nai", "Hà Nội")
  postalCode?: string | undefined;
  country: string;
}

export class ContactInfo extends ValueObject<ContactInfoProps> {
  private constructor(props: ContactInfoProps) {
    super(props);
  }

  protected validateFormat(): void {
    if (!ContactInfo.isValidVietnamesePhoneNumber(this.props.primaryPhone)) {
      throw new Error('Số điện thoại chính không đúng định dạng Việt Nam');
    }
    if (this.props.email && !ContactInfo.isValidEmail(this.props.email)) {
      throw new Error('Email không đúng định dạng');
    }
  }

  public static create(props: ContactInfoProps): ContactInfo {
    // Validate required fields
    if (!props.primaryPhone || props.primaryPhone.trim().length === 0) {
      throw new Error('Số điện thoại chính không được để trống');
    }

    if (!this.isValidVietnamesePhoneNumber(props.primaryPhone)) {
      throw new Error('Số điện thoại chính không đúng định dạng Việt Nam');
    }

    if (props.secondaryPhone && !this.isValidVietnamesePhoneNumber(props.secondaryPhone)) {
      throw new Error('Số điện thoại phụ không đúng định dạng Việt Nam');
    }

    if (props.email && !this.isValidEmail(props.email)) {
      throw new Error('Email không đúng định dạng');
    }

    // Validate address
    if (!props.address.street || props.address.street.trim().length === 0) {
      throw new Error('Địa chỉ đường/phố không được để trống');
    }

    if (!props.address.ward || props.address.ward.trim().length === 0) {
      throw new Error('Phường/xã không được để trống');
    }

    if (!props.address.district || props.address.district.trim().length === 0) {
      throw new Error('Quận/huyện không được để trống');
    }

    if (!props.address.city || props.address.city.trim().length === 0) {
      throw new Error('Thành phố/quận/huyện không được để trống');
    }

    if (!props.address.province || props.address.province.trim().length === 0) {
      throw new Error('Tỉnh/thành phố không được để trống');
    }

    return new ContactInfo({
      primaryPhone: props.primaryPhone.trim(),
      secondaryPhone: props.secondaryPhone?.trim(),
      email: props.email?.trim().toLowerCase(),
      address: {
        street: props.address.street.trim(),
        ward: props.address.ward.trim(),
        district: props.address.district.trim(),
        city: props.address.city.trim(),
        province: props.address.province.trim(),
        postalCode: props.address.postalCode?.trim(),
        country: props.address.country || 'Việt Nam'
      },
      preferredContactMethod: props.preferredContactMethod
    });
  }

  // Getters
  public get primaryPhone(): string {
    return this.props.primaryPhone;
  }

  public get secondaryPhone(): string | undefined {
    return this.props.secondaryPhone;
  }

  public get email(): string | undefined {
    return this.props.email;
  }

  public get address(): Address {
    return { ...this.props.address };
  }

  public get preferredContactMethod(): 'phone' | 'email' | 'sms' {
    return this.props.preferredContactMethod;
  }

  // Business methods
  public getFormattedPrimaryPhone(): string {
    const phone = this.props.primaryPhone;
    return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  }

  public getFormattedSecondaryPhone(): string | undefined {
    if (!this.props.secondaryPhone) {
      return undefined;
    }
    const phone = this.props.secondaryPhone;
    return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  }

  public getFullAddress(): string {
    const { street, ward, district, city, province, country } = this.props.address;
    return `${street}, ${ward}, ${district}, ${city}, ${province}, ${country}`;
  }

  public getShortAddress(): string {
    const { district, city } = this.props.address;
    return `${district}, ${city}`;
  }

  public hasEmail(): boolean {
    return !!this.props.email;
  }

  public hasSecondaryPhone(): boolean {
    return !!this.props.secondaryPhone;
  }

  public canContactByEmail(): boolean {
    return this.hasEmail() &&
           (this.props.preferredContactMethod === 'email' ||
            this.props.preferredContactMethod === 'sms');
  }

  public canContactByPhone(): boolean {
    return this.props.preferredContactMethod === 'phone';
  }

  public canContactBySMS(): boolean {
    return this.props.preferredContactMethod === 'sms';
  }

  public getContactPhones(): string[] {
    const phones = [this.props.primaryPhone];
    if (this.props.secondaryPhone) {
      phones.push(this.props.secondaryPhone);
    }
    return phones;
  }

  // Vietnamese address specific methods
  public isInHoChiMinhCity(): boolean {
    return this.props.address.city.toLowerCase().includes('hồ chí minh') ||
           this.props.address.city.toLowerCase().includes('tp.hcm') ||
           this.props.address.city.toLowerCase().includes('sài gòn');
  }

  public isInHanoi(): boolean {
    return this.props.address.city.toLowerCase().includes('hà nội') ||
           this.props.address.city.toLowerCase().includes('hanoi');
  }

  public isInMajorCity(): boolean {
    return this.isInHoChiMinhCity() ||
           this.isInHanoi() ||
           this.props.address.city.toLowerCase().includes('đà nẵng') ||
           this.props.address.city.toLowerCase().includes('cần thơ') ||
           this.props.address.city.toLowerCase().includes('hải phòng');
  }

  // Validation methods
  private static isValidVietnamesePhoneNumber(phone: string): boolean {
    // Vietnamese phone number: 10 digits starting with 0
    const phoneRegex = /^0[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?/.source +
      /(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.source;
    return new RegExp(emailRegex).test(email);
  }

  // Update methods
  public updatePrimaryPhone(primaryPhone: string): ContactInfo {
    return ContactInfo.create({
      ...this.props,
      primaryPhone
    });
  }

  public updateSecondaryPhone(secondaryPhone?: string): ContactInfo {
    return ContactInfo.create({
      ...this.props,
      secondaryPhone
    });
  }

  public updateEmail(email?: string): ContactInfo {
    return ContactInfo.create({
      ...this.props,
      email
    });
  }

  public updateAddress(address: Address): ContactInfo {
    return ContactInfo.create({
      ...this.props,
      address
    });
  }

  public updatePreferredContactMethod(method: 'phone' | 'email' | 'sms'): ContactInfo {
    return ContactInfo.create({
      ...this.props,
      preferredContactMethod: method
    });
  }

  public override equals(other: ContactInfo): boolean {
    return (
      this.props.primaryPhone === other.props.primaryPhone &&
      this.props.secondaryPhone === other.props.secondaryPhone &&
      this.props.email === other.props.email &&
      this.props.address.street === other.props.address.street &&
      this.props.address.ward === other.props.address.ward &&
      this.props.address.district === other.props.address.district &&
      this.props.address.city === other.props.address.city &&
      this.props.address.postalCode === other.props.address.postalCode &&
      this.props.address.country === other.props.address.country &&
      this.props.preferredContactMethod === other.props.preferredContactMethod
    );
  }
}
