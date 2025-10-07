/**
 * Validate Password Use Case
 * Validates a password against the current policy
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IPasswordPolicyRepository } from '../../domain/repositories/IPasswordPolicyRepository';

export interface ValidatePasswordRequest {
  password: string;
}

export interface ValidatePasswordResponse {
  isValid: boolean;
  errors: string[];
  strength?: 'weak' | 'medium' | 'strong';
}

export class ValidatePasswordUseCase {
  constructor(
    private readonly policyRepository: IPasswordPolicyRepository,
    private readonly logger: any
  ) {}

  async execute(request: ValidatePasswordRequest): Promise<ValidatePasswordResponse> {
    try {
      // Validate input
      if (!request.password) {
        return {
          isValid: false,
          errors: ['Mật khẩu không được để trống']
        };
      }

      // Get current policy
      const policy = await this.policyRepository.getCurrent();

      // Validate password against policy
      const validationResult = policy.validate(request.password);

      // Calculate password strength
      const strength = this.calculateStrength(request.password);

      return {
        isValid: validationResult.isValid,
        errors: validationResult.errors,
        strength
      };
    } catch (error: any) {
      this.logger.error('Error validating password:', error);
      throw new Error(`Failed to validate password: ${error.message}`);
    }
  }

  /**
   * Calculate password strength based on various factors
   */
  private calculateStrength(password: string): 'weak' | 'medium' | 'strong' {
    let score = 0;

    // Length score
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;

    // Character variety score
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

    // Pattern detection (reduce score for common patterns)
    if (/(.)\1{2,}/.test(password)) score--; // Repeated characters
    if (/^[0-9]+$/.test(password)) score--; // Only numbers
    if (/^[a-zA-Z]+$/.test(password)) score--; // Only letters

    // Determine strength
    if (score <= 3) return 'weak';
    if (score <= 5) return 'medium';
    return 'strong';
  }
}

