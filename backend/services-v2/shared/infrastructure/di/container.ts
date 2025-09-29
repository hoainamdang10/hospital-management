/**
 * Dependency Injection Container - Clean Architecture
 * Enhanced IoC container with healthcare-specific features
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, SOLID Principles, Healthcare Compliance
 */

// Import will be added when use-case interface is created

/**
 * Service Lifetime
 */
export enum ServiceLifetime {
  SINGLETON = "singleton",
  TRANSIENT = "transient",
  SCOPED = "scoped",
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
export class DIContainer {
  private services = new Map<string | symbol, ServiceRegistration>();
  private singletonInstances = new Map<string | symbol, any>();
  private scopedInstances = new Map<string, Map<string | symbol, any>>();
  private config: ContainerConfig;

  constructor(config: Partial<ContainerConfig> = {}) {
    this.config = {
      enableHealthcareCompliance: true,
      enableHealthChecks: true,
      enableMetrics: false,
      defaultLifetime: ServiceLifetime.TRANSIENT,
      ...config,
    };
  }

  /**
   * Register service with implementation
   */
  register<T>(
    token: string | symbol,
    implementation: new (...args: any[]) => T,
    lifetime: ServiceLifetime = this.config.defaultLifetime,
    dependencies: (string | symbol)[] = [],
    metadata?: ServiceMetadata
  ): DIContainer {
    this.services.set(token, {
      token,
      implementation,
      lifetime,
      dependencies,
      ...(metadata && { metadata }),
    });

    return this;
  }

  /**
   * Register service with factory function
   */
  registerFactory<T>(
    token: string | symbol,
    factory: (...args: any[]) => T,
    lifetime: ServiceLifetime = this.config.defaultLifetime,
    dependencies: (string | symbol)[] = [],
    metadata?: ServiceMetadata
  ): DIContainer {
    this.services.set(token, {
      token,
      implementation: null as any,
      lifetime,
      dependencies,
      factory,
      ...(metadata && { metadata }),
    });

    return this;
  }

  /**
   * Register singleton instance
   */
  registerInstance<T>(
    token: string | symbol,
    instance: T,
    metadata?: ServiceMetadata
  ): DIContainer {
    this.services.set(token, {
      token,
      implementation: null as any,
      lifetime: ServiceLifetime.SINGLETON,
      instance,
      ...(metadata && { metadata }),
    });

    this.singletonInstances.set(token, instance);
    return this;
  }

  /**
   * Resolve service instance
   */
  resolve<T>(token: string | symbol, scopeId?: string): T {
    const registration = this.services.get(token);
    if (!registration) {
      throw new Error(`Service not registered: ${String(token)}`);
    }

    // Validate healthcare compliance if required
    if (
      this.config.enableHealthcareCompliance &&
      registration.metadata?.requiresHIPAACompliance
    ) {
      this.validateHIPAACompliance(registration);
    }

    return this.createInstance<T>(registration, scopeId);
  }

  /**
   * Resolve all services with specific tag
   */
  resolveByTag<T>(tag: string, scopeId?: string): T[] {
    const services: T[] = [];

    for (const [token, registration] of this.services) {
      if (registration.metadata?.tags?.includes(tag)) {
        services.push(this.resolve<T>(token, scopeId));
      }
    }

    return services;
  }

  /**
   * Create new scope for scoped services
   */
  createScope(): DIScope {
    const scopeId = `scope_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.scopedInstances.set(scopeId, new Map());

    return new DIScope(this, scopeId);
  }

  /**
   * Dispose scope and cleanup scoped instances
   */
  disposeScope(scopeId: string): void {
    const scopedInstances = this.scopedInstances.get(scopeId);
    if (scopedInstances) {
      // Dispose instances that implement IDisposable
      for (const instance of scopedInstances.values()) {
        if (instance && typeof instance.dispose === "function") {
          instance.dispose();
        }
      }

      this.scopedInstances.delete(scopeId);
    }
  }

  /**
   * Get service health status
   */
  async getServiceHealth(): Promise<ServiceHealthStatus[]> {
    if (!this.config.enableHealthChecks) {
      return [];
    }

    const healthStatuses: ServiceHealthStatus[] = [];

    for (const [token, registration] of this.services) {
      if (registration.metadata?.healthCheck) {
        try {
          const isHealthy = await registration.metadata.healthCheck();
          healthStatuses.push({
            service: String(token),
            healthy: isHealthy,
            lastChecked: new Date(),
          });
        } catch (error) {
          healthStatuses.push({
            service: String(token),
            healthy: false,
            lastChecked: new Date(),
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    return healthStatuses;
  }

  /**
   * Get registered services info
   */
  getServicesInfo(): ServiceInfo[] {
    return Array.from(this.services.values()).map((registration) => ({
      token: String(registration.token),
      lifetime: registration.lifetime,
      hasFactory: !!registration.factory,
      hasInstance: !!registration.instance,
      dependencies: registration.dependencies?.map((d) => String(d)) || [],
      ...(registration.metadata && { metadata: registration.metadata }),
    }));
  }

  /**
   * Create service instance based on lifetime
   */
  private createInstance<T>(
    registration: ServiceRegistration<T>,
    scopeId?: string
  ): T {
    switch (registration.lifetime) {
      case ServiceLifetime.SINGLETON:
        return this.createSingletonInstance(registration);

      case ServiceLifetime.SCOPED:
        if (!scopeId) {
          throw new Error(
            `Scoped service ${String(registration.token)} requires scope ID`
          );
        }
        return this.createScopedInstance(registration, scopeId);

      case ServiceLifetime.TRANSIENT:
      default:
        return this.createTransientInstance(registration);
    }
  }

  /**
   * Create singleton instance
   */
  private createSingletonInstance<T>(registration: ServiceRegistration<T>): T {
    if (registration.instance) {
      return registration.instance;
    }

    let instance = this.singletonInstances.get(registration.token);
    if (!instance) {
      instance = this.instantiateService(registration);
      this.singletonInstances.set(registration.token, instance);
    }

    return instance;
  }

  /**
   * Create scoped instance
   */
  private createScopedInstance<T>(
    registration: ServiceRegistration<T>,
    scopeId: string
  ): T {
    const scopedInstances = this.scopedInstances.get(scopeId);
    if (!scopedInstances) {
      throw new Error(`Scope not found: ${scopeId}`);
    }

    let instance = scopedInstances.get(registration.token);
    if (!instance) {
      instance = this.instantiateService(registration);
      scopedInstances.set(registration.token, instance);
    }

    return instance;
  }

  /**
   * Create transient instance
   */
  private createTransientInstance<T>(registration: ServiceRegistration<T>): T {
    return this.instantiateService(registration);
  }

  /**
   * Instantiate service with dependency injection
   */
  private instantiateService<T>(registration: ServiceRegistration<T>): T {
    if (registration.factory) {
      const dependencies = this.resolveDependencies(
        registration.dependencies || []
      );
      return registration.factory(...dependencies);
    }

    if (registration.implementation) {
      const dependencies = this.resolveDependencies(
        registration.dependencies || []
      );
      return new registration.implementation(...dependencies);
    }

    throw new Error(
      `Cannot instantiate service: ${String(registration.token)}`
    );
  }

  /**
   * Resolve service dependencies
   */
  private resolveDependencies(dependencies: (string | symbol)[]): any[] {
    return dependencies.map((dep) => this.resolve(dep));
  }

  /**
   * Validate HIPAA compliance for healthcare services
   */
  private validateHIPAACompliance(registration: ServiceRegistration): void {
    if (!registration.metadata?.isHealthcareService) {
      throw new Error(
        `Service ${String(registration.token)} requires HIPAA compliance but is not marked as healthcare service`
      );
    }

    // Additional HIPAA validation logic can be added here
  }
}

/**
 * DI Scope for scoped services
 */
export class DIScope implements IDisposable {
  constructor(
    private container: DIContainer,
    private scopeId: string
  ) {}

  resolve<T>(token: string | symbol): T {
    return this.container.resolve<T>(token, this.scopeId);
  }

  dispose(): void {
    this.container.disposeScope(this.scopeId);
  }
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
export const ServiceTokens = {
  // Repositories
  PATIENT_REPOSITORY: Symbol("PatientRepository"),
  DOCTOR_REPOSITORY: Symbol("DoctorRepository"),
  APPOINTMENT_REPOSITORY: Symbol("AppointmentRepository"),

  // Use Cases
  REGISTER_PATIENT_USE_CASE: Symbol("RegisterPatientUseCase"),
  SCHEDULE_APPOINTMENT_USE_CASE: Symbol("ScheduleAppointmentUseCase"),

  // Infrastructure
  EVENT_BUS: Symbol("EventBus"),
  EVENT_STORE: Symbol("EventStore"),
  DATABASE_CONNECTION: Symbol("DatabaseConnection"),

  // Healthcare Services
  HIPAA_AUDIT_LOGGER: Symbol("HIPAAAuditLogger"),
  FHIR_CLIENT: Symbol("FHIRClient"),

  // External Services
  NOTIFICATION_SERVICE: Symbol("NotificationService"),
  PAYMENT_SERVICE: Symbol("PaymentService"),
} as const;
