"use strict";
/**
 * Get Recovery History Use Case
 * Retrieves account recovery attempt history for a user
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS Query Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetRecoveryHistoryUseCase = void 0;
const error_helper_1 = require("../../utils/error-helper");
/**
 * Get Recovery History Use Case
 * Query use case to retrieve user's recovery attempt history
 */
class GetRecoveryHistoryUseCase {
    constructor(recoveryHistoryRepository, logger, circuitBreaker) {
        this.recoveryHistoryRepository = recoveryHistoryRepository;
        this.logger = logger;
        this.circuitBreaker = circuitBreaker;
        this.DEFAULT_PAGE_SIZE = 20;
        this.MAX_PAGE_SIZE = 100;
        this.DEFAULT_HISTORY_DAYS = 90; // 90-day retention
    }
    async execute(request) {
        return await this.circuitBreaker.execute(async () => this.executeImpl(request), async () => {
            this.logger.error('Circuit breaker open for GetRecoveryHistoryUseCase');
            return {
                success: false,
                message: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
                error: 'SERVICE_UNAVAILABLE'
            };
        });
    }
    async executeImpl(request) {
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
            const filter = {
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
                    id: attemptObj.id,
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
        }
        catch (error) {
            const errorMessage = (0, error_helper_1.getErrorMessage)(error);
            this.logger.error('Failed to get recovery history', {
                userId: request.userId,
                error: errorMessage
            });
            return {
                success: false,
                message: `Không thể lấy lịch sử khôi phục: ${errorMessage}`,
                error: 'GET_RECOVERY_HISTORY_FAILED'
            };
        }
    }
    /**
     * Validate and normalize page size
     */
    validatePageSize(pageSize) {
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
    parseStartDate(startDateStr) {
        if (startDateStr) {
            try {
                const date = new Date(startDateStr);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
            catch (error) {
                this.logger.warn('Invalid start date provided, using default', {
                    startDate: startDateStr,
                    error: (0, error_helper_1.getErrorMessage)(error)
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
    parseEndDate(endDateStr) {
        if (endDateStr) {
            try {
                const date = new Date(endDateStr);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
            catch (error) {
                this.logger.warn('Invalid end date provided, using default', {
                    endDate: endDateStr,
                    error: (0, error_helper_1.getErrorMessage)(error)
                });
            }
        }
        // Default to now
        return new Date();
    }
}
exports.GetRecoveryHistoryUseCase = GetRecoveryHistoryUseCase;
//# sourceMappingURL=GetRecoveryHistoryUseCase.js.map