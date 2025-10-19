/**
 * Email Value Object - Enhanced with Error Handling
 * Validates and encapsulates email addresses
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, Anti-Pattern Mitigation, Clean Architecture
 */

import { ValueObject } from '@shared/domain/base/value-object';

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props);
  }

  /**
   * Validate email format - required by ValueObject base class
   */
  protected validateFormat(): void {
    // Validation is done in create() method before construction
    // This method is called by base class constructor
  }

  /**
   * Create Email with enhanced validation and error handling
   */
  public static create(email: string): Email {
    try {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create Email: ${message}`);
    }
  }

  /**
   * Create Email from string - strict validation
   * SECURITY FIX: No fallback, throws error on invalid email
   */
  public static fromString(email: string): Email {
    // Always use strict validation - no fallback
    return this.create(email);
  }

  /**
   * Email validation
   */
  public isValid(): boolean {
    return Email.isValidEmail(this.props.value);
  }

  public get value(): string {
    return this.props.value;
  }

  public get domain(): string {
    const parts = this.props.value.split('@');
    return parts.length > 1 ? parts[1] : '';
  }

  public get localPart(): string {
    const parts = this.props.value.split('@');
    return parts.length > 0 ? parts[0] : '';
  }

  /**
   * Enhanced email validation with Vietnamese healthcare domains
   */
  private static isValidEmail(email: string): boolean {
    // RFC 5322 compliant email regex (simplified)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  /**
   * Check if email belongs to Vietnamese hospital
   */
  public isVietnameseHospitalEmail(): boolean {
    const vietnameseHospitalDomains = [
      'benhvien.vn',
      'hospital.vn',
      'medic.vn',
      'bv.vn',
      'phongkham.vn',
      'clinic.vn',
      'yte.vn'
    ];
    return vietnameseHospitalDomains.includes(this.domain);
  }

  /**
   * Check if email belongs to healthcare staff
   */
  public isHealthcareStaffEmail(): boolean {
    const domain = this.domain.toLowerCase();
    const localPart = this.localPart.toLowerCase();

    // Check domain patterns
    const healthcareDomains = ['hospital', 'clinic', 'medic', 'doctor', 'nurse', 'benhvien', 'phongkham'];
    const domainMatch = healthcareDomains.some(pattern => domain.includes(pattern));

    // Check local part patterns
    const healthcarePatterns = ['doctor', 'dr', 'nurse', 'bacsi', 'yta', 'admin'];
    const localMatch = healthcarePatterns.some(pattern => localPart.includes(pattern));

    return domainMatch || localMatch || this.isVietnameseHospitalEmail();
  }

  /**
   * Get email type for role assignment
   */
  public getEmailType(): 'patient' | 'doctor' | 'nurse' | 'admin' | 'staff' | 'unknown' {
    const localPart = this.localPart.toLowerCase();

    if (localPart.includes('admin') || localPart.includes('quanly')) {
      return 'admin';
    }

    if (localPart.includes('doctor') || localPart.includes('dr') || localPart.includes('bacsi')) {
      return 'doctor';
    }

    if (localPart.includes('nurse') || localPart.includes('yta')) {
      return 'nurse';
    }

    if (this.isHealthcareStaffEmail()) {
      return 'staff';
    }

    return 'patient'; // Default to patient for public emails
  }

  /**
   * Mask email for logging (HIPAA compliance)
   */
  public getMaskedEmail(): string {
    const localPart = this.localPart;
    const domain = this.domain;

    if (localPart.length <= 2) {
      return `${localPart}***@${domain}`;
    }

    const maskedLocal = localPart.substring(0, 2) + '*'.repeat(localPart.length - 2);
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Equality check
   */
  public equals(other: Email): boolean {
    if (!other || !(other instanceof Email)) {
      return false;
    }
    return this.props.value === other.props.value;
  }

  /**
   * String conversion
   */
  public toString(): string {
    return this.props.value;
  }
}
