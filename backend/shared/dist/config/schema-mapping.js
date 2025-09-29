"use strict";
/**
 * Schema Mapping Configuration for Hospital Management System
 * Defines which schema each microservice should connect to
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance HIPAA, Microservices Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SCHEMA_NAMES = exports.SCHEMA_ENV_VARS = exports.SERVICE_SCHEMA_MAPPING = void 0;
exports.getSchemaForService = getSchemaForService;
exports.validateTableAccess = validateTableAccess;
exports.getAllowedTablesForService = getAllowedTablesForService;
/**
 * Complete mapping of services to their designated schemas
 * This ensures proper data isolation and service boundaries
 */
exports.SERVICE_SCHEMA_MAPPING = {
    'auth-service': {
        serviceName: 'auth-service',
        schemaName: 'auth_schema',
        description: 'Authentication and user management service',
        tables: ['profiles', 'user_sessions', 'user_permissions', 'audit_logs'],
        allowedCrossSchemaAccess: [] // Auth service should not access other schemas directly
    },
    'doctor-service': {
        serviceName: 'doctor-service',
        schemaName: 'doctor_schema',
        description: 'Doctor profiles and medical staff management',
        tables: ['doctor_profiles', 'doctor_schedules', 'doctor_specialties', 'doctor_experiences'],
        allowedCrossSchemaAccess: ['auth_schema.profiles'] // Only for user profile validation
    },
    'patient-service': {
        serviceName: 'patient-service',
        schemaName: 'patient_schema',
        description: 'Patient profiles and medical history management',
        tables: ['patient_profiles', 'patient_medical_history', 'patient_insurance', 'patient_emergency_contacts'],
        allowedCrossSchemaAccess: ['auth_schema.profiles'] // Only for user profile validation
    },
    'appointment-service': {
        serviceName: 'appointment-service',
        schemaName: 'appointment_schema',
        description: 'Appointment scheduling and management',
        tables: ['appointments', 'appointment_slots', 'appointment_history', 'appointment_reminders'],
        allowedCrossSchemaAccess: [] // Uses API Gateway for cross-service communication
    },
    'medical-records-service': {
        serviceName: 'medical-records-service',
        schemaName: 'medical_records_schema',
        description: 'Medical records and clinical data management',
        tables: ['medical_records', 'prescriptions', 'lab_results', 'medical_record_attachments'],
        allowedCrossSchemaAccess: [] // Uses API Gateway for cross-service communication
    },
    'payment-service': {
        serviceName: 'payment-service',
        schemaName: 'payment_schema',
        description: 'Payment processing and billing management',
        tables: ['payments', 'billing', 'invoices', 'payment_methods'],
        allowedCrossSchemaAccess: [] // Uses API Gateway for cross-service communication
    },
    'file-service': {
        serviceName: 'file-service',
        schemaName: 'file_schema',
        description: 'File storage and document management',
        tables: ['documents', 'file_metadata', 'file_permissions', 'file_versions'],
        allowedCrossSchemaAccess: [] // Uses API Gateway for cross-service communication
    },
    'receptionist-service': {
        serviceName: 'receptionist-service',
        schemaName: 'auth_schema', // Shared with auth service
        description: 'Receptionist operations and front desk management',
        tables: ['profiles'], // Uses shared auth schema
        allowedCrossSchemaAccess: ['appointment_schema.appointments'] // Limited access for scheduling
    },
    'department-service': {
        serviceName: 'department-service',
        schemaName: 'auth_schema', // Shared with auth service for organizational data
        description: 'Department and organizational structure management',
        tables: ['departments', 'specialties', 'rooms'], // Organizational data in auth schema
        allowedCrossSchemaAccess: []
    },
    'notification-service': {
        serviceName: 'notification-service',
        schemaName: 'file_schema', // Shared with file service for notification templates
        description: 'Notification and communication management',
        tables: ['notifications', 'notification_templates', 'notification_logs'],
        allowedCrossSchemaAccess: [] // Uses API Gateway for cross-service communication
    },
    'api-gateway': {
        serviceName: 'api-gateway',
        schemaName: 'none', // API Gateway should not have direct database access
        description: 'API Gateway for routing and authentication',
        tables: [],
        allowedCrossSchemaAccess: []
    }
};
/**
 * Get schema name for a specific service
 */
function getSchemaForService(serviceName) {
    const mapping = exports.SERVICE_SCHEMA_MAPPING[serviceName];
    if (!mapping) {
        throw new Error(`Schema mapping not found for service: ${serviceName}`);
    }
    return mapping.schemaName;
}
/**
 * Validate if a service can access a specific table
 */
function validateTableAccess(serviceName, tableName) {
    const mapping = exports.SERVICE_SCHEMA_MAPPING[serviceName];
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
function getAllowedTablesForService(serviceName) {
    const mapping = exports.SERVICE_SCHEMA_MAPPING[serviceName];
    if (!mapping) {
        return [];
    }
    return [
        ...mapping.tables,
        ...(mapping.allowedCrossSchemaAccess || [])
    ];
}
/**
 * Environment variable names for schema configuration
 */
exports.SCHEMA_ENV_VARS = {
    AUTH_SCHEMA: 'AUTH_SCHEMA_NAME',
    DOCTOR_SCHEMA: 'DOCTOR_SCHEMA_NAME',
    PATIENT_SCHEMA: 'PATIENT_SCHEMA_NAME',
    APPOINTMENT_SCHEMA: 'APPOINTMENT_SCHEMA_NAME',
    MEDICAL_RECORDS_SCHEMA: 'MEDICAL_RECORDS_SCHEMA_NAME',
    PAYMENT_SCHEMA: 'PAYMENT_SCHEMA_NAME',
    FILE_SCHEMA: 'FILE_SCHEMA_NAME'
};
/**
 * Default schema names (fallback if env vars not set)
 */
exports.DEFAULT_SCHEMA_NAMES = {
    [exports.SCHEMA_ENV_VARS.AUTH_SCHEMA]: 'auth_schema',
    [exports.SCHEMA_ENV_VARS.DOCTOR_SCHEMA]: 'doctor_schema',
    [exports.SCHEMA_ENV_VARS.PATIENT_SCHEMA]: 'patient_schema',
    [exports.SCHEMA_ENV_VARS.APPOINTMENT_SCHEMA]: 'appointment_schema',
    [exports.SCHEMA_ENV_VARS.MEDICAL_RECORDS_SCHEMA]: 'medical_records_schema',
    [exports.SCHEMA_ENV_VARS.PAYMENT_SCHEMA]: 'payment_schema',
    [exports.SCHEMA_ENV_VARS.FILE_SCHEMA]: 'file_schema'
};
//# sourceMappingURL=schema-mapping.js.map