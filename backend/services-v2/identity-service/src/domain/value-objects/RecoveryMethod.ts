/**
 * Recovery Method Value Object
 * Represents account recovery methods for a user
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD Value Object Pattern
 */

import { Email } from './Email';

export interface RecoveryMethodProps {
  userId: string;
  recoveryEmail?: string | null;
  recoveryEmailVerified: boolean;
  recoveryEmailVerifiedAt?: Date | null;
  lastUpdatedAt: Date;
  updatedBy?: string | null;
  createdAt: Date;
}

/**
 * Recovery Method Value Object
 * Immutable object representing user's account recovery methods
 */
export class RecoveryMethod {
  private readonly _userId: string;
  private readonly _recoveryEmail: Email | null;
  private readonly _recoveryEmailVerified: boolean;
  private readonly _recoveryEmailVerifiedAt: Date | null;
  private readonly _lastUpdatedAt: Date;
  private readonly _updatedBy: string | null;
  private readonly _createdAt: Date;

  private constructor(props: RecoveryMethodProps) {
    this._userId = props.userId;
    this._recoveryEmail = props.recoveryEmail ? Email.create(props.recoveryEmail) : null;
    this._recoveryEmailVerified = props.recoveryEmailVerified;
    this._recoveryEmailVerifiedAt = props.recoveryEmailVerifiedAt || null;
    this._lastUpdatedAt = props.lastUpdatedAt;
    this._updatedBy = props.updatedBy || null;
    this._createdAt = props.createdAt;
  }

  /**
   * Factory method to create RecoveryMethod
   * Validates all business rules
   */
  public static create(props: RecoveryMethodProps): RecoveryMethod {
    // Validate userId
    if (!props.userId || props.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    // Validate recovery email if provided
    if (props.recoveryEmail) {
      // Email validation is done in Email.create()
      // Additional validation: recovery email should be different from primary email
      // (This check should be done at application layer with user's primary email)
    }

    // Validate verified status consistency
    if (props.recoveryEmailVerified && !props.recoveryEmailVerifiedAt) {
      throw new Error('Verified recovery email must have verification timestamp');
    }

    if (!props.recoveryEmailVerified && props.recoveryEmailVerifiedAt) {
      throw new Error('Unverified recovery email cannot have verification timestamp');
    }

    // Validate timestamps
    if (props.lastUpdatedAt > new Date()) {
      throw new Error('Last updated timestamp cannot be in the future');
    }

    if (props.createdAt > new Date()) {
      throw new Error('Created timestamp cannot be in the future');
    }

    if (props.lastUpdatedAt < props.createdAt) {
      throw new Error('Last updated timestamp cannot be before created timestamp');
    }

    return new RecoveryMethod(props);
  }

  /**
   * Create default recovery method (no recovery email configured)
   */
  public static createDefault(userId: string): RecoveryMethod {
    return RecoveryMethod.create({
      userId,
      recoveryEmail: null,
      recoveryEmailVerified: false,
      recoveryEmailVerifiedAt: null,
      lastUpdatedAt: new Date(),
      updatedBy: null,
      createdAt: new Date()
    });
  }

  /**
   * Update recovery email
   * Returns new RecoveryMethod instance (immutable)
   */
  public updateRecoveryEmail(newEmail: string, updatedBy: string): RecoveryMethod {
    return RecoveryMethod.create({
      userId: this._userId,
      recoveryEmail: newEmail,
      recoveryEmailVerified: false, // Reset verification status
      recoveryEmailVerifiedAt: null,
      lastUpdatedAt: new Date(),
      updatedBy,
      createdAt: this._createdAt
    });
  }

  /**
   * Mark recovery email as verified
   * Returns new RecoveryMethod instance (immutable)
   */
  public markAsVerified(): RecoveryMethod {
    if (!this._recoveryEmail) {
      throw new Error('Cannot verify: no recovery email configured');
    }

    if (this._recoveryEmailVerified) {
      throw new Error('Recovery email is already verified');
    }

    return RecoveryMethod.create({
      userId: this._userId,
      recoveryEmail: this._recoveryEmail.value,
      recoveryEmailVerified: true,
      recoveryEmailVerifiedAt: new Date(),
      lastUpdatedAt: new Date(),
      updatedBy: this._updatedBy,
      createdAt: this._createdAt
    });
  }

  /**
   * Remove recovery email
   * Returns new RecoveryMethod instance (immutable)
   */
  public removeRecoveryEmail(updatedBy: string): RecoveryMethod {
    return RecoveryMethod.create({
      userId: this._userId,
      recoveryEmail: null,
      recoveryEmailVerified: false,
      recoveryEmailVerifiedAt: null,
      lastUpdatedAt: new Date(),
      updatedBy,
      createdAt: this._createdAt
    });
  }

  /**
   * Check if recovery email is configured
   */
  public hasRecoveryEmail(): boolean {
    return this._recoveryEmail !== null;
  }

  /**
   * Check if recovery email is verified
   */
  public isRecoveryEmailVerified(): boolean {
    return this._recoveryEmailVerified;
  }

  /**
   * Check if recovery email can be used for password reset
   */
  public canUseForRecovery(): boolean {
    return this.hasRecoveryEmail() && this.isRecoveryEmailVerified();
  }

  // Getters
  public get userId(): string {
    return this._userId;
  }

  public get recoveryEmail(): Email | null {
    return this._recoveryEmail;
  }

  public get recoveryEmailVerified(): boolean {
    return this._recoveryEmailVerified;
  }

  public get recoveryEmailVerifiedAt(): Date | null {
    return this._recoveryEmailVerifiedAt;
  }

  public get lastUpdatedAt(): Date {
    return this._lastUpdatedAt;
  }

  public get updatedBy(): string | null {
    return this._updatedBy;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * Convert to plain object for serialization
   */
  public toObject(): {
    userId: string;
    recoveryEmail: string | null;
    recoveryEmailVerified: boolean;
    recoveryEmailVerifiedAt: string | null;
    lastUpdatedAt: string;
    updatedBy: string | null;
    createdAt: string;
  } {
    return {
      userId: this._userId,
      recoveryEmail: this._recoveryEmail ? this._recoveryEmail.value : null,
      recoveryEmailVerified: this._recoveryEmailVerified,
      recoveryEmailVerifiedAt: this._recoveryEmailVerifiedAt
        ? this._recoveryEmailVerifiedAt.toISOString()
        : null,
      lastUpdatedAt: this._lastUpdatedAt.toISOString(),
      updatedBy: this._updatedBy,
      createdAt: this._createdAt.toISOString()
    };
  }

  /**
   * Check equality with another RecoveryMethod
   */
  public equals(other: RecoveryMethod): boolean {
    if (!other) return false;

    return (
      this._userId === other._userId &&
      this._recoveryEmail?.value === other._recoveryEmail?.value &&
      this._recoveryEmailVerified === other._recoveryEmailVerified &&
      this._recoveryEmailVerifiedAt?.getTime() === other._recoveryEmailVerifiedAt?.getTime()
    );
  }

  /**
   * Get a summary description of recovery methods
   */
  public getDescription(): string {
    if (!this.hasRecoveryEmail()) {
      return 'Chưa cấu hình email khôi phục';
    }

    if (this.isRecoveryEmailVerified()) {
      return `Email khôi phục: ${this._recoveryEmail!.value} (Đã xác thực)`;
    }

    return `Email khôi phục: ${this._recoveryEmail!.value} (Chưa xác thực)`;
  }
}

