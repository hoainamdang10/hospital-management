/**
 * PasswordHashingService - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Password hashing service with Vietnamese healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Security Standards, Vietnamese Healthcare
 */

import * as bcrypt from 'bcrypt';
import { IPasswordHashingService } from '../../domain/services/IPasswordHashingService';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';

export interface PasswordHashingServiceConfig {
  saltRounds: number;
  logger: ILogger;
}

/**
 * Password Hashing Service
 * Implements secure password hashing using bcrypt
 */
export class PasswordHashingService implements IPasswordHashingService {
  private readonly saltRounds: number;
  private readonly logger: ILogger;

  constructor(config: PasswordHashingServiceConfig) {
    this.saltRounds = config.saltRounds || 12;
    this.logger = config.logger;
  }

  /**
   * Hash password using bcrypt
   */
  async hash(password: string): Promise<string> {
    try {
      this.logger.debug('Hashing password', {
        passwordLength: password.length,
        saltRounds: this.saltRounds
      });

      // Validate password strength
      this.validatePasswordStrength(password);

      // Generate salt and hash
      const salt = await bcrypt.genSalt(this.saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);

      this.logger.debug('Password hashed successfully', {
        hashLength: hashedPassword.length
      });

      return hashedPassword;

    } catch (error) {
      this.logger.error('Error hashing password', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new Error(`Lỗi mã hóa mật khẩu: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify password against hash
   */
  async verify(password: string, hash: string): Promise<boolean> {
    try {
      this.logger.debug('Verifying password', {
        passwordLength: password.length,
        hashLength: hash.length
      });

      const isValid = await bcrypt.compare(password, hash);

      this.logger.debug('Password verification completed', {
        isValid
      });

      return isValid;

    } catch (error) {
      this.logger.error('Error verifying password', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return false instead of throwing to prevent information leakage
      return false;
    }
  }

  /**
   * Check if hash needs rehashing (e.g., salt rounds changed)
   */
  async needsRehash(hash: string): Promise<boolean> {
    try {
      // Extract salt rounds from hash
      const hashSaltRounds = this.extractSaltRounds(hash);
      
      // Needs rehash if salt rounds are different
      return hashSaltRounds !== this.saltRounds;

    } catch (error) {
      this.logger.error('Error checking if hash needs rehash', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return true to be safe - rehash if we can't determine
      return true;
    }
  }

  /**
   * Generate secure random password
   */
  generateSecurePassword(length: number = 16): string {
    try {
      const charset = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
      };

      let password = '';
      
      // Ensure at least one character from each set
      password += this.getRandomChar(charset.uppercase);
      password += this.getRandomChar(charset.lowercase);
      password += this.getRandomChar(charset.numbers);
      password += this.getRandomChar(charset.symbols);

      // Fill remaining length with random characters from all sets
      const allChars = Object.values(charset).join('');
      for (let i = 4; i < length; i++) {
        password += this.getRandomChar(allChars);
      }

      // Shuffle the password
      return password.split('').sort(() => Math.random() - 0.5).join('');

    } catch (error) {
      this.logger.error('Error generating secure password', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new Error('Lỗi tạo mật khẩu bảo mật');
    }
  }

  /**
   * Validate password strength
   */
  private validatePasswordStrength(password: string): void {
    const minLength = 8;
    const maxLength = 128;

    // Length check
    if (password.length < minLength) {
      throw new Error(`Mật khẩu phải có ít nhất ${minLength} ký tự`);
    }

    if (password.length > maxLength) {
      throw new Error(`Mật khẩu không được vượt quá ${maxLength} ký tự`);
    }

    // Character type checks
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

    const missingTypes = [];
    if (!hasUppercase) missingTypes.push('chữ hoa');
    if (!hasLowercase) missingTypes.push('chữ thường');
    if (!hasNumbers) missingTypes.push('số');
    if (!hasSymbols) missingTypes.push('ký tự đặc biệt');

    if (missingTypes.length > 0) {
      throw new Error(`Mật khẩu phải chứa: ${missingTypes.join(', ')}`);
    }

    // Common password patterns
    const commonPatterns = [
      /(.)\1{3,}/, // Repeated characters (4+ times)
      /123456|654321|abcdef|qwerty/i, // Sequential patterns
      /password|admin|user|guest/i, // Common words
      /vietnam|hospital|doctor|nurse/i // Context-specific words
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        throw new Error('Mật khẩu không được chứa các mẫu phổ biến hoặc dễ đoán');
      }
    }
  }

  /**
   * Extract salt rounds from bcrypt hash
   */
  private extractSaltRounds(hash: string): number {
    try {
      // bcrypt hash format: $2a$rounds$salt+hash
      const parts = hash.split('$');
      if (parts.length >= 3) {
        return parseInt(parts[2], 10);
      }
      return 10; // Default bcrypt rounds
    } catch {
      return 10; // Default if parsing fails
    }
  }

  /**
   * Get random character from charset
   */
  private getRandomChar(charset: string): string {
    const randomIndex = Math.floor(Math.random() * charset.length);
    return charset[randomIndex];
  }

  /**
   * Check password against common breached passwords
   */
  async isPasswordBreached(password: string): Promise<boolean> {
    try {
      // In a real implementation, this would check against a database
      // of known breached passwords (like HaveIBeenPwned API)
      
      // For now, check against a small list of very common passwords
      const commonBreachedPasswords = [
        'password', '123456', '123456789', 'qwerty', 'abc123',
        'password123', 'admin', 'letmein', 'welcome', 'monkey',
        '1234567890', 'password1', '123123', 'admin123'
      ];

      const isBreached = commonBreachedPasswords.includes(password.toLowerCase());

      if (isBreached) {
        this.logger.warn('Password found in breach database', {
          passwordLength: password.length
        });
      }

      return isBreached;

    } catch (error) {
      this.logger.error('Error checking password breach status', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return false if we can't check - don't block user
      return false;
    }
  }

  /**
   * Get password strength score (0-100)
   */
  getPasswordStrength(password: string): number {
    let score = 0;

    // Length scoring
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Character type scoring
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score += 15;

    // Complexity scoring
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) score += 10; // High character diversity

    // Pattern penalties
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score -= 10; // Sequential patterns

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get service health status
   */
  getHealthStatus(): any {
    return {
      serviceName: 'PasswordHashingService',
      isHealthy: true,
      saltRounds: this.saltRounds,
      lastCheckedAt: new Date().toISOString()
    };
  }
}
