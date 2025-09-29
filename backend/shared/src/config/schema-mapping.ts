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
export const SERVICE_SCHEMA_MAPPING: Record<string, ServiceSchemaMapping> = {
  "auth-service": {
    serviceName: "auth-service",
    schemaName: "auth_schema",
    description: "Authentication and user management service",
    tables: [
      "profiles",
      "admins",
      "status_values",
      "two_factor_auth",
      "two_factor_attempts",
      "phi_access_log",
      "security_audit_events",
      "hipaa_consents",
      "migration_log",
    ],
    allowedCrossSchemaAccess: [], // Auth service should not access other schemas directly
  },

  "doctor-service": {
    serviceName: "doctor-service",
    schemaName: "doctor_schema",
    description: "Doctor profiles and medical staff management",
    tables: [
      "doctor_profiles",
      "doctor_work_schedules",
      "doctor_work_experiences",
      "specialties",
      "doctor_emergency_contacts",
      "doctor_settings",
      "doctor_statistics",
    ],
    allowedCrossSchemaAccess: [], // ✅ FIXED: No cross-schema access - use events instead
  },

  "patient-service": {
    serviceName: "patient-service",
    schemaName: "patient_schema",
    description: "Patient profiles and medical history management",
    tables: [
      "patient_profiles",
      "patient_medical_history",
      "patient_insurance",
      "patient_emergency_contacts",
    ],
    allowedCrossSchemaAccess: [], // ✅ FIXED: No cross-schema access - use events instead
  },

  "appointment-service": {
    serviceName: "appointment-service",
    schemaName: "appointment_schema",
    description: "Appointment scheduling and management",
    tables: ["appointments", "appointment_time_slots", "rooms", "room_types"],
    allowedCrossSchemaAccess: [], // Uses API Gateway for cross-service communication
  },

  "medical-records-service": {
    serviceName: "medical-records-service",
    schemaName: "medical_records_schema",
    description: "Medical records and clinical data management",
    tables: ["medical_records", "lab_results", "vital_signs_history"],
    allowedCrossSchemaAccess: [], // Uses API Gateway for cross-service communication
  },

  "payment-service": {
    serviceName: "payment-service",
    schemaName: "payment_schema",
    description: "Payment processing and billing management",
    tables: ["payments", "payment_methods"],
    allowedCrossSchemaAccess: [], // Uses API Gateway for cross-service communication
  },

  "file-service": {
    serviceName: "file-service",
    schemaName: "file_schema",
    description: "File storage and document management",
    tables: ["documents", "notification_logs", "chat_conversations"],
    allowedCrossSchemaAccess: [], // Uses API Gateway for cross-service communication
  },

  "receptionist-service": {
    serviceName: "receptionist-service",
    schemaName: "auth_schema", // Shared with auth service
    description: "Receptionist operations and front desk management",
    tables: ["profiles"], // Uses shared auth schema
    allowedCrossSchemaAccess: [], // ✅ FIXED: No cross-schema access - use API Gateway instead
  },

  "department-service": {
    serviceName: "department-service",
    schemaName: "auth_schema", // Shared with auth service for organizational data
    description: "Department and organizational structure management",
    tables: ["departments", "specialties", "rooms"], // Organizational data in auth schema
    allowedCrossSchemaAccess: [],
  },

  "notification-service": {
    serviceName: "notification-service",
    schemaName: "file_schema", // Shared with file service for notification templates
    description: "Notification and communication management",
    tables: ["notification_logs"],
    allowedCrossSchemaAccess: [], // Uses API Gateway for cross-service communication
  },

  "api-gateway": {
    serviceName: "api-gateway",
    schemaName: "none", // API Gateway should not have direct database access
    description: "API Gateway for routing and authentication",
    tables: [],
    allowedCrossSchemaAccess: [],
  },

  // =====================================================
  // ADVANCED ARCHITECTURE PATTERNS SERVICES
  // =====================================================

  "event-sourcing-service": {
    serviceName: "event-sourcing-service",
    schemaName: "event_sourcing_schema",
    description: "Event sourcing and domain events management",
    tables: [
      "event_streams",
      "aggregate_snapshots",
      "saga_instances",
      "projection_checkpoints",
      "domain_event_types",
    ],
    allowedCrossSchemaAccess: [], // Event sourcing service manages events across all schemas
  },

  "read-model-service": {
    serviceName: "read-model-service",
    schemaName: "read_model_schema",
    description: "CQRS read models and optimized views",
    tables: [
      "patient_healthcare_view",
      "doctor_availability_view",
      "appointment_summary_view",
      "medical_records_summary_view",
      "healthcare_analytics_view",
    ],
    allowedCrossSchemaAccess: [], // Read models are populated via event projections
  },

  "admin-orchestrator": {
    serviceName: "admin-orchestrator",
    schemaName: "event_sourcing_schema", // Uses event sourcing for saga management
    description: "Admin orchestration and saga coordination",
    tables: ["saga_instances", "event_streams"],
    allowedCrossSchemaAccess: [], // Orchestrator communicates via events and API Gateway
  },
};

/**
 * Get schema name for a specific service
 */
export function getSchemaForService(serviceName: string): string {
  const mapping = SERVICE_SCHEMA_MAPPING[serviceName];
  if (!mapping) {
    throw new Error(`Schema mapping not found for service: ${serviceName}`);
  }
  return mapping.schemaName;
}

/**
 * Validate if a service can access a specific table
 */
export function validateTableAccess(
  serviceName: string,
  tableName: string
): boolean {
  const mapping = SERVICE_SCHEMA_MAPPING[serviceName];
  if (!mapping) {
    return false;
  }

  // Check if table is in service's own schema
  if (mapping.tables.includes(tableName)) {
    return true;
  }

  // Check if cross-schema access is allowed
  const fullTableName = `${mapping.schemaName}.${tableName}`;
  return mapping.allowedCrossSchemaAccess?.includes(fullTableName) || false;
}

/**
 * Get all allowed tables for a service
 */
export function getAllowedTablesForService(serviceName: string): string[] {
  const mapping = SERVICE_SCHEMA_MAPPING[serviceName];
  if (!mapping) {
    return [];
  }

  return [...mapping.tables, ...(mapping.allowedCrossSchemaAccess || [])];
}

/**
 * Environment variable names for schema configuration
 */
export const SCHEMA_ENV_VARS = {
  AUTH_SCHEMA: "AUTH_SCHEMA_NAME",
  DOCTOR_SCHEMA: "DOCTOR_SCHEMA_NAME",
  PATIENT_SCHEMA: "PATIENT_SCHEMA_NAME",
  APPOINTMENT_SCHEMA: "APPOINTMENT_SCHEMA_NAME",
  MEDICAL_RECORDS_SCHEMA: "MEDICAL_RECORDS_SCHEMA_NAME",
  PAYMENT_SCHEMA: "PAYMENT_SCHEMA_NAME",
  FILE_SCHEMA: "FILE_SCHEMA_NAME",
} as const;

/**
 * Default schema names (fallback if env vars not set)
 */
export const DEFAULT_SCHEMA_NAMES = {
  [SCHEMA_ENV_VARS.AUTH_SCHEMA]: "auth_schema",
  [SCHEMA_ENV_VARS.DOCTOR_SCHEMA]: "doctor_schema",
  [SCHEMA_ENV_VARS.PATIENT_SCHEMA]: "patient_schema",
  [SCHEMA_ENV_VARS.APPOINTMENT_SCHEMA]: "appointment_schema",
  [SCHEMA_ENV_VARS.MEDICAL_RECORDS_SCHEMA]: "medical_records_schema",
  [SCHEMA_ENV_VARS.PAYMENT_SCHEMA]: "payment_schema",
  [SCHEMA_ENV_VARS.FILE_SCHEMA]: "file_schema",
} as const;
