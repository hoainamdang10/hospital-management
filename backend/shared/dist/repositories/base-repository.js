"use strict";
/**
 * Base Repository Pattern with Schema Validation
 * Enforces microservices architecture compliance and data boundaries
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Microservices Architecture, FHIR
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const schema_mapping_1 = require("../config/schema-mapping");
const schema_aware_connection_pool_1 = require("../database/schema-aware-connection-pool");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Abstract base repository class that enforces architecture compliance
 */
class BaseRepository {
    constructor(config) {
        this.connectionPool = (0, schema_aware_connection_pool_1.getConnectionPool)();
        this.config = config;
        this.allowedTables = (0, schema_mapping_1.getAllowedTablesForService)(config.serviceName);
        // Validate service configuration
        this.validateServiceConfiguration();
    }
    /**
     * Validate that the service is properly configured
     */
    validateServiceConfiguration() {
        if (!this.config.serviceName) {
            throw new Error("Service name is required for repository configuration");
        }
        if (!this.config.schemaName) {
            throw new Error("Schema name is required for repository configuration");
        }
        if (this.allowedTables.length === 0) {
            logger_1.default.warn(`No allowed tables configured for service: ${this.config.serviceName}`);
        }
        logger_1.default.debug("Repository configured successfully", {
            serviceName: this.config.serviceName,
            schemaName: this.config.schemaName,
            allowedTables: this.allowedTables.length,
        });
    }
    /**
     * Validate table access before executing queries
     */
    validateTableAccess(tableName) {
        if (!(0, schema_mapping_1.validateTableAccess)(this.config.serviceName, tableName)) {
            const error = new Error(`❌ Schema violation: Service '${this.config.serviceName}' không được phép truy cập bảng '${tableName}'. ` +
                `Allowed tables: ${this.allowedTables.join(", ")}`);
            // Log security violation
            logger_1.default.error("🚨 Schema Access Violation Detected", {
                serviceName: this.config.serviceName,
                attemptedTable: tableName,
                allowedTables: this.allowedTables,
                timestamp: new Date().toISOString(),
                severity: "CRITICAL",
            });
            // Audit the violation
            this.auditSecurityViolation(tableName);
            throw error;
        }
    }
    /**
     * Get a schema-aware database connection
     */
    async getConnection() {
        return this.connectionPool.getConnection(this.config.serviceName);
    }
    /**
     * Execute query with full compliance validation
     */
    async executeQuery(tableName, queryFn, options) {
        // Validate table access
        this.validateTableAccess(tableName);
        const startTime = Date.now();
        try {
            let result;
            if (this.config.enableFHIRValidation) {
                // Execute with FHIR compliance validation
                result = await this.connectionPool.executeFHIRValidation(this.config.serviceName, queryFn);
            }
            else {
                // Execute with standard connection
                const client = await this.getConnection();
                result = await queryFn(client);
            }
            const executionTime = Date.now() - startTime;
            // Performance monitoring
            if (this.config.enablePerformanceMonitoring) {
                this.recordQueryMetrics({
                    queryType: options.operation,
                    tableName,
                    executionTime,
                    recordsAffected: this.extractRecordCount(result),
                });
            }
            // Audit logging for HIPAA compliance
            if (this.config.enableAuditLogging) {
                await this.auditDataAccess({
                    serviceName: this.config.serviceName,
                    operation: options.operation,
                    tableName,
                    recordId: options.recordId,
                    userId: options.userId,
                    timestamp: new Date(),
                    dataAccessed: options.auditData,
                    complianceFlags: this.generateComplianceFlags(tableName, options.operation),
                });
            }
            return result;
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            // Log error with context
            logger_1.default.error("Database query failed", {
                serviceName: this.config.serviceName,
                tableName,
                operation: options.operation,
                executionTime,
                error: error?.message || "Unknown error",
            });
            // Audit failed access attempt
            if (this.config.enableAuditLogging) {
                await this.auditDataAccess({
                    serviceName: this.config.serviceName,
                    operation: `FAILED_${options.operation}`,
                    tableName,
                    recordId: options.recordId,
                    userId: options.userId,
                    timestamp: new Date(),
                    complianceFlags: ["QUERY_FAILED", "SECURITY_REVIEW_REQUIRED"],
                });
            }
            throw error;
        }
    }
    /**
     * Execute FHIR-compliant query for healthcare data
     */
    async executeFHIRQuery(tableName, queryFn, fhirContext) {
        // Enhanced validation for healthcare data
        this.validateHealthcareDataAccess(tableName, fhirContext);
        return this.executeQuery(tableName, queryFn, {
            operation: `FHIR_${fhirContext.resourceType}`,
            recordId: fhirContext.patientId,
            userId: fhirContext.providerId,
            auditData: [
                `resourceType:${fhirContext.resourceType}`,
                `accessReason:${fhirContext.accessReason}`,
            ],
        });
    }
    /**
     * Validate healthcare data access for HIPAA compliance
     */
    validateHealthcareDataAccess(tableName, fhirContext) {
        const healthcareTables = [
            "patient_profiles",
            "medical_records",
            "prescriptions",
            "lab_results",
            "appointments",
            "doctor_profiles",
        ];
        if (healthcareTables.includes(tableName)) {
            if (!fhirContext.accessReason) {
                throw new Error("Access reason required for healthcare data access (HIPAA compliance)");
            }
            if (tableName.includes("patient") && !fhirContext.patientId) {
                throw new Error("Patient ID required for patient data access");
            }
        }
    }
    /**
     * Record query performance metrics
     */
    recordQueryMetrics(metrics) {
        logger_1.default.debug("Query performance metrics", {
            serviceName: this.config.serviceName,
            ...metrics,
        });
        // Send to monitoring system (Prometheus, etc.)
        // Implementation depends on monitoring setup
    }
    /**
     * Audit data access for compliance
     */
    async auditDataAccess(entry) {
        try {
            // Store audit log in dedicated audit schema/table
            const auditClient = await this.getConnection();
            await auditClient.from("audit_logs").insert({
                service_name: entry.serviceName,
                operation: entry.operation,
                table_name: entry.tableName,
                record_id: entry.recordId,
                user_id: entry.userId,
                timestamp: entry.timestamp.toISOString(),
                ip_address: entry.ipAddress,
                user_agent: entry.userAgent,
                data_accessed: entry.dataAccessed,
                compliance_flags: entry.complianceFlags,
                audit_id: `${entry.serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            });
        }
        catch (error) {
            // Audit logging failure is critical for compliance
            logger_1.default.error("❌ CRITICAL: Audit logging failed", {
                serviceName: this.config.serviceName,
                auditEntry: entry,
                error: error?.message || "Unknown error",
                severity: "CRITICAL",
                complianceImpact: "HIGH",
            });
            // Don't throw error to avoid breaking business operations
            // But ensure this is monitored and alerted
        }
    }
    /**
     * Audit security violations
     */
    async auditSecurityViolation(attemptedTable) {
        await this.auditDataAccess({
            serviceName: this.config.serviceName,
            operation: "SECURITY_VIOLATION",
            tableName: attemptedTable,
            timestamp: new Date(),
            complianceFlags: [
                "SCHEMA_VIOLATION",
                "UNAUTHORIZED_ACCESS_ATTEMPT",
                "IMMEDIATE_REVIEW_REQUIRED",
            ],
        });
    }
    /**
     * Generate compliance flags based on operation and table
     */
    generateComplianceFlags(tableName, operation) {
        const flags = [];
        // Healthcare data flags
        if (["patient_profiles", "medical_records", "prescriptions"].includes(tableName)) {
            flags.push("PHI_ACCESS", "HIPAA_REGULATED");
        }
        // Sensitive operations
        if (["DELETE", "UPDATE"].includes(operation.toUpperCase())) {
            flags.push("DATA_MODIFICATION");
        }
        // Bulk operations
        if (operation.includes("BULK")) {
            flags.push("BULK_OPERATION", "ENHANCED_MONITORING");
        }
        return flags;
    }
    /**
     * Extract record count from query result
     */
    extractRecordCount(result) {
        if (Array.isArray(result)) {
            return result.length;
        }
        if (result && typeof result === "object") {
            if ("count" in result)
                return result.count;
            if ("data" in result && Array.isArray(result.data))
                return result.data.length;
        }
        return 1; // Single record operation
    }
    /**
     * Health check for repository
     */
    async healthCheck() {
        try {
            const poolHealth = await this.connectionPool.healthCheck();
            return {
                status: "healthy",
                serviceName: this.config.serviceName,
                schemaName: this.config.schemaName,
                allowedTables: this.allowedTables,
                connectionPool: poolHealth,
            };
        }
        catch (error) {
            return {
                status: "unhealthy",
                serviceName: this.config.serviceName,
                schemaName: this.config.schemaName,
                allowedTables: this.allowedTables,
                connectionPool: { error: error?.message || "Unknown error" },
            };
        }
    }
}
exports.BaseRepository = BaseRepository;
exports.default = BaseRepository;
//# sourceMappingURL=base-repository.js.map