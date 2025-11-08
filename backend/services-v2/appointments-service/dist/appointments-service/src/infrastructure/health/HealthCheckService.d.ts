/**
 * Health Check Service
 * Provides comprehensive health checks for all dependencies
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
import { RedisCacheService } from "../cache/RedisCacheService";
import { AppConfig } from "../config/ConfigValidator";
import type { EventSubscriptions } from "../events/EventSubscriptions";
export interface HealthStatus {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    service: string;
    version: string;
    uptime: number;
    checks: {
        database: HealthCheckResult;
        redis: HealthCheckResult;
        rabbitmq: HealthCheckResult;
        externalServices: {
            patientService: HealthCheckResult;
            providerService: HealthCheckResult;
            schedulerService: HealthCheckResult;
        };
    };
}
export interface HealthCheckResult {
    status: "up" | "down" | "degraded";
    responseTime?: number;
    message?: string;
    error?: string;
    lastChecked: string;
}
/**
 * Health Check Service
 */
export declare class HealthCheckService {
    private config;
    private cacheService;
    private supabaseClient;
    private startTime;
    private eventSubscriptions?;
    constructor(config: AppConfig, cacheService: RedisCacheService, eventSubscriptions?: EventSubscriptions);
    /**
     * Perform comprehensive health check
     */
    check(detailed?: boolean): Promise<HealthStatus>;
    /**
     * Check database connectivity
     */
    private checkDatabase;
    /**
     * Check Redis connectivity
     */
    private checkRedis;
    /**
     * Check RabbitMQ connectivity
     */
    private checkRabbitMQ;
    /**
     * Check external service connectivity
     */
    private checkExternalService;
    /**
     * Get service uptime in seconds
     */
    getUptime(): number;
    /**
     * Get service version
     */
    getVersion(): string;
    /**
     * Attach EventSubscriptions after they are initialized
     */
    attachEventSubscriptions(eventSubscriptions: EventSubscriptions): void;
}
//# sourceMappingURL=HealthCheckService.d.ts.map