/**
 * Dependency Injection Container - Clean Architecture
 * Enhanced IoC container with healthcare-specific features
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, SOLID Principles, Healthcare Compliance
 */
/**
 * Service Lifetime
 */
export declare enum ServiceLifetime {
    SINGLETON = "singleton",
    TRANSIENT = "transient",
    SCOPED = "scoped"
}
/**
 * Service Registration
 */
export interface ServiceRegistration<T = any> {
    token: string | symbol;
    implementation: new (...args: any[]) => T;
    lifetime: ServiceLifetime;
    dependencies?: (string | symbol)[];
    factory?: (...args: any[]) => T;
    instance?: T;
    metadata?: ServiceMetadata;
}
/**
 * Service Metadata
 */
export interface ServiceMetadata {
    description?: string;
    version?: string;
    tags?: string[];
    healthCheck?: () => Promise<boolean>;
    isHealthcareService?: boolean;
    requiresHIPAACompliance?: boolean;
}
/**
 * Container Configuration
 */
export interface ContainerConfig {
    enableHealthcareCompliance: boolean;
    enableHealthChecks: boolean;
    enableMetrics: boolean;
    defaultLifetime: ServiceLifetime;
}
/**
 * Dependency Injection Container
 */
export declare class DIContainer {
    private services;
    private singletonInstances;
    private scopedInstances;
    private config;
    constructor(config?: Partial<ContainerConfig>);
    /**
     * Register service with implementation
     */
    register<T>(token: string | symbol, implementation: new (...args: any[]) => T, lifetime?: ServiceLifetime, dependencies?: (string | symbol)[], metadata?: ServiceMetadata): DIContainer;
    /**
     * Register service with factory function
     */
    registerFactory<T>(token: string | symbol, factory: (...args: any[]) => T, lifetime?: ServiceLifetime, dependencies?: (string | symbol)[], metadata?: ServiceMetadata): DIContainer;
    /**
     * Register singleton instance
     */
    registerInstance<T>(token: string | symbol, instance: T, metadata?: ServiceMetadata): DIContainer;
    /**
     * Resolve service instance
     */
    resolve<T>(token: string | symbol, scopeId?: string): T;
    /**
     * Resolve all services with specific tag
     */
    resolveByTag<T>(tag: string, scopeId?: string): T[];
    /**
     * Create new scope for scoped services
     */
    createScope(): DIScope;
    /**
     * Dispose scope and cleanup scoped instances
     */
    disposeScope(scopeId: string): void;
    /**
     * Get service health status
     */
    getServiceHealth(): Promise<ServiceHealthStatus[]>;
    /**
     * Get registered services info
     */
    getServicesInfo(): ServiceInfo[];
    /**
     * Create service instance based on lifetime
     */
    private createInstance;
    /**
     * Create singleton instance
     */
    private createSingletonInstance;
    /**
     * Create scoped instance
     */
    private createScopedInstance;
    /**
     * Create transient instance
     */
    private createTransientInstance;
    /**
     * Instantiate service with dependency injection
     */
    private instantiateService;
    /**
     * Resolve service dependencies
     */
    private resolveDependencies;
    /**
     * Validate HIPAA compliance for healthcare services
     */
    private validateHIPAACompliance;
}
/**
 * DI Scope for scoped services
 */
export declare class DIScope implements IDisposable {
    private container;
    private scopeId;
    constructor(container: DIContainer, scopeId: string);
    resolve<T>(token: string | symbol): T;
    dispose(): void;
}
/**
 * Service Health Status
 */
export interface ServiceHealthStatus {
    service: string;
    healthy: boolean;
    lastChecked: Date;
    error?: string;
}
/**
 * Service Information
 */
export interface ServiceInfo {
    token: string;
    lifetime: ServiceLifetime;
    hasFactory: boolean;
    hasInstance: boolean;
    dependencies: string[];
    metadata?: ServiceMetadata;
}
/**
 * Disposable Interface
 */
export interface IDisposable {
    dispose(): void;
}
/**
 * Service Tokens for common services
 */
export declare const ServiceTokens: {
    readonly PATIENT_REPOSITORY: symbol;
    readonly DOCTOR_REPOSITORY: symbol;
    readonly APPOINTMENT_REPOSITORY: symbol;
    readonly REGISTER_PATIENT_USE_CASE: symbol;
    readonly SCHEDULE_APPOINTMENT_USE_CASE: symbol;
    readonly EVENT_BUS: symbol;
    readonly EVENT_STORE: symbol;
    readonly DATABASE_CONNECTION: symbol;
    readonly HIPAA_AUDIT_LOGGER: symbol;
    readonly FHIR_CLIENT: symbol;
    readonly NOTIFICATION_SERVICE: symbol;
    readonly PAYMENT_SERVICE: symbol;
};
//# sourceMappingURL=container.d.ts.map