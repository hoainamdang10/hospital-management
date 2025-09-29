export interface ServiceInfo {
    name: string;
    url: string;
    status: "healthy" | "unhealthy" | "unknown";
    lastHealthCheck: Date;
    responseTime?: number;
    version?: string;
    uptime?: number;
}
export interface ServiceRegistryConfig {
    healthCheckInterval: number;
    healthCheckTimeout: number;
    maxRetries: number;
}
/**
 * Service Registry for Pure API Gateway Communication
 *
 * This service manages service discovery and health monitoring
 * for all microservices in the hospital management system.
 */
export declare class ServiceRegistryService {
    private services;
    private healthCheckInterval;
    private config;
    constructor(config?: Partial<ServiceRegistryConfig>);
    /**
     * Initialize services from environment variables
     */
    private initializeServices;
    /**
     * Register a new service
     */
    registerService(name: string, url: string, version?: string): void;
    /**
     * Unregister a service
     */
    unregisterService(name: string): boolean;
    /**
     * Get service information
     */
    getService(name: string): ServiceInfo | undefined;
    /**
     * Get all registered services
     */
    getRegisteredServices(): ServiceInfo[];
    /**
     * Get healthy services only
     */
    getHealthyServices(): ServiceInfo[];
    /**
     * Get service by name with health status
     */
    getServiceWithHealth(name: string): ServiceInfo | null;
    /**
     * Start periodic health checks
     */
    private startHealthChecks;
    /**
     * Stop health checks
     */
    stopHealthChecks(): void;
    /**
     * Perform health checks for all services
     */
    private performAllHealthChecks;
    /**
     * Perform health check for a specific service
     */
    private performHealthCheck;
    /**
     * Get service registry statistics
     */
    getStatistics(): {
        total: number;
        healthy: number;
        unhealthy: number;
        unknown: number;
        averageResponseTime: number;
    };
    /**
     * Force health check for a specific service
     */
    forceHealthCheck(serviceName: string): Promise<ServiceInfo | null>;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
