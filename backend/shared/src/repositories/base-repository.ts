/**
 * Base Repository Pattern with Schema Validation
 * Enforces microservices architecture compliance and data boundaries
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Microservices Architecture, FHIR
 */

import { SupabaseClient } from "@supabase/supabase-js";
import {
  getAllowedTablesForService,
  validateTableAccess,
} from "../config/schema-mapping";
import { getConnectionPool } from "../database/schema-aware-connection-pool";
import logger from "../utils/logger";

export interface RepositoryConfig {
  serviceName: string;
  schemaName: string;
  enableFHIRValidation: boolean;
  enableAuditLogging: boolean;
  enablePerformanceMonitoring: boolean;
}

export interface QueryMetrics {
  queryType: string;
  tableName: string;
  executionTime: number;
  recordsAffected: number;
  cacheHit?: boolean;
}

export interface AuditLogEntry {
  serviceName: string;
  operation: string;
  tableName: string;
  recordId?: string;
  userId?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  dataAccessed?: string[];
  complianceFlags?: string[];
}

/**
 * Abstract base repository class that enforces architecture compliance
 */
export abstract class BaseRepository<T> {
  protected config: RepositoryConfig;
  protected connectionPool = getConnectionPool();
  protected allowedTables: string[];

  constructor(config: RepositoryConfig) {
    this.config = config;
    this.allowedTables = getAllowedTablesForService(config.serviceName);

    // Validate service configuration
    this.validateServiceConfiguration();
  }

  /**
   * Validate that the service is properly configured
   */
  private validateServiceConfiguration(): void {
    if (!this.config.serviceName) {
      throw new Error("Service name is required for repository configuration");
    }

    if (!this.config.schemaName) {
      throw new Error("Schema name is required for repository configuration");
    }

    if (this.allowedTables.length === 0) {
      logger.warn(
        `No allowed tables configured for service: ${this.config.serviceName}`
      );
    }

    logger.debug("Repository configured successfully", {
      serviceName: this.config.serviceName,
      schemaName: this.config.schemaName,
      allowedTables: this.allowedTables.length,
    });
  }

  /**
   * Validate table access before executing queries
   */
  protected validateTableAccess(tableName: string): void {
    if (!validateTableAccess(this.config.serviceName, tableName)) {
      const error = new Error(
        `❌ Schema violation: Service '${this.config.serviceName}' không được phép truy cập bảng '${tableName}'. ` +
          `Allowed tables: ${this.allowedTables.join(", ")}`
      );

      // Log security violation
      logger.error("🚨 Schema Access Violation Detected", {
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
  protected async getConnection(): Promise<SupabaseClient<any, string, any>> {
    return this.connectionPool.getConnection(this.config.serviceName);
  }

  /**
   * Execute query with full compliance validation
   */
  protected async executeQuery<R>(
    tableName: string,
    queryFn: (client: SupabaseClient<any, string, any>) => Promise<R>,
    options: {
      operation: string;
      recordId?: string;
      userId?: string;
      auditData?: string[];
    }
  ): Promise<R> {
    // Validate table access
    this.validateTableAccess(tableName);

    const startTime = Date.now();

    try {
      let result: R;

      if (this.config.enableFHIRValidation) {
        // Execute with FHIR compliance validation
        result = await this.connectionPool.executeFHIRValidation(
          this.config.serviceName,
          queryFn
        );
      } else {
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
          complianceFlags: this.generateComplianceFlags(
            tableName,
            options.operation
          ),
        });
      }

      return result;
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      // Log error with context
      logger.error("Database query failed", {
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
  protected async executeFHIRQuery<R>(
    tableName: string,
    queryFn: (client: SupabaseClient<any, string, any>) => Promise<R>,
    fhirContext: {
      resourceType: string;
      patientId?: string;
      providerId?: string;
      accessReason: string;
    }
  ): Promise<R> {
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
  private validateHealthcareDataAccess(
    tableName: string,
    fhirContext: any
  ): void {
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
        throw new Error(
          "Access reason required for healthcare data access (HIPAA compliance)"
        );
      }

      if (tableName.includes("patient") && !fhirContext.patientId) {
        throw new Error("Patient ID required for patient data access");
      }
    }
  }

  /**
   * Record query performance metrics
   */
  private recordQueryMetrics(metrics: QueryMetrics): void {
    logger.debug("Query performance metrics", {
      serviceName: this.config.serviceName,
      ...metrics,
    });

    // Send to monitoring system (Prometheus, etc.)
    // Implementation depends on monitoring setup
  }

  /**
   * Audit data access for compliance
   */
  private async auditDataAccess(entry: AuditLogEntry): Promise<void> {
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
    } catch (error: any) {
      // Audit logging failure is critical for compliance
      logger.error("❌ CRITICAL: Audit logging failed", {
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
  private async auditSecurityViolation(attemptedTable: string): Promise<void> {
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
  private generateComplianceFlags(
    tableName: string,
    operation: string
  ): string[] {
    const flags: string[] = [];

    // Healthcare data flags
    if (
      ["patient_profiles", "medical_records", "prescriptions"].includes(
        tableName
      )
    ) {
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
  private extractRecordCount(result: any): number {
    if (Array.isArray(result)) {
      return result.length;
    }

    if (result && typeof result === "object") {
      if ("count" in result) return result.count;
      if ("data" in result && Array.isArray(result.data))
        return result.data.length;
    }

    return 1; // Single record operation
  }

  /**
   * Abstract methods that must be implemented by concrete repositories
   */
  abstract findById(id: string): Promise<T | null>;
  abstract findAll(limit?: number, offset?: number): Promise<T[]>;
  abstract create(entity: Partial<T>): Promise<T>;
  abstract update(id: string, entity: Partial<T>): Promise<T | null>;
  abstract delete(id: string): Promise<boolean>;

  /**
   * Health check for repository
   */
  async healthCheck(): Promise<{
    status: string;
    serviceName: string;
    schemaName: string;
    allowedTables: string[];
    connectionPool: any;
  }> {
    try {
      const poolHealth = await this.connectionPool.healthCheck();

      return {
        status: "healthy",
        serviceName: this.config.serviceName,
        schemaName: this.config.schemaName,
        allowedTables: this.allowedTables,
        connectionPool: poolHealth,
      };
    } catch (error: any) {
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

export default BaseRepository;
