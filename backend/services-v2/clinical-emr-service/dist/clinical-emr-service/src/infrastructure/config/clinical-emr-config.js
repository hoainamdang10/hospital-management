"use strict";
/**
 * Clinical EMR Service Configuration
 * Configuration management for the service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Configuration Pattern
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalEMRConfig = void 0;
const inversify_1 = require("inversify");
let ClinicalEMRConfig = class ClinicalEMRConfig {
    constructor() {
        // =====================================================
        // SERVER CONFIGURATION
        // =====================================================
        this.port = parseInt(process.env.CLINICAL_EMR_PORT || '3027', 10);
        this.host = process.env.CLINICAL_EMR_HOST || '0.0.0.0';
        this.environment = process.env.NODE_ENV || 'development';
        this.serviceName = 'clinical-emr-service';
        this.serviceVersion = process.env.SERVICE_VERSION || '2.0.0';
        // =====================================================
        // DATABASE CONFIGURATION
        // =====================================================
        this.supabaseUrl = process.env.SUPABASE_URL || '';
        this.supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        this.supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
        this.databaseSchema = 'clinical_schema';
        // =====================================================
        // SECURITY CONFIGURATION
        // =====================================================
        this.jwtSecret = process.env.JWT_SECRET || '';
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
        this.encryptionKey = process.env.ENCRYPTION_KEY || '';
        this.corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
        // =====================================================
        // LOGGING CONFIGURATION
        // =====================================================
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.logFormat = process.env.LOG_FORMAT || 'json';
        this.enableAuditLogging = process.env.ENABLE_AUDIT_LOGGING === 'true';
        this.auditLogRetentionDays = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '365', 10);
        // =====================================================
        // PERFORMANCE CONFIGURATION
        // =====================================================
        this.connectionPoolMin = parseInt(process.env.DB_POOL_MIN || '2', 10);
        this.connectionPoolMax = parseInt(process.env.DB_POOL_MAX || '10', 10);
        this.queryTimeoutMs = parseInt(process.env.QUERY_TIMEOUT_MS || '30000', 10);
        this.cacheEnabled = process.env.CACHE_ENABLED === 'true';
        this.cacheTtlSeconds = parseInt(process.env.CACHE_TTL_SECONDS || '300', 10);
        // =====================================================
        // BUSINESS RULES CONFIGURATION
        // =====================================================
        this.maxRecordsPerPatient = parseInt(process.env.MAX_RECORDS_PER_PATIENT || '1000', 10);
        this.maxRecordsPerDoctor = parseInt(process.env.MAX_RECORDS_PER_DOCTOR || '10000', 10);
        this.recordRetentionYears = parseInt(process.env.RECORD_RETENTION_YEARS || '7', 10);
        this.enableVitalSignsValidation = process.env.ENABLE_VITAL_SIGNS_VALIDATION !== 'false';
        this.enableDiagnosisValidation = process.env.ENABLE_DIAGNOSIS_VALIDATION !== 'false';
        // =====================================================
        // INTEGRATION CONFIGURATION
        // =====================================================
        this.apiGatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:3100';
        this.patientServiceUrl = process.env.PATIENT_SERVICE_URL || 'http://localhost:3003';
        this.doctorServiceUrl = process.env.DOCTOR_SERVICE_URL || 'http://localhost:3002';
        this.appointmentServiceUrl = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3004';
        this.notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3011';
        // =====================================================
        // MONITORING CONFIGURATION
        // =====================================================
        this.enableMetrics = process.env.ENABLE_METRICS === 'true';
        this.metricsPort = parseInt(process.env.METRICS_PORT || '9090', 10);
        this.healthCheckInterval = parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10);
        this.enablePerformanceMonitoring = process.env.ENABLE_PERFORMANCE_MONITORING === 'true';
        // =====================================================
        // FEATURE FLAGS
        // =====================================================
        this.enableAdvancedSearch = process.env.ENABLE_ADVANCED_SEARCH === 'true';
        this.enableRealTimeUpdates = process.env.ENABLE_REAL_TIME_UPDATES === 'true';
        this.enableFileAttachments = process.env.ENABLE_FILE_ATTACHMENTS === 'true';
        this.enableAuditTrail = process.env.ENABLE_AUDIT_TRAIL !== 'false';
        this.enableDataEncryption = process.env.ENABLE_DATA_ENCRYPTION === 'true';
        // Validate required configuration
        this.validateConfiguration();
    }
    /**
     * Validate required configuration values
     */
    validateConfiguration() {
        const requiredFields = [
            { name: 'SUPABASE_URL', value: this.supabaseUrl },
            { name: 'SUPABASE_SERVICE_ROLE_KEY', value: this.supabaseServiceRoleKey },
            { name: 'JWT_SECRET', value: this.jwtSecret }
        ];
        const missingFields = requiredFields.filter(field => !field.value);
        if (missingFields.length > 0) {
            const missingFieldNames = missingFields.map(field => field.name).join(', ');
            throw new Error(`Missing required configuration: ${missingFieldNames}`);
        }
        // Validate port ranges
        if (this.port < 1000 || this.port > 65535) {
            throw new Error(`Invalid port configuration: ${this.port}. Must be between 1000 and 65535.`);
        }
        if (this.metricsPort < 1000 || this.metricsPort > 65535) {
            throw new Error(`Invalid metrics port configuration: ${this.metricsPort}. Must be between 1000 and 65535.`);
        }
        // Validate pool configuration
        if (this.connectionPoolMin < 1 || this.connectionPoolMin > this.connectionPoolMax) {
            throw new Error(`Invalid connection pool configuration: min=${this.connectionPoolMin}, max=${this.connectionPoolMax}`);
        }
        // Validate business rules
        if (this.maxRecordsPerPatient < 1 || this.maxRecordsPerPatient > 100000) {
            throw new Error(`Invalid max records per patient: ${this.maxRecordsPerPatient}. Must be between 1 and 100000.`);
        }
        if (this.recordRetentionYears < 1 || this.recordRetentionYears > 100) {
            throw new Error(`Invalid record retention years: ${this.recordRetentionYears}. Must be between 1 and 100.`);
        }
    }
    /**
     * Get database connection configuration
     */
    getDatabaseConfig() {
        return {
            url: this.supabaseUrl,
            serviceRoleKey: this.supabaseServiceRoleKey,
            schema: this.databaseSchema,
            poolConfig: {
                min: this.connectionPoolMin,
                max: this.connectionPoolMax,
                acquireTimeoutMillis: this.queryTimeoutMs,
                createTimeoutMillis: this.queryTimeoutMs,
                destroyTimeoutMillis: 5000,
                idleTimeoutMillis: 30000,
                reapIntervalMillis: 1000,
                createRetryIntervalMillis: 200
            }
        };
    }
    /**
     * Get security configuration
     */
    getSecurityConfig() {
        return {
            jwtSecret: this.jwtSecret,
            jwtExpiresIn: this.jwtExpiresIn,
            encryptionKey: this.encryptionKey,
            corsOrigins: this.corsOrigins,
            enableDataEncryption: this.enableDataEncryption
        };
    }
    /**
     * Get logging configuration
     */
    getLoggingConfig() {
        return {
            level: this.logLevel,
            format: this.logFormat,
            enableAuditLogging: this.enableAuditLogging,
            auditLogRetentionDays: this.auditLogRetentionDays
        };
    }
    /**
     * Get performance configuration
     */
    getPerformanceConfig() {
        return {
            connectionPool: {
                min: this.connectionPoolMin,
                max: this.connectionPoolMax
            },
            queryTimeoutMs: this.queryTimeoutMs,
            cache: {
                enabled: this.cacheEnabled,
                ttlSeconds: this.cacheTtlSeconds
            },
            enablePerformanceMonitoring: this.enablePerformanceMonitoring
        };
    }
    /**
     * Get business rules configuration
     */
    getBusinessRulesConfig() {
        return {
            maxRecordsPerPatient: this.maxRecordsPerPatient,
            maxRecordsPerDoctor: this.maxRecordsPerDoctor,
            recordRetentionYears: this.recordRetentionYears,
            validation: {
                enableVitalSignsValidation: this.enableVitalSignsValidation,
                enableDiagnosisValidation: this.enableDiagnosisValidation
            }
        };
    }
    /**
     * Get feature flags
     */
    getFeatureFlags() {
        return {
            enableAdvancedSearch: this.enableAdvancedSearch,
            enableRealTimeUpdates: this.enableRealTimeUpdates,
            enableFileAttachments: this.enableFileAttachments,
            enableAuditTrail: this.enableAuditTrail,
            enableDataEncryption: this.enableDataEncryption
        };
    }
    /**
     * Check if running in development mode
     */
    isDevelopment() {
        return this.environment === 'development';
    }
    /**
     * Check if running in production mode
     */
    isProduction() {
        return this.environment === 'production';
    }
    /**
     * Check if running in test mode
     */
    isTest() {
        return this.environment === 'test' || this.environment === 'testing';
    }
    /**
     * Get service information
     */
    getServiceInfo() {
        return {
            name: this.serviceName,
            version: this.serviceVersion,
            environment: this.environment,
            port: this.port,
            host: this.host
        };
    }
};
exports.ClinicalEMRConfig = ClinicalEMRConfig;
exports.ClinicalEMRConfig = ClinicalEMRConfig = __decorate([
    (0, inversify_1.injectable)(),
    __metadata("design:paramtypes", [])
], ClinicalEMRConfig);
//# sourceMappingURL=clinical-emr-config.js.map