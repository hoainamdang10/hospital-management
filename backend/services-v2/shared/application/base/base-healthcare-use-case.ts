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
export abstract class BaseHealthcareUseCase<TRequest, TResponse> implements IUseCase<TRequest, TResponse> {
  /**
   * Execute the use case
   * Public method that calls the protected executeImpl
   */
  public async execute(request: TRequest): Promise<TResponse> {
    return this.executeImpl(request);
  }

  /**
   * Execute implementation
   * Override this method in concrete use cases
   */
  protected abstract executeImpl(request: TRequest): Promise<TResponse>;

  /**
   * Validate request
   * Override this method to provide custom validation
   */
  protected async validateRequest(_request: TRequest): Promise<ValidationResult> {
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
  protected handleError(error: Error): TResponse {
    throw error;
  }
}

/**
 * Base Use Case (Alias for backward compatibility)
 */
export abstract class BaseUseCase<TRequest, TResponse> extends BaseHealthcareUseCase<TRequest, TResponse> {}

