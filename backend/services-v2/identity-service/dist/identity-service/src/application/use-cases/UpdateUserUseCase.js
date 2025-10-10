"use strict";
/**
 * Update User Use Case
 * Updates user information
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserUseCase = void 0;
const UserId_1 = require("../../domain/value-objects/UserId");
const PersonalInfo_1 = require("../../domain/value-objects/PersonalInfo");
const error_helper_1 = require("../../utils/error-helper");
/**
 * Update User Use Case
 * Updates user information with validation and audit logging
 */
class UpdateUserUseCase {
    constructor(userRepository, logger, circuitBreaker) {
        this.userRepository = userRepository;
        this.logger = logger;
        this.circuitBreaker = circuitBreaker;
    }
    async execute(request) {
        try {
            return await this.circuitBreaker.execute(async () => {
                return await this.updateUserInternal(request);
            });
        }
        catch (error) {
            this.logger.error('Update user use case failed', {
                userId: request.userId,
                requesterId: request.requesterId,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            return {
                success: false,
                error: 'Failed to update user',
                message: 'Không thể cập nhật thông tin người dùng'
            };
        }
    }
    async updateUserInternal(request) {
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
            const userIdVO = UserId_1.UserId.fromString(userId);
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
            const personalInfoUpdates = {};
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
                    const newPersonalInfo = PersonalInfo_1.PersonalInfo.create({
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
                }
                catch (error) {
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
                }
                else {
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
        }
        catch (error) {
            this.logger.error('Failed to update user', {
                userId,
                requesterId,
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            return {
                success: false,
                error: (0, error_helper_1.getErrorMessage)(error),
                message: 'Lỗi khi cập nhật thông tin người dùng'
            };
        }
    }
}
exports.UpdateUserUseCase = UpdateUserUseCase;
//# sourceMappingURL=UpdateUserUseCase.js.map