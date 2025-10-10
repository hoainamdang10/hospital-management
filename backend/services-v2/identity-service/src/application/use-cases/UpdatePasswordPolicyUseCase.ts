/**
 * Update Password Policy Use Case
 * Updates the system password policy (Admin only)
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IPasswordPolicyRepository } from '../../domain/repositories/IPasswordPolicyRepository';
import { PasswordPolicy, PasswordPolicyProps } from '../../domain/value-objects/PasswordPolicy';
import { ILogger } from '../services/ILogger';
import { getErrorMessage } from '../utils/error-utils';

export interface UpdatePasswordPolicyRequest {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expirationDays: number | null;
  preventReuse: number;
  updatedBy: string; // User ID of admin making the change
}

export interface UpdatePasswordPolicyResponse {
  success: boolean;
  policy: PasswordPolicyProps;
  message: string;
}

export class UpdatePasswordPolicyUseCase {
  constructor(
    private readonly policyRepository: IPasswordPolicyRepository,
    private readonly logger: ILogger
  ) {}

  async execute(request: UpdatePasswordPolicyRequest): Promise<UpdatePasswordPolicyResponse> {
    try {
      // Validate request
      if (!request.updatedBy) {
        throw new Error('Updated by user ID is required');
      }

      this.logger.info(`Updating password policy by user ${request.updatedBy}`);

      // Create new policy with validation
      const newPolicy = PasswordPolicy.create({
        minLength: request.minLength,
        requireUppercase: request.requireUppercase,
        requireLowercase: request.requireLowercase,
        requireNumbers: request.requireNumbers,
        requireSpecialChars: request.requireSpecialChars,
        expirationDays: request.expirationDays,
        preventReuse: request.preventReuse
      });

      // Update in repository
      const updatedPolicy = await this.policyRepository.update(newPolicy, request.updatedBy);

      this.logger.info('Password policy updated successfully');

      return {
        success: true,
        policy: updatedPolicy.toObject(),
        message: 'Chính sách mật khẩu đã được cập nhật thành công'
      };
    } catch (error: unknown) {
      this.logger.error('Error updating password policy:', error instanceof Error ? error : new Error(String(error)));
      throw new Error(`Failed to update password policy: ${getErrorMessage(error)}`);
    }
  }
}

