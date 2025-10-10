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
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { getErrorMessage } from '../../utils/error-helper';
import { ILogger } from '../services/ILogger';

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
    roleType: string; // Primary role (backward compatible)
    roles: string[]; // All roles (Pure RBAC)
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
  private readonly DEFAULT_PAGE = 1;
  private readonly DEFAULT_LIMIT = 20;
  private readonly MAX_LIMIT = 100;

  constructor(
    private userRepository: IUserRepository,
    private circuitBreaker: ICircuitBreaker,
    private logger: ILogger
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
      // Build filter options with proper structure
      const filters: Record<string, any> = {};

      if (roleType) {
        // Normalize role to lowercase to match database storage format
        // Database stores: 'admin', 'doctor', 'patient', 'receptionist'
        filters.role_type = roleType.toLowerCase();
      }

      if (isActive !== undefined) {
        filters.is_active = isActive; // Database column name
      }

      // Note: searchTerm requires special handling (LIKE query)
      // For now, we'll pass it as a filter but repository needs to handle it
      if (searchTerm) {
        filters.search_term = searchTerm;
      }

      const filterOptions = {
        limit,
        offset,
        filters // Wrap filters in filters object
      };

      // Get users from repository
      const users = await this.userRepository.list(filterOptions);
      // Fix: Only pass filters to count(), not limit/offset
      const totalCount = await this.userRepository.count(filters);

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
        roleType: (user.healthcareRole.type || '').toLowerCase(), // Primary role (backward compatible)
        roles: user.getRoleTypes().map(r => r.toLowerCase()), // All roles (Pure RBAC)
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
