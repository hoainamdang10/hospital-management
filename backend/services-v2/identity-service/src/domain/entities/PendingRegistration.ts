/**
 * PendingRegistration Entity
 * Represents a user registration awaiting email verification
 * 
 * Design Pattern: Verify-First Approach
 * - User data stored temporarily until email verified
 * - Auto-expires after 24 hours
 * - Prevents database pollution from unverified users
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */

import { Entity } from '@shared/domain/base/entity';
import { v4 as uuidv4 } from 'uuid';
import { Email } from '../value-objects/Email';

export interface PendingRegistrationData {
  fullName: string;
  phoneNumber?: string;
  citizenId?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  roleType: string;
}

export type PendingRegistrationStatus =
  | 'PENDING'      // Created, email not sent yet
  | 'EMAIL_SENT'   // Email sent successfully
  | 'EMAIL_RESENT' // Email resent (user requested resend)
  | 'VERIFIED'     // User verified email
  | 'FAILED'       // Email sending failed
  | 'EXPIRED';     // Token expired

interface PendingRegistrationProps {
  email: Email;
  passwordHash: string;
  userData: PendingRegistrationData;
  verificationToken: string;
  expiresAt: Date;
  createdAt: Date;
  isUsed: boolean;
  status?: PendingRegistrationStatus; // Optional for backward compatibility
}

export class PendingRegistration extends Entity<PendingRegistrationProps> {
  private constructor(props: PendingRegistrationProps, id?: string) {
    super(props, id);
    this.validateInvariants();
  }

  /**
   * Factory method for creating new pending registration
   */
  public static create(
    email: Email,
    passwordHash: string,
    userData: PendingRegistrationData,
    verificationToken: string,
    expiryHours: number = 24
  ): PendingRegistration {
    // Validate expiryHours
    if (expiryHours <= 0) {
      throw new Error('Expiry hours must be greater than 0');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryHours * 60 * 60 * 1000);

    return new PendingRegistration({
      email,
      passwordHash,
      userData,
      verificationToken,
      expiresAt,
      createdAt: now,
      isUsed: false,
      status: 'PENDING' // Initial status
    }, uuidv4());
  }

  /**
   * Reconstitute from persistence data
   */
  public static fromPersistenceData(data: {
    id: string;
    email: string;
    passwordHash: string;
    userData: PendingRegistrationData;
    verificationToken: string;
    expiresAt: Date;
    createdAt: Date;
    isUsed: boolean;
    status?: PendingRegistrationStatus;
  }): PendingRegistration {
    return new PendingRegistration({
      email: Email.create(data.email),
      passwordHash: data.passwordHash,
      userData: data.userData,
      verificationToken: data.verificationToken,
      expiresAt: data.expiresAt,
      createdAt: data.createdAt,
      isUsed: data.isUsed,
      status: data.status || 'PENDING' // Default to PENDING for backward compatibility
    }, data.id);
  }

  /**
   * Validate business invariants
   */
  private validateInvariants(): void {
    if (!this.props.email) {
      throw new Error('Email is required for pending registration');
    }

    if (!this.props.passwordHash || this.props.passwordHash.trim().length === 0) {
      throw new Error('Password hash is required for pending registration');
    }

    if (!this.props.verificationToken || this.props.verificationToken.trim().length === 0) {
      throw new Error('Verification token is required for pending registration');
    }

    if (!this.props.userData || !this.props.userData.fullName) {
      throw new Error('User data with full name is required for pending registration');
    }

    if (!this.props.expiresAt || !(this.props.expiresAt instanceof Date)) {
      throw new Error('Expiration date is required for pending registration');
    }
  }

  /**
   * Check if pending registration is expired
   */
  public isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  /**
   * Mark as used (after successful verification)
   */
  public markAsUsed(): void {
    if (this.props.isUsed) {
      throw new Error('Pending registration already used');
    }

    if (this.isExpired()) {
      throw new Error('Cannot mark expired pending registration as used');
    }

    this.props.isUsed = true;
  }

  // Getters
  public get email(): Email {
    return this.props.email;
  }

  public get passwordHash(): string {
    return this.props.passwordHash;
  }

  public get userData(): PendingRegistrationData {
    return { ...this.props.userData }; // Return copy to prevent mutation
  }

  public get verificationToken(): string {
    return this.props.verificationToken;
  }

  public get expiresAt(): Date {
    return this.props.expiresAt;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get isUsed(): boolean {
    return this.props.isUsed;
  }

  public get status(): PendingRegistrationStatus {
    return this.props.status || 'PENDING'; // Default to PENDING for backward compatibility
  }

  /**
   * Mark email as sent successfully
   */
  public markEmailSent(): void {
    if (this.props.status === 'VERIFIED') {
      throw new Error('Cannot mark verified registration as email sent');
    }
    this.props.status = 'EMAIL_SENT';
  }

  /**
   * Mark as failed (e.g., email sending failed)
   */
  public markAsFailed(): void {
    if (this.props.status === 'VERIFIED') {
      throw new Error('Cannot mark verified registration as failed');
    }
    this.props.status = 'FAILED';
  }

  /**
   * Mark as verified (after successful email verification)
   */
  public markAsVerified(): void {
    if (this.isExpired()) {
      throw new Error('Cannot mark expired pending registration as verified');
    }
    this.props.status = 'VERIFIED';
    this.props.isUsed = true;
  }

  /**
   * Mark as expired
   */
  public markAsExpired(): void {
    this.props.status = 'EXPIRED';
  }

  /**
   * Get time remaining until expiration (in milliseconds)
   */
  public getTimeRemaining(): number {
    const now = new Date();
    return Math.max(0, this.props.expiresAt.getTime() - now.getTime());
  }

  /**
   * Check if can be verified (not expired and not used)
   */
  public canBeVerified(): boolean {
    return !this.isExpired() && !this.props.isUsed;
  }

  /**
   * Validate entity (required by Entity base class)
   */
  public validate(): void {
    this.validateInvariants();
  }

  /**
   * Convert to persistence format (required by Entity base class)
   */
  public toPersistence(): any {
    return {
      id: this.id,
      email: this.props.email.value,
      password_hash: this.props.passwordHash,
      user_data: this.props.userData,
      verification_token: this.props.verificationToken,
      expires_at: this.props.expiresAt,
      created_at: this.props.createdAt,
      is_used: this.props.isUsed
    };
  }
}

