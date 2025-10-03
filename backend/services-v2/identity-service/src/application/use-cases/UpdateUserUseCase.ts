/**
 * Update User Use Case
 * Updates user information
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IUserRepository } from '../repositories/IUserRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { PersonalInfo } from '../../domain/value-objects/PersonalInfo';
import { CircuitBreakerFactory } from '../../infrastructure/resilience/CircuitBreaker';
import { getErrorMessage } from '../../utils/error-helper';

export interface UpdateUserRequest {
  userId: string;
  requesterId: string; // User making the request
  updates: {
    email?: string;
    fullName?: string;
    phoneNumber?: string;
    citizenId?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    isActive?: boolean;
  };
}

export interface UpdateUserResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
    updatedAt: string;
  };
  message?: string;
  error?: string;
}

/**
 * Update User Use Case
 * Updates user information with validation and audit logging
 */
export class UpdateUserUseCase implements IUseCase<UpdateUserRequest, UpdateUserResponse> {
  private circuitBreaker = CircuitBreakerFactory.getBreaker('update-user-use-case');

  constructor(
    private userRepository: IUserRepository,
    private logger: any
  ) {}

  async execute(request: UpdateUserRequest): Promise<UpdateUserResponse> {
    try {
      return await this.circuitBreaker.execute(async () => {
        return await this.updateUserInternal(request);
      });
    } catch (error) {
      this.logger.error('Update user use case failed', {
        userId: request.userId,
        requesterId: request.requesterId,
        error: getErrorMessage(error)
      });

      return {
        success: false,
        error: 'Failed to update user',
        message: 'Không thể cập nhật thông tin người dùng'
      };
    }
  }

  private async updateUserInternal(request: UpdateUserRequest): Promise<UpdateUserResponse> {
    const { userId, requesterId, updates } = request;

    // Validate input
    if (!userId || !requesterId) {
      return {
        success: false,
        error: 'Missing required fields',
        message: 'Thiếu thông tin bắt buộc'
      };
    }

    if (!updates || Object.keys(updates).length === 0) {
      return {
        success: false,
        error: 'No updates provided',
        message: 'Không có thông tin cần cập nhật'
      };
    }

    try {
      // Get existing user
      const userIdVO = UserId.fromString(userId);
      const user = await this.userRepository.findById(userIdVO);

      if (!user) {
        this.logger.warn('User not found for update', { userId, requesterId });
        return {
          success: false,
          error: 'User not found',
          message: 'Không tìm thấy người dùng'
        };
      }

      // Note: Email updates are not supported in this version
      // Email is immutable after registration for security and audit reasons
      if (updates.email && updates.email !== user.email.value) {
        return {
          success: false,
          error: 'Email cannot be changed',
          message: 'Không thể thay đổi email sau khi đăng ký'
        };
      }

      // Update personal info if provided
      const personalInfoUpdates: any = {};
      let hasPersonalInfoUpdates = false;

      if (updates.fullName !== undefined) {
        personalInfoUpdates.fullName = updates.fullName;
        hasPersonalInfoUpdates = true;
      }
      if (updates.phoneNumber !== undefined) {
        personalInfoUpdates.phoneNumber = updates.phoneNumber;
        hasPersonalInfoUpdates = true;
      }
      if (updates.citizenId !== undefined) {
        personalInfoUpdates.citizenId = updates.citizenId;
        hasPersonalInfoUpdates = true;
      }
      if (updates.dateOfBirth !== undefined) {
        personalInfoUpdates.dateOfBirth = updates.dateOfBirth ? new Date(updates.dateOfBirth) : undefined;
        hasPersonalInfoUpdates = true;
      }
      if (updates.gender !== undefined) {
        personalInfoUpdates.gender = updates.gender;
        hasPersonalInfoUpdates = true;
      }
      if (updates.address !== undefined) {
        personalInfoUpdates.address = updates.address;
        hasPersonalInfoUpdates = true;
      }

      if (hasPersonalInfoUpdates) {
        try {
          // Use PersonalInfo.create instead of fromSupabaseData
          const newPersonalInfo = PersonalInfo.create({
            fullName: personalInfoUpdates.fullName || user.personalInfo.fullName,
            phoneNumber: personalInfoUpdates.phoneNumber !== undefined
              ? personalInfoUpdates.phoneNumber
              : user.personalInfo.phoneNumber,
            citizenId: personalInfoUpdates.citizenId !== undefined
              ? personalInfoUpdates.citizenId
              : user.personalInfo.citizenId,
            dateOfBirth: personalInfoUpdates.dateOfBirth !== undefined
              ? personalInfoUpdates.dateOfBirth
              : user.personalInfo.dateOfBirth,
            gender: personalInfoUpdates.gender !== undefined
              ? personalInfoUpdates.gender
              : user.personalInfo.gender,
            address: personalInfoUpdates.address !== undefined
              ? personalInfoUpdates.address
              : user.personalInfo.address
          });

          user.updatePersonalInfo(newPersonalInfo);
        } catch (error) {
          return {
            success: false,
            error: 'Invalid personal information',
            message: 'Thông tin cá nhân không hợp lệ'
          };
        }
      }

      // Update active status if provided
      if (updates.isActive !== undefined) {
        if (updates.isActive) {
          user.activate();
        } else {
          user.deactivate();
        }
      }

      // Save updated user
      // Repository accepts full User aggregate
      await this.userRepository.update(user);

      // Log update for audit (HIPAA compliance)
      this.logger.info('User information updated', {
        userId,
        requesterId,
        updatedFields: Object.keys(updates),
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email.value,
          fullName: user.personalInfo.fullName,
          phoneNumber: user.personalInfo.phoneNumber,
          updatedAt: user.updatedAt.toISOString()
        },
        message: 'Cập nhật thông tin người dùng thành công'
      };

    } catch (error) {
      this.logger.error('Failed to update user', {
        userId,
        requesterId,
        error: getErrorMessage(error)
      });

      return {
        success: false,
        error: getErrorMessage(error),
        message: 'Lỗi khi cập nhật thông tin người dùng'
      };
    }
  }
}

