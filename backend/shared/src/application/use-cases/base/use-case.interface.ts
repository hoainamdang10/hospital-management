/**
 * Use Case Interface - Clean Architecture
 * Base interface for all application use cases
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, SOLID Principles
 */

/**
 * Base interface for all use cases
 * Represents a single business operation in the application layer
 */
export interface IUseCase<TRequest = any, TResponse = any> {
  /**
   * Execute the use case with the given request
   */
  execute(request: TRequest): Promise<TResponse>;
}

/**
 * Use case with validation
 */
export interface IValidatedUseCase<TRequest = any, TResponse = any> extends IUseCase<TRequest, TResponse> {
  /**
   * Validate the request before execution
   */
  validate(request: TRequest): Promise<ValidationResult>;
}

/**
 * Use case with authorization
 */
export interface IAuthorizedUseCase<TRequest = any, TResponse = any> extends IUseCase<TRequest, TResponse> {
  /**
   * Check if the user is authorized to execute this use case
   */
  authorize(request: TRequest, userId: string): Promise<boolean>;
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
 * Base abstract use case with common functionality
 */
export abstract class BaseUseCase<TRequest, TResponse> implements IValidatedUseCase<TRequest, TResponse> {
  /**
   * Execute the use case
   */
  async execute(request: TRequest): Promise<TResponse> {
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
 * Healthcare-specific use case interface
 */
export interface IHealthcareUseCase<TRequest = any, TResponse = any> extends IAuthorizedUseCase<TRequest, TResponse> {
  /**
   * Check if the operation involves PHI (Protected Health Information)
   */
  involvesPHI(request: TRequest): boolean;

  /**
   * Get the patient ID involved in this operation (if any)
   */
  getPatientId(request: TRequest): string | null;

  /**
   * Get HIPAA audit information
   */
  getAuditInfo(request: TRequest): HIPAAAuditInfo;
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
 * Base healthcare use case with HIPAA compliance
 */
export abstract class BaseHealthcareUseCase<TRequest, TResponse> 
  extends BaseUseCase<TRequest, TResponse> 
  implements IHealthcareUseCase<TRequest, TResponse> {

  /**
   * Execute with HIPAA compliance
   */
  async execute(request: TRequest): Promise<TResponse> {
    // Check authorization
    const userId = this.extractUserId(request);
    const authorized = await this.authorize(request, userId);
    if (!authorized) {
      throw new UseCaseAuthorizationError();
    }

    // Log HIPAA audit if involves PHI
    if (this.involvesPHI(request)) {
      await this.logHIPAAAudit(request);
    }

    // Execute base logic
    return await super.execute(request);
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
  abstract getAuditInfo(request: TRequest): HIPAAAuditInfo;

  /**
   * Extract user ID from request
   */
  protected abstract extractUserId(request: TRequest): string;

  /**
   * Log HIPAA audit
   */
  protected async logHIPAAAudit(request: TRequest): Promise<void> {
    const auditInfo = this.getAuditInfo(request);
    // Implementation would log to HIPAA audit system
    console.log('HIPAA Audit:', auditInfo);
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
