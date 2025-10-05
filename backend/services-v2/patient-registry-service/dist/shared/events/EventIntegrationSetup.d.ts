/**
 * EventIntegrationSetup - Event Integration Setup
 * Centralized setup for all service event handlers and integration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Vietnamese Healthcare Standards
 */
export interface ServiceEventHandlerConfig {
    serviceName: string;
    handlerClass: any;
    dependencies: any[];
    enabled: boolean;
    priority: number;
}
export interface EventIntegrationStatus {
    totalServices: number;
    connectedServices: number;
    failedServices: number;
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    averageProcessingTime: number;
    lastHealthCheck: Date;
}
export declare class EventIntegrationSetup {
    private static instance;
    private eventBusConfig;
    private handlers;
    private status;
    private healthCheckInterval;
    private constructor();
    static getInstance(): EventIntegrationSetup;
    /**
     * Initialize all service event handlers
     */
    initializeAllServices(): Promise<void>;
    /**
     * Get service configurations
     */
    private getServiceConfigurations;
    /**
     * Initialize individual service
     */
    private initializeService;
    /**
     * Start health monitoring
     */
    private startHealthMonitoring;
    /**
     * Perform health check on all handlers
     */
    private performHealthCheck;
    /**
     * Get integration status
     */
    getIntegrationStatus(): EventIntegrationStatus;
    /**
     * Get handler status for specific service
     */
    getServiceStatus(serviceName: string): any;
    /**
     * Get all service statuses
     */
    getAllServiceStatuses(): Record<string, any>;
    /**
     * Shutdown all handlers
     */
    shutdown(): Promise<void>;
    /**
     * Get Vietnamese healthcare event routing summary
     */
    getVietnameseHealthcareRoutingSummary(): any;
}
export declare const eventIntegrationSetup: EventIntegrationSetup;
//# sourceMappingURL=EventIntegrationSetup.d.ts.map