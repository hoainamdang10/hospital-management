/**
 * Schema Mapping Configuration for Hospital Management System
 * Defines which schema each microservice should connect to
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance HIPAA, Microservices Architecture
 */
export interface ServiceSchemaMapping {
    serviceName: string;
    schemaName: string;
    description: string;
    tables: string[];
    allowedCrossSchemaAccess?: string[];
}
/**
 * Complete mapping of services to their designated schemas
 * This ensures proper data isolation and service boundaries
 */
export declare const SERVICE_SCHEMA_MAPPING: Record<string, ServiceSchemaMapping>;
/**
 * Get schema name for a specific service
 */
export declare function getSchemaForService(serviceName: string): string;
/**
 * Validate if a service can access a specific table
 */
export declare function validateTableAccess(serviceName: string, tableName: string): boolean;
/**
 * Get all allowed tables for a service
 */
export declare function getAllowedTablesForService(serviceName: string): string[];
/**
 * Environment variable names for schema configuration
 */
export declare const SCHEMA_ENV_VARS: {
    readonly AUTH_SCHEMA: "AUTH_SCHEMA_NAME";
    readonly DOCTOR_SCHEMA: "DOCTOR_SCHEMA_NAME";
    readonly PATIENT_SCHEMA: "PATIENT_SCHEMA_NAME";
    readonly APPOINTMENT_SCHEMA: "APPOINTMENT_SCHEMA_NAME";
    readonly MEDICAL_RECORDS_SCHEMA: "MEDICAL_RECORDS_SCHEMA_NAME";
    readonly PAYMENT_SCHEMA: "PAYMENT_SCHEMA_NAME";
    readonly FILE_SCHEMA: "FILE_SCHEMA_NAME";
};
/**
 * Default schema names (fallback if env vars not set)
 */
export declare const DEFAULT_SCHEMA_NAMES: {
    readonly AUTH_SCHEMA_NAME: "auth_schema";
    readonly DOCTOR_SCHEMA_NAME: "doctor_schema";
    readonly PATIENT_SCHEMA_NAME: "patient_schema";
    readonly APPOINTMENT_SCHEMA_NAME: "appointment_schema";
    readonly MEDICAL_RECORDS_SCHEMA_NAME: "medical_records_schema";
    readonly PAYMENT_SCHEMA_NAME: "payment_schema";
    readonly FILE_SCHEMA_NAME: "file_schema";
};
//# sourceMappingURL=schema-mapping.d.ts.map