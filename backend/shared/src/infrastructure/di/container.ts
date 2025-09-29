/**
 * Dependency Injection Container - IoC Pattern
 * Centralized dependency management for hospital services
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, SOLID Principles
 */

export type ServiceLifetime = 'singleton' | 'transient' | 'scoped';

export interface ServiceDescriptor<T = any> {
  token: string | symbol;
  factory: (...args: any[]) => T;
  lifetime: ServiceLifetime;
  dependencies?: (string | symbol)[];
}

export interface IContainer {
  register<T>(descriptor: ServiceDescriptor<T>): void;
  resolve<T>(token: string | symbol): T;
  createScope(): IContainer;
}

/**
 * Simple IoC Container Implementation
 */
export class Container implements IContainer {
  private services = new Map<string | symbol, ServiceDescriptor>();
  private singletons = new Map<string | symbol, any>();
  private parent?: Container;

  constructor(parent?: Container) {
    this.parent = parent;
  }

  register<T>(descriptor: ServiceDescriptor<T>): void {
    this.services.set(descriptor.token, descriptor);
  }

  resolve<T>(token: string | symbol): T {
    const descriptor = this.services.get(token) || this.parent?.services.get(token);
    
    if (!descriptor) {
      throw new Error(`Service not registered: ${String(token)}`);
    }

    // Singleton pattern
    if (descriptor.lifetime === 'singleton') {
      if (this.singletons.has(token)) {
        return this.singletons.get(token);
      }
      
      const instance = this.createInstance(descriptor);
      this.singletons.set(token, instance);
      return instance;
    }

    // Transient pattern
    return this.createInstance(descriptor);
  }

  createScope(): IContainer {
    return new Container(this);
  }

  private createInstance<T>(descriptor: ServiceDescriptor<T>): T {
    const dependencies = descriptor.dependencies?.map(dep => this.resolve(dep)) || [];
    return descriptor.factory(...dependencies);
  }
}

/**
 * Service Registration Helpers
 */
export class ServiceRegistry {
  static singleton<T>(
    token: string | symbol,
    factory: (...args: any[]) => T,
    dependencies?: (string | symbol)[]
  ): ServiceDescriptor<T> {
    return { token, factory, lifetime: 'singleton', dependencies };
  }

  static transient<T>(
    token: string | symbol,
    factory: (...args: any[]) => T,
    dependencies?: (string | symbol)[]
  ): ServiceDescriptor<T> {
    return { token, factory, lifetime: 'transient', dependencies };
  }

  static scoped<T>(
    token: string | symbol,
    factory: (...args: any[]) => T,
    dependencies?: (string | symbol)[]
  ): ServiceDescriptor<T> {
    return { token, factory, lifetime: 'scoped', dependencies };
  }
}

/**
 * Service Tokens - Type-safe service identifiers
 */
export const ServiceTokens = {
  // Repositories
  PATIENT_REPOSITORY: Symbol('PatientRepository'),
  DOCTOR_REPOSITORY: Symbol('DoctorRepository'),
  APPOINTMENT_REPOSITORY: Symbol('AppointmentRepository'),
  
  // Services
  PATIENT_SERVICE: Symbol('PatientService'),
  DOCTOR_SERVICE: Symbol('DoctorService'),
  APPOINTMENT_SERVICE: Symbol('AppointmentService'),
  
  // Infrastructure
  EVENT_BUS: Symbol('EventBus'),
  EVENT_STORE: Symbol('EventStore'),
  CONNECTION_POOL: Symbol('ConnectionPool'),
  LOGGER: Symbol('Logger'),
  
  // External Services
  NOTIFICATION_SERVICE: Symbol('NotificationService'),
  PAYMENT_SERVICE: Symbol('PaymentService'),
} as const;

/**
 * Global Container Instance
 */
export const globalContainer = new Container();

/**
 * Decorator for automatic dependency injection
 */
export function Injectable(token?: string | symbol) {
  return function <T extends new (...args: any[]) => any>(constructor: T) {
    const serviceToken = token || constructor.name;
    
    // Auto-register as singleton
    globalContainer.register(
      ServiceRegistry.singleton(serviceToken, (...args) => new constructor(...args))
    );
    
    return constructor;
  };
}

/**
 * Decorator for injecting dependencies
 */
export function Inject(token: string | symbol) {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    // Store metadata for dependency injection
    const existingTokens = Reflect.getMetadata('design:paramtypes', target) || [];
    existingTokens[parameterIndex] = token;
    Reflect.defineMetadata('design:paramtypes', existingTokens, target);
  };
}
