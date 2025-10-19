/**
 * EmailVerificationToken Value Object
 * Encapsulates email verification token with expiration logic
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */

import { ValueObject } from '@shared/domain/base/value-object';
import { Email } from './Email';
import * as jwt from 'jsonwebtoken';

interface EmailVerificationTokenProps {
  token: string;
  email: Email;
  expiresAt: Date;
}

interface TokenPayload {
  email: string;
  userId: string;
  type: 'email_verification';
  exp: number;
}

export class EmailVerificationToken extends ValueObject<EmailVerificationTokenProps> {
  private constructor(props: EmailVerificationTokenProps) {
    super(props);
  }

  /**
   * Validate token format - required by ValueObject base class
   */
  protected validateFormat(): void {
    // Validation is done in create() method before construction
  }

  /**
   * Create EmailVerificationToken from existing token string
   * Used when verifying a token from user
   */
  public static create(token: string, email: Email, expiresAt: Date): EmailVerificationToken {
    try {
      if (!token || token.trim().length === 0) {
        throw new Error('Token không được để trống');
      }

      if (!email) {
        throw new Error('Email không được để trống');
      }

      if (!expiresAt || !(expiresAt instanceof Date)) {
        throw new Error('Thời gian hết hạn không hợp lệ');
      }

      return new EmailVerificationToken({
        token: token.trim(),
        email,
        expiresAt
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create EmailVerificationToken: ${message}`);
    }
  }

  /**
   * Generate new verification token
   * Used when creating a new verification request
   */
  public static generate(
    userId: string,
    email: Email,
    jwtSecret: string,
    expiryHours: number = 24
  ): EmailVerificationToken {
    try {
      if (!userId || userId.trim().length === 0) {
        throw new Error('User ID không được để trống');
      }

      if (!email) {
        throw new Error('Email không được để trống');
      }

      if (!jwtSecret || jwtSecret.trim().length === 0) {
        throw new Error('JWT secret không được để trống');
      }

      if (expiryHours <= 0 || expiryHours > 168) { // Max 7 days
        throw new Error('Thời gian hết hạn phải từ 1-168 giờ');
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiryHours);

      const payload: TokenPayload = {
        email: email.value,
        userId,
        type: 'email_verification',
        exp: Math.floor(expiresAt.getTime() / 1000)
      };

      const token = jwt.sign(payload, jwtSecret);

      return new EmailVerificationToken({
        token,
        email,
        expiresAt
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to generate EmailVerificationToken: ${message}`);
    }
  }

  /**
   * Verify and decode token
   * Returns userId if valid, throws error if invalid
   */
  public static verify(token: string, jwtSecret: string): { userId: string; email: string } {
    try {
      if (!token || token.trim().length === 0) {
        throw new Error('Token không được để trống');
      }

      if (!jwtSecret || jwtSecret.trim().length === 0) {
        throw new Error('JWT secret không được để trống');
      }

      const decoded = jwt.verify(token, jwtSecret) as TokenPayload;

      if (decoded.type !== 'email_verification') {
        throw new Error('Token không hợp lệ (sai loại token)');
      }

      return {
        userId: decoded.userId,
        email: decoded.email
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực.');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token không hợp lệ');
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Token verification failed: ${message}`);
    }
  }

  /**
   * Check if token is expired
   */
  public isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  /**
   * Get token string
   */
  public get token(): string {
    return this.props.token;
  }

  /**
   * Get email
   */
  public get email(): Email {
    return this.props.email;
  }

  /**
   * Get expiration date
   */
  public get expiresAt(): Date {
    return this.props.expiresAt;
  }

  /**
   * Get remaining time in hours
   */
  public getRemainingHours(): number {
    const now = new Date();
    const diff = this.props.expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
  }

  /**
   * Get remaining time in minutes
   */
  public getRemainingMinutes(): number {
    const now = new Date();
    const diff = this.props.expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60)));
  }

  /**
   * Equality comparison
   */
  public equals(other: EmailVerificationToken): boolean {
    if (!other) {
      return false;
    }
    return this.props.token === other.props.token;
  }
}

