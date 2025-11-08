/**
 * GetProviderStatisticsUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Retrieves provider statistics with authorization
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/base/base-healthcare-use-case';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { ILogger } from '../interfaces/ILogger';

export interface GetProviderStatisticsRequest {
  requestedBy: string;
  requestedByRole: string;
  departmentId?: string; // Filter by department
  staffType?: string; // Filter by staff type
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface GetProviderStatisticsResponse {
  success: boolean;
  message: string;
  errors?: string[];
  data?: {
    statistics: {
      totalProviders: number;
      activeProviders: number;
      inactiveProviders: number;
      suspendedProviders: number;
      byType: {
        doctors: number;
        nurses: number;
        technicians: number;
        pharmacists: number;
        admins: number;
        others: number;
      };
      byDepartment: Array<{
        departmentId: string;
        departmentName: string;
        count: number;
      }>;
      byStatus: {
        active: number;
        onLeave: number;
        suspended: number;
        terminated: number;
      };
      credentials: {
        totalCredentials: number;
        validCredentials: number;
        expiringCredentials: number; // Expiring within 30 days
        expiredCredentials: number;
      };
      generatedAt: string;
    };
  };
}

/**
 * Get Provider Statistics Use Case
 */
export class GetProviderStatisticsUseCase extends BaseHealthcareUseCase<GetProviderStatisticsRequest, GetProviderStatisticsResponse> {
  constructor(
    private readonly staffRepository: IProviderStaffRepository,
    private readonly logger: ILogger
  ) {
    super();
  }

  /**
   * Execute get provider statistics
   */
  protected async executeImpl(request: GetProviderStatisticsRequest): Promise<GetProviderStatisticsResponse> {
    try {
      this.logger.info('Getting provider statistics', {
        requestedBy: request.requestedBy,
        requestedByRole: request.requestedByRole,
        departmentId: request.departmentId
      });

      // 1. Validate request
      const validationResult = await this.validateRequest(request);
      if (!validationResult.isValid) {
        return {
          success: false,
          message: 'Yêu cầu không hợp lệ',
          errors: validationResult.errors
        };
      }

      // 2. Check authorization
      if (!this.isAuthorized(request.requestedByRole)) {
        this.logger.warn('Unauthorized statistics access attempt', {
          requestedBy: request.requestedBy,
          requestedByRole: request.requestedByRole
        });

        return {
          success: false,
          message: 'Không có quyền truy cập thống kê'
        };
      }

      // 3. Get statistics from repository
      const repoStats = await this.staffRepository.getStatistics();

      // Map repository stats to response format
      const statistics = {
        totalProviders: repoStats.total,
        activeProviders: repoStats.active,
        inactiveProviders: repoStats.inactive,
        suspendedProviders: 0, // TODO: Add suspended count to repository
        byType: {
          doctors: repoStats.byType?.doctor || 0,
          nurses: repoStats.byType?.nurse || 0,
          technicians: repoStats.byType?.technician || 0,
          pharmacists: repoStats.byType?.pharmacist || 0,
          admins: repoStats.byType?.admin || 0,
          others: 0
        },
        byDepartment: [], // TODO: Add department stats to repository
        byStatus: {
          active: repoStats.byStatus?.active || 0,
          onLeave: repoStats.byStatus?.on_leave || 0,
          suspended: repoStats.byStatus?.suspended || 0,
          terminated: repoStats.byStatus?.terminated || 0
        },
        credentials: {
          totalCredentials: 0, // TODO: Add credential stats to repository
          validCredentials: 0,
          expiringCredentials: 0,
          expiredCredentials: 0
        },
        generatedAt: new Date().toISOString()
      };

      this.logger.info('Provider statistics retrieved successfully', {
        requestedBy: request.requestedBy,
        totalProviders: statistics.totalProviders
      });

      return {
        success: true,
        message: 'Lấy thống kê nhà cung cấp thành công',
        data: {
          statistics
        }
      };

    } catch (error) {
      this.logger.error('Error getting provider statistics', {
        requestedBy: request.requestedBy,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi hệ thống khi lấy thống kê'
      };
    }
  }

  /**
   * Validate request
   */
  protected override async validateRequest(request: GetProviderStatisticsRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!request.requestedBy || request.requestedBy.trim().length === 0) {
      errors.push('Thông tin người yêu cầu không được để trống');
    }

    if (!request.requestedByRole || request.requestedByRole.trim().length === 0) {
      errors.push('Vai trò người yêu cầu không được để trống');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if user is authorized to view statistics
   */
  private isAuthorized(role: string): boolean {
    const authorizedRoles = ['admin', 'super_admin', 'department_head'];
    return authorizedRoles.includes(role.toLowerCase());
  }
}

