/**
 * Comprehensive Health Checks for Identity Service
 * Monitors all critical components and dependencies
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, HIPAA-Compliant Monitoring
 */
import { ILogger } from '../../application/services/ILogger';
import { IHealthCheckService, HealthStatus, HealthCheckResult, ServiceHealth } from '../../application/services/IHealthCheckService';
export { HealthStatus, HealthCheckResult, ServiceHealth };
/**
 * Health Check Service for Identity Service
 * Provides comprehensive monitoring of all service components
 */
export declare class IdentityServiceHealthCheck implements IHealthCheckService {
    private logger;
    private supabaseClient;
    private startTime;
    constructor(supabaseUrl: string, supabaseKey: string, logger: ILogger);
    /**
     * Perform comprehensive health check
     */
    checkHealth(): Promise<ServiceHealth>;
    /**
     * Map overall health status to simplified status string
     */
    private mapStatus;
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
     * Optimized query using index on created_at
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