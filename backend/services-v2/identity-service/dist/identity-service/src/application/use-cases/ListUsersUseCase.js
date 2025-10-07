"use strict";
/**
 * List Users Use Case
 * Retrieves paginated list of users with filtering
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUsersUseCase = void 0;
const CircuitBreaker_1 = require("../../infrastructure/resilience/CircuitBreaker");
const error_helper_1 = require("../../utils/error-helper");
/**
 * List Users Use Case
 * Retrieves paginated list of users with filtering and search
 */
class ListUsersUseCase {
    constructor(userRepository, logger) {
        this.userRepository = userRepository;
        this.logger = logger;
        this.circuitBreaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker('list-users-use-case');
        this.DEFAULT_PAGE = 1;
        this.DEFAULT_LIMIT = 20;
        this.MAX_LIMIT = 100;
    }
    async execute(request) {
        try {
            return await this.circuitBreaker.execute(async () => {
                return await this.listUsersInternal(request);
            });
        }
        catch (error) {
            this.logger.error('List users use case failed', {
                requesterId: request.requesterId,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            return {
                success: false,
                error: 'Failed to list users',
                message: 'Không thể lấy danh sách người dùng'
            };
        }
    }
    async listUsersInternal(request) {
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
        const limit = Math.min(this.MAX_LIMIT, Math.max(1, request.limit || this.DEFAULT_LIMIT));
        const offset = (page - 1) * limit;
        try {
            // Build filter options with proper structure
            const filters = {};
            if (roleType) {
                filters.role_type = roleType; // Database column name
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
        }
        catch (error) {
            this.logger.error('Failed to list users', {
                requesterId,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            return {
                success: false,
                error: (0, error_helper_1.getErrorMessage)(error),
                message: 'Lỗi khi lấy danh sách người dùng'
            };
        }
    }
}
exports.ListUsersUseCase = ListUsersUseCase;
//# sourceMappingURL=ListUsersUseCase.js.map