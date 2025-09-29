/**
 * Email Value Object
 * Validates and encapsulates email addresses
 */

import { ValueObject } from '../../../shared/domain/ValueObject';

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props);
  }

  public static create(email: string): Email {
    if (!email || email.trim().length === 0) {
      throw new Error('Email không được để trống');
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!this.isValidEmail(normalizedEmail)) {
      throw new Error('Định dạng email không hợp lệ');
    }

    if (normalizedEmail.length > 254) {
      throw new Error('Email quá dài (tối đa 254 ký tự)');
    }

    return new Email({ value: normalizedEmail });
  }

  public get value(): string {
    return this.props.value;
  }

  public get domain(): string {
    return this.props.value.split('@')[1];
  }

  public get localPart(): string {
    return this.props.value.split('@')[0];
  }

  private static isValidEmail(email: string): boolean {
    // RFC 5322 compliant email regex (simplified)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  public isHospitalEmail(): boolean {
    const hospitalDomains = ['hospital.com', 'benhvien.vn', 'medic.vn'];
    return hospitalDomains.includes(this.domain);
  }

  public equals(other: Email): boolean {
    return this.props.value === other.props.value;
  }

  public toString(): string {
    return this.props.value;
  }
}
