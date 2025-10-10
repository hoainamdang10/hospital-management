/**
 * Password Policy Value Object
 * Defines password requirements and validation rules
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

export interface PasswordPolicyProps {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expirationDays: number | null;
  preventReuse: number;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export class PasswordPolicy {
  private readonly _minLength: number;
  private readonly _requireUppercase: boolean;
  private readonly _requireLowercase: boolean;
  private readonly _requireNumbers: boolean;
  private readonly _requireSpecialChars: boolean;
  private readonly _expirationDays: number | null;
  private readonly _preventReuse: number;
  private readonly _updatedAt: Date;
  private readonly _updatedBy: string | null;

  private constructor(props: PasswordPolicyProps) {
    this._minLength = props.minLength;
    this._requireUppercase = props.requireUppercase;
    this._requireLowercase = props.requireLowercase;
    this._requireNumbers = props.requireNumbers;
    this._requireSpecialChars = props.requireSpecialChars;
    this._expirationDays = props.expirationDays;
    this._preventReuse = props.preventReuse;
    this._updatedAt = props.updatedAt || new Date();
    this._updatedBy = props.updatedBy || null;
  }

  /**
   * Create a new PasswordPolicy with validation
   */
  public static create(props: PasswordPolicyProps): PasswordPolicy {
    // Validate minLength
    if (props.minLength < 6) {
      throw new Error('Minimum password length must be at least 6 characters');
    }
    if (props.minLength > 128) {
      throw new Error('Minimum password length cannot exceed 128 characters');
    }

    // Validate expirationDays
    if (props.expirationDays !== null) {
      if (props.expirationDays < 1) {
        throw new Error('Password expiration days must be at least 1');
      }
      if (props.expirationDays > 365) {
        throw new Error('Password expiration days cannot exceed 365');
      }
    }

    // Validate preventReuse
    if (props.preventReuse < 0) {
      throw new Error('Prevent reuse count cannot be negative');
    }
    if (props.preventReuse > 24) {
      throw new Error('Prevent reuse count cannot exceed 24');
    }

    return new PasswordPolicy(props);
  }

  /**
   * Create default password policy
   */
  public static createDefault(): PasswordPolicy {
    return new PasswordPolicy({
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      expirationDays: null,
      preventReuse: 3,
      updatedAt: new Date(),
      updatedBy: 'system'
    });
  }

  /**
   * Validate a password against this policy
   */
  public validate(password: string): PasswordValidationResult {
    const errors: string[] = [];

    // Check minimum length
    if (password.length < this._minLength) {
      errors.push(`Mật khẩu phải có ít nhất ${this._minLength} ký tự`);
    }

    // Check uppercase requirement
    if (this._requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Mật khẩu phải chứa ít nhất một chữ cái viết hoa');
    }

    // Check lowercase requirement
    if (this._requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Mật khẩu phải chứa ít nhất một chữ cái viết thường');
    }

    // Check numbers requirement
    if (this._requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Mật khẩu phải chứa ít nhất một chữ số');
    }

    // Check special characters requirement
    if (this._requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('Mật khẩu phải chứa ít nhất một ký tự đặc biệt');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get password strength description
   */
  public getStrengthDescription(): string {
    const requirements: string[] = [];
    
    requirements.push(`Tối thiểu ${this._minLength} ký tự`);
    
    if (this._requireUppercase) requirements.push('chữ hoa');
    if (this._requireLowercase) requirements.push('chữ thường');
    if (this._requireNumbers) requirements.push('số');
    if (this._requireSpecialChars) requirements.push('ký tự đặc biệt');

    return `Mật khẩu phải có ${requirements.join(', ')}`;
  }

  // Getters
  get minLength(): number {
    return this._minLength;
  }

  get requireUppercase(): boolean {
    return this._requireUppercase;
  }

  get requireLowercase(): boolean {
    return this._requireLowercase;
  }

  get requireNumbers(): boolean {
    return this._requireNumbers;
  }

  get requireSpecialChars(): boolean {
    return this._requireSpecialChars;
  }

  get expirationDays(): number | null {
    return this._expirationDays;
  }

  get preventReuse(): number {
    return this._preventReuse;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get updatedBy(): string | null {
    return this._updatedBy;
  }

  /**
   * Convert to plain object
   */
  public toObject(): PasswordPolicyProps {
    return {
      minLength: this._minLength,
      requireUppercase: this._requireUppercase,
      requireLowercase: this._requireLowercase,
      requireNumbers: this._requireNumbers,
      requireSpecialChars: this._requireSpecialChars,
      expirationDays: this._expirationDays,
      preventReuse: this._preventReuse,
      updatedAt: this._updatedAt,
      updatedBy: this._updatedBy || undefined
    };
  }

  /**
   * Check if two policies are equal
   */
  public equals(other: PasswordPolicy): boolean {
    return (
      this._minLength === other._minLength &&
      this._requireUppercase === other._requireUppercase &&
      this._requireLowercase === other._requireLowercase &&
      this._requireNumbers === other._requireNumbers &&
      this._requireSpecialChars === other._requireSpecialChars &&
      this._expirationDays === other._expirationDays &&
      this._preventReuse === other._preventReuse
    );
  }
}

