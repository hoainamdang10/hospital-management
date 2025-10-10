"use strict";
/**
 * Validate Password Use Case
 * Validates a password against the current policy
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidatePasswordUseCase = void 0;
const error_utils_1 = require("../utils/error-utils");
class ValidatePasswordUseCase {
    constructor(policyRepository, logger) {
        this.policyRepository = policyRepository;
        this.logger = logger;
    }
    async execute(request) {
        try {
            // Validate input
            if (!request.password) {
                return {
                    isValid: false,
                    errors: ['Mật khẩu không được để trống']
                };
            }
            // Get current policy
            const policy = await this.policyRepository.getCurrent();
            // Validate password against policy
            const validationResult = policy.validate(request.password);
            // Calculate password strength
            const strength = this.calculateStrength(request.password);
            return {
                isValid: validationResult.isValid,
                errors: validationResult.errors,
                strength
            };
        }
        catch (error) {
            this.logger.error('Error validating password:', error instanceof Error ? error : new Error(String(error)));
            throw new Error(`Failed to validate password: ${(0, error_utils_1.getErrorMessage)(error)}`);
        }
    }
    /**
     * Calculate password strength based on various factors
     */
    calculateStrength(password) {
        let score = 0;
        // Length score
        if (password.length >= 8)
            score++;
        if (password.length >= 12)
            score++;
        if (password.length >= 16)
            score++;
        // Character variety score
        if (/[a-z]/.test(password))
            score++;
        if (/[A-Z]/.test(password))
            score++;
        if (/[0-9]/.test(password))
            score++;
        if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password))
            score++;
        // Pattern detection (reduce score for common patterns)
        if (/(.)\1{2,}/.test(password))
            score--; // Repeated characters
        if (/^[0-9]+$/.test(password))
            score--; // Only numbers
        if (/^[a-zA-Z]+$/.test(password))
            score--; // Only letters
        // Determine strength
        if (score <= 3)
            return 'weak';
        if (score <= 5)
            return 'medium';
        return 'strong';
    }
}
exports.ValidatePasswordUseCase = ValidatePasswordUseCase;
//# sourceMappingURL=ValidatePasswordUseCase.js.map