/**
 * Contact Info Value Object - Healthcare Domain
 * Encapsulates patient contact information with validation
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance HIPAA, Healthcare Standards
 */

import { ValueObject } from '../base/value-object';

interface ContactInfoProps {
  phoneNumber: string;
  email?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  preferredContactMethod?: 'phone' | 'email' | 'sms';
}

/**
 * Contact Info Value Object
 * Contains validated contact information for patients
 */
export class ContactInfo extends ValueObject<ContactInfoProps> {
  private static readonly PHONE_PATTERN = /^0\d{9}$/; // Vietnamese phone format
  private static readonly EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly POSTAL_CODE_PATTERN = /^\d{5,6}$/;

  private constructor(props: ContactInfoProps) {
    super(props);
  }

  /**
   * Create contact info with validation
   */
  public static create(
    phoneNumber: string,
    email?: string,
    address?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    },
    preferredContactMethod?: 'phone' | 'email' | 'sms'
  ): ContactInfo {
    const contactInfo = new ContactInfo({
      phoneNumber: phoneNumber.trim(),
      email: email?.trim().toLowerCase(),
      address,
      preferredContactMethod: preferredContactMethod || 'phone',
    });

    if (!contactInfo.isValid()) {
      throw new Error('Thông tin liên hệ không hợp lệ');
    }

    return contactInfo;
  }

  /**
   * Validate contact information
   */
  public isValid(): boolean {
    // Validate phone number (required)
    if (!this.props.phoneNumber || !ContactInfo.PHONE_PATTERN.test(this.props.phoneNumber)) {
      return false;
    }

    // Validate email if provided
    if (this.props.email && !ContactInfo.EMAIL_PATTERN.test(this.props.email)) {
      return false;
    }

    // Validate address if provided
    if (this.props.address) {
      const { street, city, state, postalCode, country } = this.props.address;
      
      if (!street || street.trim().length < 5) return false;
      if (!city || city.trim().length < 2) return false;
      if (!state || state.trim().length < 2) return false;
      if (!country || country.trim().length < 2) return false;
      if (!postalCode || !ContactInfo.POSTAL_CODE_PATTERN.test(postalCode)) return false;
    }

    // Validate preferred contact method
    if (this.props.preferredContactMethod && 
        !['phone', 'email', 'sms'].includes(this.props.preferredContactMethod)) {
      return false;
    }

    return true;
  }

  /**
   * Format phone number for display
   */
  public getFormattedPhoneNumber(): string {
    const phone = this.props.phoneNumber;
    // Format: 0123 456 789
    return `${phone.substring(0, 4)} ${phone.substring(4, 7)} ${phone.substring(7)}`;
  }

  /**
   * Get masked phone number for privacy
   */
  public getMaskedPhoneNumber(): string {
    const phone = this.props.phoneNumber;
    return `${phone.substring(0, 4)} *** ${phone.substring(7)}`;
  }

  /**
   * Get masked email for privacy
   */
  public getMaskedEmail(): string {
    if (!this.props.email) return '';
    
    const [localPart, domain] = this.props.email.split('@');
    const maskedLocal = localPart.length > 2 
      ? `${localPart.substring(0, 2)}***${localPart.slice(-1)}`
      : '***';
    
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Get full address as formatted string
   */
  public getFormattedAddress(): string {
    if (!this.props.address) return '';
    
    const { street, city, state, postalCode, country } = this.props.address;
    return `${street}, ${city}, ${state} ${postalCode}, ${country}`;
  }

  /**
   * Check if has complete address
   */
  public hasCompleteAddress(): boolean {
    return this.props.address !== undefined;
  }

  /**
   * Check if has email
   */
  public hasEmail(): boolean {
    return this.props.email !== undefined && this.props.email.length > 0;
  }

  /**
   * Get preferred contact method display text
   */
  public getPreferredContactMethodDisplayText(): string {
    switch (this.props.preferredContactMethod) {
      case 'phone':
        return 'Điện thoại';
      case 'email':
        return 'Email';
      case 'sms':
        return 'Tin nhắn SMS';
      default:
        return 'Điện thoại';
    }
  }

  /**
   * Check if contact method is available
   */
  public isContactMethodAvailable(method: 'phone' | 'email' | 'sms'): boolean {
    switch (method) {
      case 'phone':
      case 'sms':
        return !!this.props.phoneNumber;
      case 'email':
        return !!this.props.email;
      default:
        return false;
    }
  }

  // Getters
  get phoneNumber(): string {
    return this.props.phoneNumber;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get address(): ContactInfoProps['address'] {
    return this.props.address;
  }

  get preferredContactMethod(): string {
    return this.props.preferredContactMethod || 'phone';
  }
}
