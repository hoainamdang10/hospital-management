/**
 * Configuration Validator
 * Validates environment variables and configuration
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
export interface AppConfig {
    nodeEnv: string;
    port: number;
    serviceName: string;
    supabase: {
        url: string;
        serviceRoleKey: string;
        jwtSecret: string;
    };
    services: {
        patientServiceUrl: string;
        providerServiceUrl: string;
        schedulerServiceUrl: string;
        schedulerApiKey: string;
        billingServiceUrl: string;
    };
    cors: {
        origin: string | string[];
    };
    rabbitmq: {
        url: string;
        exchange: string;
    };
    redis: {
        url: string;
        password?: string;
        db: number;
        keyPrefix: string;
    };
    cqrs: {
        enableReadModelSync: boolean;
        readModelSyncTimeout: number;
    };
    outbox: {
        pollIntervalMs: number;
        batchSize: number;
        baseDelayMs: number;
        maxDelayMs: number;
        reservedTimeoutMinutes: number;
    };
    tenantId: string;
    logging: {
        level: string;
        enableRequestLogging: boolean;
        enableErrorTracking: boolean;
    };
    healthCheck: {
        timeoutMs: number;
        enableDetailedCheck: boolean;
    };
}
/**
 * Validate and load configuration from environment variables
 */
export declare function loadConfig(): AppConfig;
/**
 * Get configuration summary for logging
 */
export declare function getConfigSummary(config: AppConfig): string;
//# sourceMappingURL=ConfigValidator.d.ts.map