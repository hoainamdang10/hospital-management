"use strict";
/**
 * Base Healthcare Use Case
 * Hospital Management System V2
 *
 * Abstract base class for all healthcare use cases
 * Provides common functionality for request validation, error handling, and logging
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseUseCase = exports.BaseHealthcareUseCase = void 0;
/**
 * Base Healthcare Use Case
 * Abstract base class for all healthcare-related use cases
 */
class BaseHealthcareUseCase {
    /**
     * Execute the use case
     * Public method that validates request then calls the protected executeImpl
     */
    async execute(request) {
        // Validate request first
        const validationResult = await this.validateRequest(request);
        if (!validationResult.isValid) {
            const errorMessage = validationResult.errors?.join(', ') || 'Validation failed';
            throw new Error(errorMessage);
        }
        // Execute business logic
        return this.executeImpl(request);
    }
    /**
     * Validate request
     * Override this method to provide custom validation
     */
    async validateRequest(_request) {
        // Default implementation - no validation
        return {
            isValid: true,
            errors: []
        };
    }
    /**
     * Handle error
     * Override this method to provide custom error handling
     */
    handleError(error) {
        throw error;
    }
}
exports.BaseHealthcareUseCase = BaseHealthcareUseCase;
/**
 * Base Use Case (Alias for backward compatibility)
 */
class BaseUseCase extends BaseHealthcareUseCase {
}
exports.BaseUseCase = BaseUseCase;
//# sourceMappingURL=base-healthcare-use-case.js.map