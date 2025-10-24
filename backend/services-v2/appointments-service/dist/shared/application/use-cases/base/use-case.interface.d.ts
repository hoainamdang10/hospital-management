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
export declare abstract class BaseUseCase<TRequest, TResponse> implements IValidatedUseCase<TRequest, TResponse> {
    protected context?: UseCaseContext;
    /**
     * Execute the use case
     */
    execute(request: TRequest, context?: UseCaseContext): Promise<TResponse>;
    /**
     * Validate the request
     */
    validate(_request: TRequest): Promise<ValidationResult>;
    /**
     * Execute the internal business logic
     */
    protected abstract executeInternal(request: TRequest): Promise<TResponse>;
    /**
     * Handle errors during execution
     */
    protected handleError(error: any, _request: TRequest): Promise<void>;
    /**
     * Get current execution context
     */
    protected getContext(): UseCaseContext;
}
/**
 * Base healthcare use case with HIPAA compliance
 */
export declare abstract class BaseHealthcareUseCase<TRequest, TResponse> extends BaseUseCase<TRequest, TResponse> implements IHealthcareUseCase<TRequest, TResponse> {
    /**
     * Execute with HIPAA compliance
     */
    execute(request: TRequest, context?: UseCaseContext): Promise<TResponse>;
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
    getAuditInfo(request: TRequest): HIPAAAuditInfo;
    /**
     * Log HIPAA audit
     */
    protected logHIPAAAudit(request: TRequest, _context: UseCaseContext): Promise<void>;
}
/**
 * Use case validation error
 */
export declare class UseCaseValidationError extends Error {
    readonly errors: ValidationError[];
    constructor(message: string, errors: ValidationError[]);
}
/**
 * Use case authorization error
 */
export declare class UseCaseAuthorizationError extends Error {
    constructor(message?: string);
}
/**
 * Use case execution error
 */
export declare class UseCaseExecutionError extends Error {
    readonly innerError?: Error;
    constructor(message: string, innerError?: Error);
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
export declare class UseCaseRegistry implements IUseCaseRegistry {
    private useCases;
    register<TUseCase extends IUseCase>(name: string, useCase: TUseCase): void;
    get<TUseCase extends IUseCase>(name: string): TUseCase;
    has(name: string): boolean;
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
 * Note: This is a simplified version to avoid TypeScript generic constraint issues
 */
export declare function WithMetrics(metrics: IUseCaseMetrics): <T extends new (...args: any[]) => IUseCase>(target: T) => T;
//# sourceMappingURL=use-case.interface.d.ts.map