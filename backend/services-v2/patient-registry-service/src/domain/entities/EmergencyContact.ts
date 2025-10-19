/**
 * EmergencyContact Entity - Patient Registry
 * Patient emergency contact information
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { Entity } from '@shared/domain/base/entity';
import * as uuid from 'uuid';

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
  private constructor(props: EmergencyContactProps, id?: string) {
    super(props, id);
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
    const id = uuid.v4();

    return new EmergencyContact({
      id,
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
    }, id);
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(props: EmergencyContactProps): EmergencyContact {
    return new EmergencyContact(props, props.id);
  }

  // Getters
  public getId(): string {
    return this.id;
  }

  public get name(): string {
    return this.props.name;
  }

  public get relationship(): string {
    return this.props.relationship;
  }

  public get primaryPhone(): string {
    return this.props.primaryPhone;
  }

  public get secondaryPhone(): string | undefined {
    return this.props.secondaryPhone;
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
    primaryPhone?: string,
    secondaryPhone?: string,
    email?: string,
    address?: string
  ): void {
    if (name) {
      this.props.name = name.trim();
    }
    if (primaryPhone) {
      this.props.primaryPhone = primaryPhone.trim();
    }
    if (secondaryPhone !== undefined) {
      this.props.secondaryPhone = secondaryPhone?.trim();
    }
    if (email !== undefined) {
      this.props.email = email?.trim();
    }
    if (address !== undefined) {
      this.props.address = address?.trim();
    }
    this.props.updatedAt = new Date();
  }

  // Validation methods
  override validate(): void {
    if (!this.isValid()) {
      throw new Error('Invalid emergency contact');
    }
  }

  public isValid(): boolean {
    return (
      this.props.name.length > 0 &&
      this.props.relationship.length > 0 &&
      this.props.primaryPhone.length > 0 &&
      EmergencyContact.isValidVietnamesePhone(this.props.primaryPhone)
    );
  }

  private static isValidVietnamesePhone(phone: string): boolean {
    // Vietnamese phone: 10 digits, starts with 0
    const phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  // Persistence methods
  override toPersistence(): {
    id: string;
    name: string;
    relationship: string;
    primary_phone: string;
    secondary_phone?: string;
    email?: string;
    address?: string;
    is_primary: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    } {
    return {
      id: this.id,
      name: this.props.name,
      relationship: this.props.relationship,
      primary_phone: this.props.primaryPhone,
      secondary_phone: this.props.secondaryPhone,
      email: this.props.email,
      address: this.props.address,
      is_primary: this.props.isPrimary,
      is_active: this.props.isActive,
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString()
    };
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
    const phone = this.props.primaryPhone;
    if (phone.length <= 4) {
      return '***';
    }
    return '***' + phone.slice(-4);
  }
}

