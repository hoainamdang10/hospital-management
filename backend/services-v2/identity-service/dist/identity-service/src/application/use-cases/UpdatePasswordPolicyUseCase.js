"use strict";
/**
 * Update Password Policy Use Case
 * Updates the system password policy (Admin only)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePasswordPolicyUseCase = void 0;
const PasswordPolicy_1 = require("../../domain/value-objects/PasswordPolicy");
const error_utils_1 = require("../utils/error-utils");
class UpdatePasswordPolicyUseCase {
    constructor(policyRepository, logger) {
        this.policyRepository = policyRepository;
        this.logger = logger;
    }
    async execute(request) {
        try {
            // Validate request
            if (!request.updatedBy) {
                throw new Error('Updated by user ID is required');
            }
            this.logger.info(`Updating password policy by user ${request.updatedBy}`);
            // Create new policy with validation
            const newPolicy = PasswordPolicy_1.PasswordPolicy.create({
                minLength: request.minLength,
                requireUppercase: request.requireUppercase,
                requireLowercase: request.requireLowercase,
                requireNumbers: request.requireNumbers,
                requireSpecialChars: request.requireSpecialChars,
                expirationDays: request.expirationDays,
                preventReuse: request.preventReuse
            });
            // Update in repository
            const updatedPolicy = await this.policyRepository.update(newPolicy, request.updatedBy);
            this.logger.info('Password policy updated successfully');
            return {
                success: true,
                policy: updatedPolicy.toObject(),
                message: 'Chính sách mật khẩu đã được cập nhật thành công'
            };
        }
        catch (error) {
            this.logger.error('Error updating password policy:', error instanceof Error ? error : new Error(String(error)));
            throw new Error(`Failed to update password policy: ${(0, error_utils_1.getErrorMessage)(error)}`);
        }
    }
}
exports.UpdatePasswordPolicyUseCase = UpdatePasswordPolicyUseCase;
//# sourceMappingURL=UpdatePasswordPolicyUseCase.js.map