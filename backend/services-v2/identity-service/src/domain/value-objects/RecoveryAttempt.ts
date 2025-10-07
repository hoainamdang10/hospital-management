/**
 * Recovery Attempt Value Object
 * Represents a single account recovery attempt
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD Value Object Pattern
 */

export type RecoveryMethodType = 'primary_email' | 'recovery_email';
export type AttemptType = 'request_reset' | 'verify_token' | 'reset_password';

export interface RecoveryAttemptProps {
  id?: string;
  userId: string;
  recoveryMethod: RecoveryMethodType;
  attemptType: AttemptType;
  success: boolean;
  failureReason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  attemptedAt: Date;
}

/**
 * Recovery Attempt Value Object
 * Immutable object representing a single recovery attempt for audit trail
 */
export class RecoveryAttempt {
  private readonly _id: string | undefined;
  private readonly _userId: string;
  private readonly _recoveryMethod: RecoveryMethodType;
  private readonly _attemptType: AttemptType;
  private readonly _success: boolean;
  private readonly _failureReason: string | null;
  private readonly _ipAddress: string | null;
  private readonly _userAgent: string | null;
  private readonly _attemptedAt: Date;

  private constructor(props: RecoveryAttemptProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._recoveryMethod = props.recoveryMethod;
    this._attemptType = props.attemptType;
    this._success = props.success;
    this._failureReason = props.failureReason || null;
    this._ipAddress = props.ipAddress || null;
    this._userAgent = props.userAgent || null;
    this._attemptedAt = props.attemptedAt;
  }

  /**
   * Factory method to create RecoveryAttempt
   * Validates all business rules
   */
  public static create(props: RecoveryAttemptProps): RecoveryAttempt {
    // Validate userId
    if (!props.userId || props.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    // Validate recovery method
    const validRecoveryMethods: RecoveryMethodType[] = ['primary_email', 'recovery_email'];
    if (!validRecoveryMethods.includes(props.recoveryMethod)) {
      throw new Error(`Invalid recovery method: ${props.recoveryMethod}`);
    }

    // Validate attempt type
    const validAttemptTypes: AttemptType[] = ['request_reset', 'verify_token', 'reset_password'];
    if (!validAttemptTypes.includes(props.attemptType)) {
      throw new Error(`Invalid attempt type: ${props.attemptType}`);
    }

    // Validate failure reason consistency
    if (!props.success && !props.failureReason) {
      throw new Error('Failed attempts must have a failure reason');
    }

    if (props.success && props.failureReason) {
      throw new Error('Successful attempts cannot have a failure reason');
    }

    // Validate timestamp
    if (props.attemptedAt > new Date()) {
      throw new Error('Attempted timestamp cannot be in the future');
    }

    // Validate IP address format (basic validation)
    if (props.ipAddress && props.ipAddress.trim().length === 0) {
      throw new Error('IP address cannot be empty string');
    }

    // Validate user agent
    if (props.userAgent && props.userAgent.trim().length === 0) {
      throw new Error('User agent cannot be empty string');
    }

    return new RecoveryAttempt(props);
  }

  /**
   * Create successful recovery attempt
   */
  public static createSuccess(
    userId: string,
    recoveryMethod: RecoveryMethodType,
    attemptType: AttemptType,
    ipAddress?: string,
    userAgent?: string
  ): RecoveryAttempt {
    return RecoveryAttempt.create({
      userId,
      recoveryMethod,
      attemptType,
      success: true,
      failureReason: null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      attemptedAt: new Date()
    });
  }

  /**
   * Create failed recovery attempt
   */
  public static createFailure(
    userId: string,
    recoveryMethod: RecoveryMethodType,
    attemptType: AttemptType,
    failureReason: string,
    ipAddress?: string,
    userAgent?: string
  ): RecoveryAttempt {
    return RecoveryAttempt.create({
      userId,
      recoveryMethod,
      attemptType,
      success: false,
      failureReason,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      attemptedAt: new Date()
    });
  }

  /**
   * Check if attempt was successful
   */
  public isSuccessful(): boolean {
    return this._success;
  }

  /**
   * Check if attempt was a password reset request
   */
  public isResetRequest(): boolean {
    return this._attemptType === 'request_reset';
  }

  /**
   * Check if attempt was a token verification
   */
  public isTokenVerification(): boolean {
    return this._attemptType === 'verify_token';
  }

  /**
   * Check if attempt was a password reset
   */
  public isPasswordReset(): boolean {
    return this._attemptType === 'reset_password';
  }

  /**
   * Check if attempt used primary email
   */
  public usedPrimaryEmail(): boolean {
    return this._recoveryMethod === 'primary_email';
  }

  /**
   * Check if attempt used recovery email
   */
  public usedRecoveryEmail(): boolean {
    return this._recoveryMethod === 'recovery_email';
  }

  // Getters
  public get id(): string | undefined {
    return this._id;
  }

  public get userId(): string {
    return this._userId;
  }

  public get recoveryMethod(): RecoveryMethodType {
    return this._recoveryMethod;
  }

  public get attemptType(): AttemptType {
    return this._attemptType;
  }

  public get success(): boolean {
    return this._success;
  }

  public get failureReason(): string | null {
    return this._failureReason;
  }

  public get ipAddress(): string | null {
    return this._ipAddress;
  }

  public get userAgent(): string | null {
    return this._userAgent;
  }

  public get attemptedAt(): Date {
    return this._attemptedAt;
  }

  /**
   * Convert to plain object for serialization
   */
  public toObject(): {
    id?: string;
    userId: string;
    recoveryMethod: RecoveryMethodType;
    attemptType: AttemptType;
    success: boolean;
    failureReason: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    attemptedAt: string;
  } {
    return {
      id: this._id,
      userId: this._userId,
      recoveryMethod: this._recoveryMethod,
      attemptType: this._attemptType,
      success: this._success,
      failureReason: this._failureReason,
      ipAddress: this._ipAddress,
      userAgent: this._userAgent,
      attemptedAt: this._attemptedAt.toISOString()
    };
  }

  /**
   * Get a human-readable description of the attempt
   */
  public getDescription(): string {
    const methodStr = this.usedPrimaryEmail() ? 'email chính' : 'email khôi phục';
    const typeStr = this.isResetRequest()
      ? 'yêu cầu đặt lại mật khẩu'
      : this.isTokenVerification()
      ? 'xác thực token'
      : 'đặt lại mật khẩu';
    const statusStr = this.isSuccessful() ? 'thành công' : 'thất bại';

    let description = `${typeStr} qua ${methodStr} - ${statusStr}`;

    if (!this.isSuccessful() && this._failureReason) {
      description += ` (${this._failureReason})`;
    }

    return description;
  }

  /**
   * Get attempt type in Vietnamese
   */
  public getAttemptTypeVietnamese(): string {
    switch (this._attemptType) {
      case 'request_reset':
        return 'Yêu cầu đặt lại mật khẩu';
      case 'verify_token':
        return 'Xác thực token';
      case 'reset_password':
        return 'Đặt lại mật khẩu';
      default:
        return 'Không xác định';
    }
  }

  /**
   * Get recovery method in Vietnamese
   */
  public getRecoveryMethodVietnamese(): string {
    switch (this._recoveryMethod) {
      case 'primary_email':
        return 'Email chính';
      case 'recovery_email':
        return 'Email khôi phục';
      default:
        return 'Không xác định';
    }
  }
}

