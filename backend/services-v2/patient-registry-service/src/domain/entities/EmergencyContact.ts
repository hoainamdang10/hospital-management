/**
 * EmergencyContact Entity - Patient Registry
 * Patient emergency contact information
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { Entity } from '@shared/domain/base/entity';

export interface EmergencyContactProps {
  id: string;
  name: string;
  relationship: string;
  primaryPhone: string;
  secondaryPhone?: string | undefined;
  email?: string | undefined;
  address?: string | undefined;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class EmergencyContact extends Entity<EmergencyContactProps> {
  private constructor(props: EmergencyContactProps) {
    super(props);
  }

  /**
   * Create new emergency contact
   */
  public static create(
    name: string,
    relationship: string,
    primaryPhone: string,
    secondaryPhone?: string,
    email?: string,
    address?: string,
    isPrimary: boolean = false
  ): EmergencyContact {
    const now = new Date();

    return new EmergencyContact({
      id: Entity.generateId(),
      name: name.trim(),
      relationship: relationship.trim(),
      primaryPhone: primaryPhone.trim(),
      secondaryPhone: secondaryPhone?.trim(),
      email: email?.trim(),
      address: address?.trim(),
      isPrimary,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(props: EmergencyContactProps): EmergencyContact {
    return new EmergencyContact(props);
  }

  // Getters
  public get id(): string {
    return this.props.id;
  }

  public get name(): string {
    return this.props.name;
  }

  public get relationship(): string {
    return this.props.relationship;
  }

  public get phoneNumber(): string {
    return this.props.phoneNumber;
  }

  public get email(): string | undefined {
    return this.props.email;
  }

  public get address(): string | undefined {
    return this.props.address;
  }

  public get isPrimary(): boolean {
    return this.props.isPrimary;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  // Business methods
  public setPrimary(): void {
    this.props.isPrimary = true;
    this.props.updatedAt = new Date();
  }

  public removePrimary(): void {
    this.props.isPrimary = false;
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public updateContactInfo(
    name?: string,
    phoneNumber?: string,
    email?: string,
    address?: string
  ): void {
    if (name) this.props.name = name.trim();
    if (phoneNumber) this.props.phoneNumber = phoneNumber.trim();
    if (email !== undefined) this.props.email = email?.trim();
    if (address !== undefined) this.props.address = address?.trim();
    this.props.updatedAt = new Date();
  }

  // Validation methods
  public isValid(): boolean {
    return (
      this.props.name.length > 0 &&
      this.props.relationship.length > 0 &&
      this.props.phoneNumber.length > 0 &&
      EmergencyContact.isValidVietnamesePhone(this.props.phoneNumber)
    );
  }

  private static isValidVietnamesePhone(phone: string): boolean {
    // Vietnamese phone: 10 digits, starts with 0
    const phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  // Persistence methods
  public toPersistence(): any {
    return {
      id: this.props.id,
      name: this.props.name,
      relationship: this.props.relationship,
      phoneNumber: this.props.phoneNumber,
      email: this.props.email,
      address: this.props.address,
      isPrimary: this.props.isPrimary,
      isActive: this.props.isActive,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString()
    };
  }

  public static fromPersistence(data: any): EmergencyContact {
    return EmergencyContact.reconstitute({
      id: data.id,
      name: data.name,
      relationship: data.relationship,
      phoneNumber: data.phoneNumber,
      email: data.email,
      address: data.address,
      isPrimary: data.isPrimary,
      isActive: data.isActive,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    });
  }

  // Logging methods
  public getSummaryForLogging(): object {
    return {
      id: this.props.id,
      name: this.props.name,
      relationship: this.props.relationship,
      isPrimary: this.props.isPrimary,
      isActive: this.props.isActive
    };
  }

  public getMaskedPhoneNumber(): string {
    const phone = this.props.phoneNumber;
    if (phone.length <= 4) return '***';
    return '***' + phone.slice(-4);
  }
}

