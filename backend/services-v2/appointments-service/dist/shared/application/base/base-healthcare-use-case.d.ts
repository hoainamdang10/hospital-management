/**
 * Base Healthcare Use Case
 * Hospital Management System V2
 *
 * Abstract base class for all healthcare use cases
 * Provides common functionality for request validation, error handling, and logging
 */
/**
 * Use Case Interface
 */
export interface IUseCase<TRequest, TResponse> {
    /**
     * Execute the use case
     */
    execute(request: TRequest): Promise<TResponse>;
}
/**
 * Validation Result
 */
export interface ValidationResult {
    isValid: boolean;
    errors?: string[];
}
/**
 * Base Healthcare Use Case
 * Abstract base class for all healthcare-related use cases
 */
export declare abstract class BaseHealthcareUseCase<TRequest, TResponse> implements IUseCase<TRequest, TResponse> {
    /**
     * Execute the use case
     * Public method that validates request then calls the protected executeImpl
     */
    execute(request: TRequest): Promise<TResponse>;
    /**
     * Execute implementation
     * Override this method in concrete use cases
     */
    protected abstract executeImpl(request: TRequest): Promise<TResponse>;
    /**
     * Validate request
     * Override this method to provide custom validation
     */
    protected validateRequest(_request: TRequest): Promise<ValidationResult>;
    /**
     * Handle error
     * Override this method to provide custom error handling
     */
    protected handleError(error: Error): TResponse;
}
/**
 * Base Use Case (Alias for backward compatibility)
 */
export declare abstract class BaseUseCase<TRequest, TResponse> extends BaseHealthcareUseCase<TRequest, TResponse> {
}
//# sourceMappingURL=base-healthcare-use-case.d.ts.map