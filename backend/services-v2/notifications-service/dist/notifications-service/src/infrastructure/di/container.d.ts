/**
 * Simple DI Container for Notification Service
 * Simplified version for demo
 */
export declare enum ServiceLifetime {
    SINGLETON = 0,
    SCOPED = 1,
    TRANSIENT = 2
}
export declare class DIContainer {
    private services;
    registerFactory<T>(token: string, factory: (container: DIContainer) => T, lifetime?: ServiceLifetime): void;
    registerSingleton<T>(token: string, factory: (container: DIContainer) => T): void;
    resolve<T>(token: string): T;
    clear(): void;
}
//# sourceMappingURL=container.d.ts.map