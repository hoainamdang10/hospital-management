/**
 * Use Case Interfaces - Clean Architecture
 * Enhanced base interfaces for application layer use cases
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, SOLID Principles, Healthcare Compliance
 */

/**
 * Base interface for all use cases
 */
export interface IUseCase<TRequest = any, TResponse = any> {
  execute(request: TRequest): Promise<TResponse>;
}

/**
 * Use case with validation
 */
export interface IValidatedUseCase<TRequest = any, TResponse = any> extends IUseCase<TRequest, TResponse> {
  validate(request: TRequest): Promise<ValidationResult>;
}

/**
 * Use case with authorization
 */
export interface IAuthorizedUseCase<TRequest = any, TResponse = any> extends IUseCase<TRequest, TResponse> {
  authorize(request: TRequest, userId: string): Promise<boolean>;
}

/**
 * Healthcare-specific use case interface
 */
export interface IHealthcareUseCase<TRequest = any, TResponse = any> extends IAuthorizedUseCase<TRequest, TResponse> {
  involvesPHI(request: TRequest): boolean;
  getPatientId(request: TRequest): string | null;
  getAuditInfo(request: TRequest): HIPAAAuditInfo;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * HIPAA audit information
 */
export interface HIPAAAuditInfo {
  action: string;
  patientId?: string;
  userId: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

/**
 * Use case execution context
 */
export interface UseCaseContext {
  userId: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  permissions?: string[];
}

/**
 * Use case result wrapper
 */
export interface UseCaseResult<T = any> {
  success: boolean;
  data?: T;
  error?: UseCaseError;
  warnings?: string[];
  metadata?: Record<string, any>;
}

/**
 * Use case error
 */
export interface UseCaseError {
  code: string;
  message: string;
  details?: any;
  innerError?: Error;
}

/**
 * Base abstract use case with common functionality
 */
export abstract class BaseUseCase<TRequest, TResponse> implements IValidatedUseCase<TRequest, TResponse> {
  protected context?: UseCaseContext;

  /**
   * Execute the use case
   */
  async execute(request: TRequest, context?: UseCaseContext): Promise<TResponse> {
    this.context = context;

    try {
      // Validate request
      const validationResult = await this.validate(request);
      if (!validationResult.isValid) {
        throw new UseCaseValidationError(
          'Use case validation failed',
          validationResult.errors
        );
      }

      // Execute business logic
      return await this.executeInternal(request);
    } catch (error) {
      await this.handleError(error, request);
      throw error;
    }
  }

  /**
   * Validate the request
   */
  async validate(request: TRequest): Promise<ValidationResult> {
    // Default implementation - override in subclasses
    return { isValid: true, errors: [] };
  }

  /**
   * Execute the internal business logic
   */
  protected abstract executeInternal(request: TRequest): Promise<TResponse>;

  /**
   * Handle errors during execution
   */
  protected async handleError(error: any, request: TRequest): Promise<void> {
    // Log error, send notifications, etc.
    console.error('Use case execution error:', error);
  }

  /**
   * Get current execution context
   */
  protected getContext(): UseCaseContext {
    if (!this.context) {
      throw new Error('Use case context not available');
    }
    return this.context;
  }
}

/**
 * Base healthcare use case with HIPAA compliance
 */
export abstract class BaseHealthcareUseCase<TRequest, TResponse> 
  extends BaseUseCase<TRequest, TResponse> 
  implements IHealthcareUseCase<TRequest, TResponse> {

  /**
   * Execute with HIPAA compliance
   */
  async execute(request: TRequest, context?: UseCaseContext): Promise<TResponse> {
    if (!context?.userId) {
      throw new UseCaseAuthorizationError('User context required for healthcare operations');
    }

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
   * Check authorization
   */
  abstract authorize(request: TRequest, userId: string): Promise<boolean>;

  /**
   * Check if involves PHI
   */
  abstract involvesPHI(request: TRequest): boolean;

  /**
   * Get patient ID
   */
  abstract getPatientId(request: TRequest): string | null;

  /**
   * Get audit information
   */
  getAuditInfo(request: TRequest): HIPAAAuditInfo {
    const context = this.getContext();
    return {
      action: this.constructor.name,
      patientId: this.getPatientId(request),
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
  protected async logHIPAAAudit(request: TRequest, context: UseCaseContext): Promise<void> {
    const auditInfo = this.getAuditInfo(request);
    // Implementation would log to HIPAA audit system
    console.log('HIPAA Audit:', auditInfo);
  }
}

/**
 * Use case validation error
 */
export class UseCaseValidationError extends Error {
  public readonly errors: ValidationError[];

  constructor(message: string, errors: ValidationError[]) {
    super(message);
    this.name = 'UseCaseValidationError';
    this.errors = errors;
  }
}

/**
 * Use case authorization error
 */
export class UseCaseAuthorizationError extends Error {
  constructor(message: string = 'Unauthorized to execute this use case') {
    super(message);
    this.name = 'UseCaseAuthorizationError';
  }
}

/**
 * Use case execution error
 */
export class UseCaseExecutionError extends Error {
  public readonly innerError?: Error;

  constructor(message: string, innerError?: Error) {
    super(message);
    this.name = 'UseCaseExecutionError';
    this.innerError = innerError;
  }
}

/**
 * Use case factory interface
 */
export interface IUseCaseFactory {
  create<TUseCase extends IUseCase>(useCaseType: new (...args: any[]) => TUseCase): TUseCase;
}

/**
 * Use case registry for managing use cases
 */
export interface IUseCaseRegistry {
  register<TUseCase extends IUseCase>(name: string, useCase: TUseCase): void;
  get<TUseCase extends IUseCase>(name: string): TUseCase;
  has(name: string): boolean;
}

/**
 * Simple use case registry implementation
 */
export class UseCaseRegistry implements IUseCaseRegistry {
  private useCases = new Map<string, IUseCase>();

  register<TUseCase extends IUseCase>(name: string, useCase: TUseCase): void {
    this.useCases.set(name, useCase);
  }

  get<TUseCase extends IUseCase>(name: string): TUseCase {
    const useCase = this.useCases.get(name);
    if (!useCase) {
      throw new Error(`Use case not found: ${name}`);
    }
    return useCase as TUseCase;
  }

  has(name: string): boolean {
    return this.useCases.has(name);
  }
}

/**
 * Use case metrics interface
 */
export interface IUseCaseMetrics {
  recordExecution(useCaseName: string, duration: number, success: boolean): void;
  recordValidationFailure(useCaseName: string, errors: ValidationError[]): void;
  recordAuthorizationFailure(useCaseName: string, userId: string): void;
}

/**
 * Use case decorator for metrics collection
 */
export function WithMetrics(metrics: IUseCaseMetrics) {
  return function <T extends IUseCase>(target: new (...args: any[]) => T) {
    return class extends target {
      async execute(request: any, context?: UseCaseContext): Promise<any> {
        const startTime = Date.now();
        const useCaseName = this.constructor.name;
        
        try {
          const result = await super.execute(request, context);
          const duration = Date.now() - startTime;
          metrics.recordExecution(useCaseName, duration, true);
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          metrics.recordExecution(useCaseName, duration, false);
          
          if (error instanceof UseCaseValidationError) {
            metrics.recordValidationFailure(useCaseName, error.errors);
          } else if (error instanceof UseCaseAuthorizationError) {
            metrics.recordAuthorizationFailure(useCaseName, context?.userId || 'unknown');
          }
          
          throw error;
        }
      }
    };
  };
}
