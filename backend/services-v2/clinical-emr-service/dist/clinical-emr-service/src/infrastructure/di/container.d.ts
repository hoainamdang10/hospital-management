/**
 * Dependency Injection Container - Clinical EMR Service
 * Complete container setup with all dependencies
 *
 * @author Hospital Management Team
 * @version 2.1.0
 * @compliance Clean Architecture, DI Pattern, IoC
 * @updated 2025-11-02 - Registered all 40+ use cases and controllers
 */
import { Container } from "inversify";
export declare const container: Container;
/**
 * Initialize and configure the DI container
 */
export declare function initializeContainer(): Promise<{
    success: boolean;
    errors: string[];
}>;
/**
 * Check container health
 */
export declare function checkContainerHealth(): Promise<{
    healthy: boolean;
    errors: string[];
}>;
/**
 * Cleanup container resources
 */
export declare function cleanupContainer(): Promise<void>;
/**
 * Get a service from the container (helper)
 */
export declare function resolve<T>(serviceIdentifier: symbol): T;
/**
 * Export container instance
 */
export { container as DIContainer };
//# sourceMappingURL=container.d.ts.map