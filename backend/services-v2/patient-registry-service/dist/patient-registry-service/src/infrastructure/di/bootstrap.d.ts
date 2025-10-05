/**
 * Bootstrap Module - Application Initialization
 * Patient Registry Service V2
 *
 * Provides a clean way to initialize the application with DI container
 *
 * Usage:
 *   import { bootstrap } from './infrastructure/di/bootstrap';
 *   const { app, container } = await bootstrap(config);
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { Express } from 'express';
import { ServiceContainer } from './ServiceContainer';
/**
 * Application Configuration
 */
export interface AppConfig {
    port: number;
    supabaseUrl: string;
    supabaseServiceKey: string;
    nodeEnv: string;
    serviceName: string;
    version: string;
    allowedOrigins: string[];
    circuitBreaker?: {
        failureThreshold?: number;
        resetTimeout?: number;
        monitoringPeriod?: number;
    };
}
/**
 * Bootstrap Result
 */
export interface BootstrapResult {
    app: Express;
    container: ServiceContainer;
    config: AppConfig;
}
/**
 * Bootstrap the application
 *
 * @param config Application configuration
 * @returns Express app and service container
 */
export declare function bootstrap(config: AppConfig): Promise<BootstrapResult>;
/**
 * Start the application server
 */
export declare function startServer(app: Express, config: AppConfig): Promise<void>;
/**
 * Graceful shutdown
 */
export declare function shutdown(container: ServiceContainer): Promise<void>;
//# sourceMappingURL=bootstrap.d.ts.map