/**
 * ActivateUserUseCase
 * Use case for activating a user account
 * 
 * Used when:
 * - Staff is registered and credentials are verified
 * - Account needs to be reactivated after suspension
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */

import { IUserRepository } from '../repositories/IUserRepository';
import { ILogger } from '../services/ILogger';
import { UserId } from '../../domain/value-objects/UserId';

export interface ActivateUserRequest {
  userId: string;
  activatedBy: string;
  reason?: string;
}

export interface ActivateUserResponse {
  success: boolean;
  message: string;
  userId: string;
}

export class ActivateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  async execute(request: ActivateUserRequest): Promise<ActivateUserResponse> {
    try {
      // Validate input
      if (!request.userId) {
        throw new Error('User ID is required');
      }

      if (!request.activatedBy) {
        throw new Error('Activated by is required');
      }

      // Get user
      const userId = UserId.fromString(request.userId);
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error(`User not found: ${request.userId}`);
      }

      // Check if permanently deactivated
      if (user.accountStatus === 'deactivated') {
        throw new Error('Cannot activate permanently deactivated account');
      }

      // Check if already active
      if (user.accountStatus === 'active') {
        this.logger.info('User account is already active', {
          userId: request.userId
        });
        return {
          success: true,
          message: 'User account is already active',
          userId: request.userId
        };
      }

      // Activate user
      user.activate(request.activatedBy, request.reason);

      // Save to repository (will publish domain events)
      await this.userRepository.save(user);

      this.logger.info('User account activated successfully', {
        userId: request.userId,
        activatedBy: request.activatedBy,
        reason: request.reason
      });

      return {
        success: true,
        message: 'User account activated successfully',
        userId: request.userId
      };

    } catch (error: any) {
      this.logger.error('Error activating user account', {
        userId: request.userId,
        error: error.message
      });
      throw new Error(`Failed to activate user account: ${error.message}`);
    }
  }
}
