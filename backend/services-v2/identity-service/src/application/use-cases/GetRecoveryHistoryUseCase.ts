/**
 * Get Recovery History Use Case
 * Retrieves account recovery attempt history for a user
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Query Pattern
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IRecoveryHistoryRepository, RecoveryHistoryFilter } from '../../domain/repositories/IRecoveryHistoryRepository';
import { CircuitBreakerFactory } from '../../infrastructure/resilience/CircuitBreaker';

export interface GetRecoveryHistoryRequest {
  userId: string;
  page?: number;
  pageSize?: number;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export interface GetRecoveryHistoryResponse {
  success: boolean;
  history?: Array<{
    id: string;
    recoveryMethod: string;
    recoveryMethodVietnamese: string;
    attemptType: string;
    attemptTypeVietnamese: string;
    success: boolean;
    failureReason: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    attemptedAt: string;
    description: string;
  }>;
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  message?: string;
  error?: string;
}

/**
 * Get Recovery History Use Case
 * Query use case to retrieve user's recovery attempt history
 */
export class GetRecoveryHistoryUseCase
  implements IUseCase<GetRecoveryHistoryRequest, GetRecoveryHistoryResponse>
{
  private circuitBreaker = CircuitBreakerFactory.getBreaker('get-recovery-history-use-case');
  private readonly DEFAULT_PAGE_SIZE = 20;
  private readonly MAX_PAGE_SIZE = 100;
  private readonly DEFAULT_HISTORY_DAYS = 90; // 90-day retention

  constructor(
    private recoveryHistoryRepository: IRecoveryHistoryRepository,
    private logger: any
  ) {}

  async execute(request: GetRecoveryHistoryRequest): Promise<GetRecoveryHistoryResponse> {
    return await this.circuitBreaker.execute(
      async () => this.executeImpl(request),
      async () => {
        this.logger.error('Circuit breaker open for GetRecoveryHistoryUseCase');
        return {
          success: false,
          message: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
          error: 'SERVICE_UNAVAILABLE'
        };
      }
    );
  }

  private async executeImpl(request: GetRecoveryHistoryRequest): Promise<GetRecoveryHistoryResponse> {
    try {
      this.logger.info('Getting recovery history', {
        userId: request.userId,
        page: request.page,
        pageSize: request.pageSize
      });

      // Validate request
      if (!request.userId || request.userId.trim().length === 0) {
        return {
          success: false,
          message: 'User ID không hợp lệ',
          error: 'INVALID_USER_ID'
        };
      }

      // Prepare filter
      const filter: RecoveryHistoryFilter = {
        userId: request.userId,
        page: request.page || 1,
        pageSize: this.validatePageSize(request.pageSize),
        startDate: this.parseStartDate(request.startDate),
        endDate: this.parseEndDate(request.endDate)
      };

      // Get history from repository
      const result = await this.recoveryHistoryRepository.getHistory(filter);

      // Convert to response format
      const history = result.attempts.map((attempt) => {
        const attemptObj = attempt.toObject();
        return {
          id: attemptObj.id!,
          recoveryMethod: attemptObj.recoveryMethod,
          recoveryMethodVietnamese: attempt.getRecoveryMethodVietnamese(),
          attemptType: attemptObj.attemptType,
          attemptTypeVietnamese: attempt.getAttemptTypeVietnamese(),
          success: attemptObj.success,
          failureReason: attemptObj.failureReason,
          ipAddress: attemptObj.ipAddress,
          userAgent: attemptObj.userAgent,
          attemptedAt: attemptObj.attemptedAt,
          description: attempt.getDescription()
        };
      });

      this.logger.info('Recovery history retrieved successfully', {
        userId: request.userId,
        count: history.length,
        totalCount: result.totalCount
      });

      return {
        success: true,
        history,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          totalCount: result.totalCount,
          totalPages: result.totalPages
        }
      };
    } catch (error: any) {
      this.logger.error('Failed to get recovery history', {
        userId: request.userId,
        error: error.message
      });

      return {
        success: false,
        message: `Không thể lấy lịch sử khôi phục: ${error.message}`,
        error: 'GET_RECOVERY_HISTORY_FAILED'
      };
    }
  }

  /**
   * Validate and normalize page size
   */
  private validatePageSize(pageSize?: number): number {
    if (!pageSize || pageSize < 1) {
      return this.DEFAULT_PAGE_SIZE;
    }

    if (pageSize > this.MAX_PAGE_SIZE) {
      return this.MAX_PAGE_SIZE;
    }

    return pageSize;
  }

  /**
   * Parse start date or default to 90 days ago
   */
  private parseStartDate(startDateStr?: string): Date {
    if (startDateStr) {
      try {
        const date = new Date(startDateStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
      } catch (error) {
        this.logger.warn('Invalid start date provided, using default', {
          startDate: startDateStr
        });
      }
    }

    // Default to 90 days ago
    const date = new Date();
    date.setDate(date.getDate() - this.DEFAULT_HISTORY_DAYS);
    return date;
  }

  /**
   * Parse end date or default to now
   */
  private parseEndDate(endDateStr?: string): Date {
    if (endDateStr) {
      try {
        const date = new Date(endDateStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
      } catch (error) {
        this.logger.warn('Invalid end date provided, using default', {
          endDate: endDateStr
        });
      }
    }

    // Default to now
    return new Date();
  }
}

