/**
 * Clinical EMR Service Configuration
 * Configuration management for the service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Configuration Pattern
 */
export declare class ClinicalEMRConfig {
    readonly port: number;
    readonly host: string;
    readonly environment: string;
    readonly serviceName: string;
    readonly serviceVersion: string;
    readonly supabaseUrl: string;
    readonly supabaseServiceRoleKey: string;
    readonly supabaseAnonKey: string;
    readonly databaseSchema: string;
    readonly jwtSecret: string;
    readonly jwtExpiresIn: string;
    readonly encryptionKey: string;
    readonly corsOrigins: string[];
    readonly logLevel: string;
    readonly logFormat: string;
    readonly enableAuditLogging: boolean;
    readonly auditLogRetentionDays: number;
    readonly connectionPoolMin: number;
    readonly connectionPoolMax: number;
    readonly queryTimeoutMs: number;
    readonly cacheEnabled: boolean;
    readonly cacheTtlSeconds: number;
    readonly maxRecordsPerPatient: number;
    readonly maxRecordsPerDoctor: number;
    readonly recordRetentionYears: number;
    readonly enableVitalSignsValidation: boolean;
    readonly enableDiagnosisValidation: boolean;
    readonly apiGatewayUrl: string;
    readonly patientServiceUrl: string;
    readonly doctorServiceUrl: string;
    readonly appointmentServiceUrl: string;
    readonly notificationServiceUrl: string;
    readonly enableMetrics: boolean;
    readonly metricsPort: number;
    readonly healthCheckInterval: number;
    readonly enablePerformanceMonitoring: boolean;
    readonly enableAdvancedSearch: boolean;
    readonly enableRealTimeUpdates: boolean;
    readonly enableFileAttachments: boolean;
    readonly enableAuditTrail: boolean;
    readonly enableDataEncryption: boolean;
    constructor();
    /**
     * Validate required configuration values
     */
    private validateConfiguration;
    /**
     * Get database connection configuration
     */
    getDatabaseConfig(): {
        url: string;
        serviceRoleKey: string;
        schema: string;
        poolConfig: {
            min: number;
            max: number;
            acquireTimeoutMillis: number;
            createTimeoutMillis: number;
            destroyTimeoutMillis: number;
            idleTimeoutMillis: number;
            reapIntervalMillis: number;
            createRetryIntervalMillis: number;
        };
    };
    /**
     * Get security configuration
     */
    getSecurityConfig(): {
        jwtSecret: string;
        jwtExpiresIn: string;
        encryptionKey: string;
        corsOrigins: string[];
        enableDataEncryption: boolean;
    };
    /**
     * Get logging configuration
     */
    getLoggingConfig(): {
        level: string;
        format: string;
        enableAuditLogging: boolean;
        auditLogRetentionDays: number;
    };
    /**
     * Get performance configuration
     */
    getPerformanceConfig(): {
        connectionPool: {
            min: number;
            max: number;
        };
        queryTimeoutMs: number;
        cache: {
            enabled: boolean;
            ttlSeconds: number;
        };
        enablePerformanceMonitoring: boolean;
    };
    /**
     * Get business rules configuration
     */
    getBusinessRulesConfig(): {
        maxRecordsPerPatient: number;
        maxRecordsPerDoctor: number;
        recordRetentionYears: number;
        validation: {
            enableVitalSignsValidation: boolean;
            enableDiagnosisValidation: boolean;
        };
    };
    /**
     * Get feature flags
     */
    getFeatureFlags(): {
        enableAdvancedSearch: boolean;
        enableRealTimeUpdates: boolean;
        enableFileAttachments: boolean;
        enableAuditTrail: boolean;
        enableDataEncryption: boolean;
    };
    /**
     * Check if running in development mode
     */
    isDevelopment(): boolean;
    /**
     * Check if running in production mode
     */
    isProduction(): boolean;
    /**
     * Check if running in test mode
     */
    isTest(): boolean;
    /**
     * Get service information
     */
    getServiceInfo(): {
        name: string;
        version: string;
        environment: string;
        port: number;
        host: string;
    };
}
//# sourceMappingURL=clinical-emr-config.d.ts.map