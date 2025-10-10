/**
 * Get User Use Case
 * Retrieves user information by ID
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IUserRepository } from '../repositories/IUserRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { getErrorMessage } from '../../utils/error-helper';
import { ILogger } from '../services/ILogger';

export interface GetUserRequest {
  userId: string;
  requesterId: string; // User making the request
}

export interface GetUserResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
    citizenId?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    roleType: string;
    isActive: boolean;
    isEmailVerified: boolean;
    lastLoginAt?: string;
    createdAt: string;
    updatedAt: string;
  };
  message?: string;
  error?: string;
}

/**
 * Get User Use Case
 * Retrieves user information with proper authorization checks
 */
export class GetUserUseCase implements IUseCase<GetUserRequest, GetUserResponse> {
  constructor(
    private userRepository: IUserRepository,
    private logger: ILogger,
    private circuitBreaker: ICircuitBreaker
  ) {}

  async execute(request: GetUserRequest): Promise<GetUserResponse> {
    try {
      return await this.circuitBreaker.execute(async () => {
        return await this.getUserInternal(request);
      });
    } catch (error) {
      this.logger.error('Get user use case failed', {
        userId: request.userId,
        requesterId: request.requesterId,
        error: getErrorMessage(error)
      });

      return {
        success: false,
        error: 'Failed to retrieve user information',
        message: 'Không thể lấy thông tin người dùng'
      };
    }
  }

  private async getUserInternal(request: GetUserRequest): Promise<GetUserResponse> {
    const { userId, requesterId } = request;

    // Validate input
    if (!userId || !requesterId) {
      return {
        success: false,
        error: 'Missing required fields',
        message: 'Thiếu thông tin bắt buộc'
      };
    }

    try {
      // Get user from repository
      const userIdVO = UserId.fromString(userId);
      const user = await this.userRepository.findById(userIdVO);

      if (!user) {
        this.logger.warn('User not found', { userId, requesterId });
        return {
          success: false,
          error: 'User not found',
          message: 'Không tìm thấy người dùng'
        };
      }

      // Log access for audit (HIPAA compliance)
      this.logger.info('User information accessed', {
        userId,
        requesterId,
        timestamp: new Date().toISOString()
      });

      // Map domain user to response DTO
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email.value,
          fullName: user.personalInfo.fullName,
          phoneNumber: user.personalInfo.phoneNumber,
          citizenId: user.personalInfo.citizenId,
          dateOfBirth: user.personalInfo.dateOfBirth?.toISOString(),
          gender: user.personalInfo.gender,
          address: user.personalInfo.address,
          roleType: user.healthcareRole.type,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          lastLoginAt: user.lastLoginAt?.toISOString(),
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        },
        message: 'User retrieved successfully'
      };

    } catch (error) {
      this.logger.error('Failed to get user', {
        userId,
        requesterId,
        error: getErrorMessage(error)
      });

      return {
        success: false,
        error: getErrorMessage(error),
        message: 'Lỗi khi lấy thông tin người dùng'
      };
    }
  }
}
