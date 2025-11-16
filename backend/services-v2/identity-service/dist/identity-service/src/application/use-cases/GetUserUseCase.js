"use strict";
/**
 * Get User Use Case
 * Retrieves user information by ID
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUserUseCase = void 0;
const UserId_1 = require("../../domain/value-objects/UserId");
const error_helper_1 = require("../../utils/error-helper");
/**
 * Get User Use Case
 * Retrieves user information with proper authorization checks
 */
class GetUserUseCase {
    constructor(userRepository, logger, circuitBreaker) {
        this.userRepository = userRepository;
        this.logger = logger;
        this.circuitBreaker = circuitBreaker;
    }
    async execute(request) {
        try {
            return await this.circuitBreaker.execute(async () => {
                return await this.getUserInternal(request);
            });
        }
        catch (error) {
            this.logger.error('Get user use case failed', {
                userId: request.userId,
                requesterId: request.requesterId,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            return {
                success: false,
                error: 'Failed to retrieve user information',
                message: 'Không thể lấy thông tin người dùng'
            };
        }
    }
    async getUserInternal(request) {
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
            const userIdVO = UserId_1.UserId.fromString(userId);
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
                    accountStatus: user.accountStatus,
                    deactivationReason: user.deactivationReason,
                    deactivatedAt: user.deactivatedAt?.toISOString(),
                    deactivatedBy: user.deactivatedBy,
                    lastLoginAt: user.lastLoginAt?.toISOString(),
                    createdAt: user.createdAt.toISOString(),
                    updatedAt: user.updatedAt.toISOString()
                },
                message: 'User retrieved successfully'
            };
        }
        catch (error) {
            this.logger.error('Failed to get user', {
                userId,
                requesterId,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            return {
                success: false,
                error: (0, error_helper_1.getErrorMessage)(error),
                message: 'Lỗi khi lấy thông tin người dùng'
            };
        }
    }
}
exports.GetUserUseCase = GetUserUseCase;
//# sourceMappingURL=GetUserUseCase.js.map