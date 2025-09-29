/**
 * Emergency Contact Value Object - Healthcare Domain
 * Encapsulates emergency contact information with validation
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance HIPAA, Healthcare Standards
 */

import { ValueObject } from '../base/value-object';

interface EmergencyContactProps {
  fullName: string;
  relationship: string;
  phoneNumber: string;
  alternatePhoneNumber?: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
}

/**
 * Emergency Contact Value Object
 * Contains validated emergency contact information
 */
export class EmergencyContact extends ValueObject<EmergencyContactProps> {
  private static readonly NAME_PATTERN = /^[\p{L}\s\-'\.]{2,100}$/u;
  private static readonly PHONE_PATTERN = /^0\d{9}$/; // Vietnamese phone format
  private static readonly EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(props: EmergencyContactProps) {
    super(props);
  }

  /**
   * Create emergency contact with validation
   */
  public static create(
    fullName: string,
    relationship: string,
    phoneNumber: string,
    alternatePhoneNumber?: string,
    email?: string,
    address?: string,
    isPrimary: boolean = true
  ): EmergencyContact {
    const emergencyContact = new EmergencyContact({
      fullName: fullName.trim(),
      relationship: relationship.trim(),
      phoneNumber: phoneNumber.trim(),
      alternatePhoneNumber: alternatePhoneNumber?.trim(),
      email: email?.trim().toLowerCase(),
      address: address?.trim(),
      isPrimary,
    });

    if (!emergencyContact.isValid()) {
      throw new Error('Thông tin người liên hệ khẩn cấp không hợp lệ');
    }

    return emergencyContact;
  }

  /**
   * Validate emergency contact information
   */
  public isValid(): boolean {
    // Validate full name
    if (!this.props.fullName || !EmergencyContact.NAME_PATTERN.test(this.props.fullName)) {
      return false;
    }

    // Validate relationship
    if (!this.props.relationship || this.props.relationship.trim().length < 2) {
      return false;
    }

    // Validate primary phone number
    if (!this.props.phoneNumber || !EmergencyContact.PHONE_PATTERN.test(this.props.phoneNumber)) {
      return false;
    }

    // Validate alternate phone number if provided
    if (this.props.alternatePhoneNumber && 
        !EmergencyContact.PHONE_PATTERN.test(this.props.alternatePhoneNumber)) {
      return false;
    }

    // Validate email if provided
    if (this.props.email && !EmergencyContact.EMAIL_PATTERN.test(this.props.email)) {
      return false;
    }

    // Validate address if provided
    if (this.props.address && this.props.address.trim().length < 10) {
      return false;
    }

    return true;
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
   * Get relationship display text in Vietnamese
   */
  public getRelationshipDisplayText(): string {
    const relationship = this.props.relationship.toLowerCase();
    
    const relationshipMap: Record<string, string> = {
      'father': 'Cha',
      'mother': 'Mẹ',
      'parent': 'Cha/Mẹ',
      'spouse': 'Vợ/Chồng',
      'husband': 'Chồng',
      'wife': 'Vợ',
      'son': 'Con trai',
      'daughter': 'Con gái',
      'child': 'Con',
      'brother': 'Anh/Em trai',
      'sister': 'Chị/Em gái',
      'sibling': 'Anh/Chị/Em',
      'friend': 'Bạn',
      'guardian': 'Người giám hộ',
      'relative': 'Người thân',
      'colleague': 'Đồng nghiệp',
      'neighbor': 'Hàng xóm',
      'other': 'Khác'
    };

    return relationshipMap[relationship] || this.props.relationship;
  }

  /**
   * Format phone number for display
   */
  public getFormattedPhoneNumber(): string {
    const phone = this.props.phoneNumber;
    return `${phone.substring(0, 4)} ${phone.substring(4, 7)} ${phone.substring(7)}`;
  }

  /**
   * Format alternate phone number for display
   */
  public getFormattedAlternatePhoneNumber(): string {
    if (!this.props.alternatePhoneNumber) return '';
    
    const phone = this.props.alternatePhoneNumber;
    return `${phone.substring(0, 4)} ${phone.substring(4, 7)} ${phone.substring(7)}`;
  }

  /**
   * Get all available contact methods
   */
  public getAvailableContactMethods(): string[] {
    const methods: string[] = [];
    
    methods.push(`Điện thoại: ${this.getFormattedPhoneNumber()}`);
    
    if (this.props.alternatePhoneNumber) {
      methods.push(`Điện thoại phụ: ${this.getFormattedAlternatePhoneNumber()}`);
    }
    
    if (this.props.email) {
      methods.push(`Email: ${this.props.email}`);
    }
    
    return methods;
  }

  /**
   * Check if has alternate contact methods
   */
  public hasAlternateContactMethods(): boolean {
    return !!(this.props.alternatePhoneNumber || this.props.email);
  }

  /**
   * Check if has complete information
   */
  public hasCompleteInformation(): boolean {
    return !!(
      this.props.fullName &&
      this.props.relationship &&
      this.props.phoneNumber &&
      (this.props.alternatePhoneNumber || this.props.email) &&
      this.props.address
    );
  }

  /**
   * Get contact priority score (higher is better)
   */
  public getContactPriorityScore(): number {
    let score = 0;
    
    // Primary contact gets higher score
    if (this.props.isPrimary) score += 10;
    
    // Multiple contact methods increase score
    if (this.props.alternatePhoneNumber) score += 3;
    if (this.props.email) score += 2;
    if (this.props.address) score += 1;
    
    // Immediate family gets higher priority
    const immediateFamily = ['father', 'mother', 'parent', 'spouse', 'husband', 'wife'];
    if (immediateFamily.includes(this.props.relationship.toLowerCase())) {
      score += 5;
    }
    
    return score;
  }

  // Getters
  get fullName(): string {
    return this.props.fullName;
  }

  get relationship(): string {
    return this.props.relationship;
  }

  get phoneNumber(): string {
    return this.props.phoneNumber;
  }

  get alternatePhoneNumber(): string | undefined {
    return this.props.alternatePhoneNumber;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get address(): string | undefined {
    return this.props.address;
  }

  get isPrimary(): boolean {
    return this.props.isPrimary;
  }
}
