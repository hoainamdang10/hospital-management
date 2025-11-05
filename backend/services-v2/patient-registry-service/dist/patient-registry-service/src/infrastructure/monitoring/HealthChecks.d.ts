/**
 * Comprehensive Health Checks for Patient Registry Service
 * Monitors all critical components and dependencies
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, HIPAA-Compliant Monitoring
 */
import { PatientRegistryDegradation } from '../resilience/GracefulDegradation';
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
        eventPublisher: HealthCheckResult;
        patientMatching: HealthCheckResult;
        insuranceValidation: HealthCheckResult;
        circuitBreakers: HealthCheckResult;
        degradationService: HealthCheckResult;
    };
    metadata: {
        version: string;
        uptime: number;
        environment: string;
        timestamp: Date;
    };
}
/**
 * Health Check Service for Patient Registry Service
 * Provides comprehensive monitoring of all service components
 */
export declare class PatientRegistryHealthCheck {
    private supabaseClient;
    private startTime;
    private degradationService?;
    constructor(supabaseUrl: string, supabaseKey: string, degradationService?: PatientRegistryDegradation);
    /**
     * Perform comprehensive health check
     */
    checkHealth(): Promise<ServiceHealth>;
    /**
     * Check database connectivity and performance
     */
    private checkDatabase;
    /**
     * Check RabbitMQ event publisher
     * Performs actual connection check instead of placeholder
     */
    private checkEventPublisher;
    /**
     * Check patient matching service
     */
    private checkPatientMatching;
    /**
     * Check insurance validation service
     */
    private checkInsuranceValidation;
    /**
     * Check circuit breakers status
     */
    private checkCircuitBreakers;
    /**
     * Check degradation service health
     */
    private checkDegradationService;
    /**
     * Extract result from Promise.allSettled
     */
    private getResultFromSettled;
    /**
     * Create error result
     */
    private createErrorResult;
    /**
     * Calculate overall health from components
     */
    private calculateOverallHealth;
}
//# sourceMappingURL=HealthChecks.d.ts.map