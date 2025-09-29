/**
 * IdentityQueryHandlers - CQRS Query Handlers
 * V2 Clean Architecture + DDD Implementation
 * Handles identity and access management queries
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards
 */

import { GetUserProfileUseCase, GetUserProfileRequest, GetUserProfileResponse } from '../use-cases/GetUserProfileUseCase';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { UserId } from '../../domain/value-objects/UserId';
import { Email } from '../../domain/value-objects/Email';

// Query interfaces
export interface GetUserProfileQuery extends GetUserProfileRequest {
  queryId: string;
  timestamp: Date;
  userId?: string;
}

export interface GetUserListQuery {
  queryId: string;
  timestamp: Date;
  userId?: string;
  filters?: {
    role?: string;
    department?: string;
    isActive?: boolean;
    isEmailVerified?: boolean;
  };
  pagination?: {
    page: number;
    pageSize: number;
  };
  sorting?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export interface GetUserByEmailQuery {
  queryId: string;
  timestamp: Date;
  userId?: string;
  email: string;
  includePermissions?: boolean;
}

export interface GetUserSessionsQuery {
  queryId: string;
  timestamp: Date;
  userId: string;
  targetUserId: string;
  includeInactive?: boolean;
}

/**
 * Identity Query Handlers
 * Handles all identity-related queries following CQRS pattern
 */
export class IdentityQueryHandlers {
  constructor(
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  /**
   * Handle GetUserProfile query
   */
  async handleGetUserProfile(query: GetUserProfileQuery): Promise<GetUserProfileResponse> {
    try {
      this.logger.info('Handling GetUserProfile query', {
        queryId: query.queryId,
        userId: query.userId,
        requestedBy: query.requestedBy
      });

      const request: GetUserProfileRequest = {
        userId: query.userId,
        requestedBy: query.requestedBy,
        includePermissions: query.includePermissions,
        includeSessions: query.includeSessions,
        includeAuditInfo: query.includeAuditInfo
      };

      const result = await this.getUserProfileUseCase.execute(request, query.userId);

      this.logger.info('GetUserProfile query handled successfully', {
        queryId: query.queryId,
        success: result.success,
        userId: query.userId
      });

      return result;

    } catch (error) {
      this.logger.error('Error handling GetUserProfile query', {
        queryId: query.queryId,
        userId: query.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: `Lỗi xử lý truy vấn thông tin người dùng: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: {
          code: 'GET_USER_PROFILE_QUERY_FAILED',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Handle GetUserList query
   */
  async handleGetUserList(query: GetUserListQuery): Promise<any> {
    try {
      this.logger.info('Handling GetUserList query', {
        queryId: query.queryId,
        userId: query.userId,
        filters: query.filters,
        pagination: query.pagination
      });

      // Check authorization
      const requestingUser = await this.userRepository.findById(UserId.fromString(query.userId || ''));
      if (!requestingUser || !requestingUser.canManageUsers()) {
        return {
          success: false,
          message: 'Không có quyền truy cập danh sách người dùng',
          error: {
            code: 'UNAUTHORIZED'
          }
        };
      }

      // Apply filters and pagination
      const page = query.pagination?.page || 1;
      const pageSize = Math.min(query.pagination?.pageSize || 20, 100); // Max 100 items per page
      const offset = (page - 1) * pageSize;

      // Get users with filters
      const users = await this.userRepository.findWithFilters({
        role: query.filters?.role,
        department: query.filters?.department,
        isActive: query.filters?.isActive,
        isEmailVerified: query.filters?.isEmailVerified,
        limit: pageSize,
        offset: offset,
        sortBy: query.sorting?.field || 'createdAt',
        sortDirection: query.sorting?.direction || 'desc'
      });

      // Get total count for pagination
      const totalCount = await this.userRepository.countWithFilters({
        role: query.filters?.role,
        department: query.filters?.department,
        isActive: query.filters?.isActive,
        isEmailVerified: query.filters?.isEmailVerified
      });

      // Transform users to response format
      const userList = users.map(user => ({
        id: user.id.value,
        email: user.email.value,
        personalInfo: {
          firstName: user.personalInfo.firstName,
          lastName: user.personalInfo.lastName,
          fullName: user.personalInfo.fullName
        },
        healthcareRole: {
          name: user.healthcareRole.name,
          department: user.healthcareRole.department
        },
        status: {
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified
        },
        timestamps: {
          createdAt: user.props.createdAt.toISOString(),
          lastLoginAt: user.lastLoginAt?.toISOString()
        }
      }));

      this.logger.info('GetUserList query handled successfully', {
        queryId: query.queryId,
        totalCount,
        returnedCount: userList.length,
        page,
        pageSize
      });

      return {
        success: true,
        message: 'Danh sách người dùng được tải thành công',
        data: {
          users: userList,
          pagination: {
            page,
            pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            hasNextPage: page * pageSize < totalCount,
            hasPreviousPage: page > 1
          }
        }
      };

    } catch (error) {
      this.logger.error('Error handling GetUserList query', {
        queryId: query.queryId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: `Lỗi xử lý truy vấn danh sách người dùng: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: {
          code: 'GET_USER_LIST_QUERY_FAILED',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Handle GetUserByEmail query
   */
  async handleGetUserByEmail(query: GetUserByEmailQuery): Promise<any> {
    try {
      this.logger.info('Handling GetUserByEmail query', {
        queryId: query.queryId,
        email: query.email,
        userId: query.userId
      });

      // Check authorization
      const requestingUser = await this.userRepository.findById(UserId.fromString(query.userId || ''));
      if (!requestingUser || !requestingUser.canManageUsers()) {
        return {
          success: false,
          message: 'Không có quyền truy cập thông tin người dùng',
          error: {
            code: 'UNAUTHORIZED'
          }
        };
      }

      // Find user by email
      const email = Email.fromString(query.email);
      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        return {
          success: false,
          message: 'Không tìm thấy người dùng với email này',
          error: {
            code: 'USER_NOT_FOUND'
          }
        };
      }

      // Build response
      const userData = {
        id: user.id.value,
        email: user.email.value,
        personalInfo: {
          firstName: user.personalInfo.firstName,
          lastName: user.personalInfo.lastName,
          fullName: user.personalInfo.fullName,
          phoneNumber: user.personalInfo.phoneNumber
        },
        healthcareRole: {
          name: user.healthcareRole.name,
          department: user.healthcareRole.department,
          ...(query.includePermissions && { permissions: user.healthcareRole.permissions })
        },
        status: {
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          isVietnameseHealthcareCompliant: user.isVietnameseHealthcareCompliant(),
          isHIPAACompliant: user.isHIPAACompliant()
        },
        timestamps: {
          createdAt: user.props.createdAt.toISOString(),
          updatedAt: user.props.updatedAt.toISOString(),
          lastLoginAt: user.lastLoginAt?.toISOString()
        }
      };

      this.logger.info('GetUserByEmail query handled successfully', {
        queryId: query.queryId,
        email: query.email,
        userId: user.id.value
      });

      return {
        success: true,
        message: 'Thông tin người dùng được tải thành công',
        data: {
          user: userData
        }
      };

    } catch (error) {
      this.logger.error('Error handling GetUserByEmail query', {
        queryId: query.queryId,
        email: query.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: `Lỗi xử lý truy vấn người dùng theo email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: {
          code: 'GET_USER_BY_EMAIL_QUERY_FAILED',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Handle GetUserSessions query
   */
  async handleGetUserSessions(query: GetUserSessionsQuery): Promise<any> {
    try {
      this.logger.info('Handling GetUserSessions query', {
        queryId: query.queryId,
        userId: query.userId,
        targetUserId: query.targetUserId
      });

      // Check authorization - users can view their own sessions, admins can view any
      if (query.userId !== query.targetUserId) {
        const requestingUser = await this.userRepository.findById(UserId.fromString(query.userId));
        if (!requestingUser || !requestingUser.canManageUsers()) {
          return {
            success: false,
            message: 'Không có quyền truy cập phiên đăng nhập',
            error: {
              code: 'UNAUTHORIZED'
            }
          };
        }
      }

      // Get user sessions
      const userId = UserId.fromString(query.targetUserId);
      const sessions = await this.userRepository.getUserSessions(userId, query.includeInactive);

      const sessionList = sessions.map(session => ({
        id: session.id,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: session.createdAt.toISOString(),
        lastAccessedAt: session.lastAccessedAt.toISOString(),
        isActive: session.isActive,
        expiresAt: session.expiresAt?.toISOString()
      }));

      this.logger.info('GetUserSessions query handled successfully', {
        queryId: query.queryId,
        targetUserId: query.targetUserId,
        sessionCount: sessionList.length
      });

      return {
        success: true,
        message: 'Danh sách phiên đăng nhập được tải thành công',
        data: {
          sessions: sessionList,
          totalCount: sessionList.length,
          activeCount: sessionList.filter(s => s.isActive).length
        }
      };

    } catch (error) {
      this.logger.error('Error handling GetUserSessions query', {
        queryId: query.queryId,
        targetUserId: query.targetUserId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: `Lỗi xử lý truy vấn phiên đăng nhập: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: {
          code: 'GET_USER_SESSIONS_QUERY_FAILED',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Get handler status
   */
  getStatus(): any {
    return {
      handlerName: 'IdentityQueryHandlers',
      supportedQueries: [
        'GetUserProfile',
        'GetUserList',
        'GetUserByEmail',
        'GetUserSessions'
      ],
      isHealthy: true,
      lastProcessedAt: new Date().toISOString()
    };
  }
}
