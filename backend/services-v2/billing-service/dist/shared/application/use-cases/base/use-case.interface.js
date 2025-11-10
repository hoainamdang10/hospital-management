"use strict";
/**
 * Use Case Interfaces - Clean Architecture
 * Enhanced base interfaces for application layer use cases
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, SOLID Principles, Healthcare Compliance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UseCaseRegistry = exports.UseCaseExecutionError = exports.UseCaseAuthorizationError = exports.UseCaseValidationError = exports.BaseHealthcareUseCase = exports.BaseUseCase = void 0;
exports.WithMetrics = WithMetrics;
/**
 * Base abstract use case with common functionality
 */
class BaseUseCase {
    /**
     * Execute the use case
     */
    async execute(request, context) {
        this.context = context;
        try {
            // Validate request
            const validationResult = await this.validate(request);
            if (!validationResult.isValid) {
                throw new UseCaseValidationError('Use case validation failed', validationResult.errors);
            }
            // Execute business logic
            return await this.executeInternal(request);
        }
        catch (error) {
            await this.handleError(error, request);
            throw error;
        }
    }
    /**
     * Validate the request
     */
    async validate(_request) {
        // Default implementation - override in subclasses
        return { isValid: true, errors: [] };
    }
    /**
     * Handle errors during execution
     */
    async handleError(error, _request) {
        // Log error, send notifications, etc.
        console.error('Use case execution error:', error);
    }
    /**
     * Get current execution context
     */
    getContext() {
        if (!this.context) {
            throw new Error('Use case context not available');
        }
        return this.context;
    }
}
exports.BaseUseCase = BaseUseCase;
/**
 * Base healthcare use case with HIPAA compliance
 */
class BaseHealthcareUseCase extends BaseUseCase {
    /**
     * Execute with HIPAA compliance
     */
    async execute(request, context) {
        if (!context?.userId) {
            throw new UseCaseAuthorizationError('User context required for healthcare operations');
        }
        // Set context before any operations that need it
        this.context = context;
        // Check authorization
        const authorized = await this.authorize(request, context.userId);
        if (!authorized) {
            throw new UseCaseAuthorizationError();
        }
        // Log HIPAA audit if involves PHI
        if (this.involvesPHI(request)) {
            await this.logHIPAAAudit(request, context);
        }
        // Execute base logic
        return await super.execute(request, context);
    }
    /**
     * Get audit information
     */
    getAuditInfo(request) {
        const context = this.getContext();
        const patientId = this.getPatientId(request);
        return {
            action: this.constructor.name,
            patientId: patientId !== null ? patientId : undefined,
            userId: context.userId,
            timestamp: context.timestamp,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            details: { correlationId: context.correlationId }
        };
    }
    /**
     * Log HIPAA audit
     */
    async logHIPAAAudit(request, _context) {
        const auditInfo = this.getAuditInfo(request);
        // Implementation would log to HIPAA audit system
        console.log('HIPAA Audit:', auditInfo);
    }
}
exports.BaseHealthcareUseCase = BaseHealthcareUseCase;
/**
 * Use case validation error
 */
class UseCaseValidationError extends Error {
    constructor(message, errors) {
        super(message);
        this.name = 'UseCaseValidationError';
        this.errors = errors;
    }
}
exports.UseCaseValidationError = UseCaseValidationError;
/**
 * Use case authorization error
 */
class UseCaseAuthorizationError extends Error {
    constructor(message = 'Unauthorized to execute this use case') {
        super(message);
        this.name = 'UseCaseAuthorizationError';
    }
}
exports.UseCaseAuthorizationError = UseCaseAuthorizationError;
/**
 * Use case execution error
 */
class UseCaseExecutionError extends Error {
    constructor(message, innerError) {
        super(message);
        this.name = 'UseCaseExecutionError';
        this.innerError = innerError;
    }
}
exports.UseCaseExecutionError = UseCaseExecutionError;
/**
 * Simple use case registry implementation
 */
class UseCaseRegistry {
    constructor() {
        this.useCases = new Map();
    }
    register(name, useCase) {
        this.useCases.set(name, useCase);
    }
    get(name) {
        const useCase = this.useCases.get(name);
        if (!useCase) {
            throw new Error(`Use case not found: ${name}`);
        }
        return useCase;
    }
    has(name) {
        return this.useCases.has(name);
    }
}
exports.UseCaseRegistry = UseCaseRegistry;
/**
 * Use case decorator for metrics collection
 * Note: This is a simplified version to avoid TypeScript generic constraint issues
 */
function WithMetrics(metrics) {
    return function (target) {
        const originalExecute = target.prototype.execute;
        target.prototype.execute = async function (request) {
            const startTime = Date.now();
            const useCaseName = this.constructor.name;
            try {
                const result = await originalExecute.call(this, request);
                const duration = Date.now() - startTime;
                metrics.recordExecution(useCaseName, duration, true);
                return result;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                metrics.recordExecution(useCaseName, duration, false);
                if (error instanceof UseCaseValidationError) {
                    metrics.recordValidationFailure(useCaseName, error.errors);
                }
                else if (error instanceof UseCaseAuthorizationError) {
                    metrics.recordAuthorizationFailure(useCaseName, 'unknown');
                }
                throw error;
            }
        };
        return target;
    };
}
//# sourceMappingURL=use-case.interface.js.map