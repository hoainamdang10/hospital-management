/**
 * Simple DI Container for Notification Service
 * Simplified version for demo
 */

export enum ServiceLifetime {
  SINGLETON,
  SCOPED,
  TRANSIENT
}

export class DIContainer {
  private services = new Map<string, { factory: (container: DIContainer) => any; lifetime: ServiceLifetime; instance?: any }>();

  registerFactory<T>(token: string, factory: (container: DIContainer) => T, lifetime: ServiceLifetime = ServiceLifetime.TRANSIENT): void {
    this.services.set(token, { factory, lifetime });
  }

  registerSingleton<T>(token: string, factory: (container: DIContainer) => T): void {
    this.registerFactory(token, factory, ServiceLifetime.SINGLETON);
  }

  resolve<T>(token: string): T {
    const service = this.services.get(token);
    if (!service) {
      throw new Error(`Service not registered: ${token}`);
    }

    if (service.lifetime === ServiceLifetime.SINGLETON) {
      if (!service.instance) {
        service.instance = service.factory(this);
      }
      return service.instance;
    }

    return service.factory(this);
  }

  clear(): void {
    this.services.clear();
  }
}
