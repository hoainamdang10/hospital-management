/**
 * Dependency Injection Container - Clinical EMR Service
 * Container setup for all dependencies
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DI Pattern, IoC
 */
import { Container } from 'inversify';
/**
 * Create and configure the DI container
 */
export declare function createContainer(): Container;
/**
 * Global container instance
 */
export declare const container: Container;
/**
 * Helper functions to get services from container
 */
export declare const getService: <T>(serviceIdentifier: symbol) => T;
export declare const getServices: <T>(serviceIdentifier: symbol) => T[];
/**
 * Container health check
 */
export declare const checkContainerHealth: () => {
    healthy: boolean;
    errors: string[];
};
/**
 * Container cleanup
 */
export declare const cleanupContainer: () => Promise<void>;
/**
 * Container configuration validation
 */
export declare const validateContainerConfiguration: () => {
    valid: boolean;
    errors: string[];
};
/**
 * Initialize container with health checks
 */
export declare const initializeContainer: () => Promise<{
    success: boolean;
    errors: string[];
}>;
//# sourceMappingURL=container.d.ts.map