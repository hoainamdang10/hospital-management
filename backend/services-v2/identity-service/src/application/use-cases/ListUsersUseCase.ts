/**
 * List Users Use Case
 * Retrieves paginated list of users with filtering
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IUserRepository } from '../repositories/IUserRepository';
import { CircuitBreakerFactory } from '../../infrastructure/resilience/CircuitBreaker';
import { getErrorMessage } from '../../utils/error-helper';

export interface ListUsersRequest {
  requesterId: string; // User making the request (must be admin)
  page?: number; // Page number (default: 1)
  limit?: number; // Items per page (default: 20, max: 100)
  roleType?: string; // Filter by role
  isActive?: boolean; // Filter by active status
  searchTerm?: string; // Search by email or name
}

export interface ListUsersResponse {
  success: boolean;
  users?: Array<{
    id: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
    roleType: string;
    isActive: boolean;
    isEmailVerified: boolean;
    lastLoginAt?: string;
    createdAt: string;
  }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
  error?: string;
}

/**
 * List Users Use Case
 * Retrieves paginated list of users with filtering and search
 */
export class ListUsersUseCase implements IUseCase<ListUsersRequest, ListUsersResponse> {
  private circuitBreaker = CircuitBreakerFactory.getBreaker('list-users-use-case');
  private readonly DEFAULT_PAGE = 1;
  private readonly DEFAULT_LIMIT = 20;
  private readonly MAX_LIMIT = 100;

  constructor(
    private userRepository: IUserRepository,
    private logger: any
  ) {}

  async execute(request: ListUsersRequest): Promise<ListUsersResponse> {
    try {
      return await this.circuitBreaker.execute(async () => {
        return await this.listUsersInternal(request);
      });
    } catch (error) {
      this.logger.error('List users use case failed', {
        requesterId: request.requesterId,
        error: getErrorMessage(error)
      });

      return {
        success: false,
        error: 'Failed to list users',
        message: 'Không thể lấy danh sách người dùng'
      };
    }
  }

  private async listUsersInternal(request: ListUsersRequest): Promise<ListUsersResponse> {
    const { requesterId, roleType, isActive, searchTerm } = request;

    // Validate input
    if (!requesterId) {
      return {
        success: false,
        error: 'Missing requester ID',
        message: 'Thiếu thông tin người yêu cầu'
      };
    }

    // Validate and normalize pagination
    const page = Math.max(1, request.page || this.DEFAULT_PAGE);
    const limit = Math.min(
      this.MAX_LIMIT,
      Math.max(1, request.limit || this.DEFAULT_LIMIT)
    );
    const offset = (page - 1) * limit;

    try {
      // Build filter options
      const filterOptions: any = {
        limit,
        offset
      };

      if (roleType) {
        filterOptions.roleType = roleType;
      }

      if (isActive !== undefined) {
        filterOptions.isActive = isActive;
      }

      if (searchTerm) {
        filterOptions.searchTerm = searchTerm;
      }

      // Get users from repository
      const users = await this.userRepository.list(filterOptions);
      const totalCount = await this.userRepository.count(filterOptions);

      // Log access for audit
      this.logger.info('Users list accessed', {
        requesterId,
        page,
        limit,
        filters: { roleType, isActive, searchTerm },
        resultCount: users.length,
        timestamp: new Date().toISOString()
      });

      // Map domain users to response DTOs
      const userDTOs = users.map(user => ({
        id: user.id,
        email: user.email.value,
        fullName: user.personalInfo.fullName,
        phoneNumber: user.personalInfo.phoneNumber,
        roleType: user.healthcareRole.type,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt?.toISOString(),
        createdAt: user.createdAt.toISOString()
      }));

      return {
        success: true,
        users: userDTOs,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        message: `Retrieved ${userDTOs.length} users`
      };

    } catch (error) {
      this.logger.error('Failed to list users', {
        requesterId,
        error: getErrorMessage(error)
      });

      return {
        success: false,
        error: getErrorMessage(error),
        message: 'Lỗi khi lấy danh sách người dùng'
      };
    }
  }
}

