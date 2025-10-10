/**
 * Comprehensive Health Checks for Identity Service
 * Monitors all critical components and dependencies
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, HIPAA-Compliant Monitoring
 */
import { ILogger } from '../../application/services/ILogger';
export declare enum HealthStatus {
    HEALTHY = "HEALTHY",
    DEGRADED = "DEGRADED",
    UNHEALTHY = "UNHEALTHY",
    UNKNOWN = "UNKNOWN"
}
export interface HealthCheckResult {
    status: HealthStatus;
    timestamp: Date;
    responseTime: number;
    details?: Record<string, unknown>;
    error?: string;
}
export interface ServiceHealth {
    overall: HealthStatus;
    components: {
        database: HealthCheckResult;
        authentication: HealthCheckResult;
        authorization: HealthCheckResult;
        sessions: HealthCheckResult;
        audit: HealthCheckResult;
        circuitBreakers: HealthCheckResult;
    };
    metadata: {
        version: string;
        uptime: number;
        environment: string;
        timestamp: Date;
    };
}
/**
 * Health Check Service for Identity Service
 * Provides comprehensive monitoring of all service components
 */
export declare class IdentityServiceHealthCheck {
    private logger;
    private supabaseClient;
    private startTime;
    constructor(supabaseUrl: string, supabaseKey: string, logger: ILogger);
    /**
     * Perform comprehensive health check
     */
    checkHealth(): Promise<ServiceHealth>;
    /**
     * Check database connectivity and performance
     */
    private checkDatabase;
    /**
     * Check authentication service functionality
     */
    private checkAuthentication;
    /**
     * Check authorization service functionality
     */
    private checkAuthorization;
    /**
     * Check session management functionality
     */
    private checkSessions;
    /**
     * Check audit logging functionality
     */
    private checkAudit;
    /**
     * Check circuit breaker status
     */
    private checkCircuitBreakers;
    /**
     * Helper methods
     */
    private getResultFromSettled;
    private createErrorResult;
    private calculateOverallHealth;
}
//# sourceMappingURL=HealthChecks.d.ts.map