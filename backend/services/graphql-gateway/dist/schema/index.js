"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaInfo = exports.typeDefs = void 0;
const graphql_tag_1 = require("graphql-tag");
const appointment_schema_1 = __importDefault(require("./appointment.schema"));
const department_schema_1 = __importDefault(require("./department.schema"));
const doctor_schema_1 = __importDefault(require("./doctor.schema"));
const medical_record_schema_1 = __importDefault(require("./medical-record.schema"));
const patient_schema_1 = __importDefault(require("./patient.schema"));
/**
 * Base GraphQL Schema with root types and common scalars
 * Hospital Management System GraphQL Gateway
 */
const baseTypeDefs = (0, graphql_tag_1.gql) `
  # Custom Scalar Types for Vietnamese Hospital System
  scalar Date
  scalar DateTime
  scalar Time
  scalar PhoneNumber
  scalar LicenseNumber
  scalar DoctorID
  scalar PatientID
  scalar AppointmentID
  scalar DepartmentID
  scalar UUID
  scalar BloodType
  scalar Height
  scalar Weight

  # Common Enums
  enum Gender {
    MALE
    FEMALE
    OTHER
  }

  enum SortOrder {
    ASC
    DESC
  }

  enum AppointmentStatus {
    SCHEDULED
    CONFIRMED
    IN_PROGRESS
    COMPLETED
    CANCELLED
    NO_SHOW
  }

  # Base Query Type
  type Query {
    # Health check
    health: HealthCheck!

    # System information
    systemInfo: SystemInfo!

    # Search across all entities
    globalSearch(
      query: String!
      types: [SearchType!]
      limit: Int = 20
    ): SearchResults!
  }

  # Base Mutation Type
  type Mutation {
    # Placeholder for mutations
    _empty: String
  }

  # Base Subscription Type
  type Subscription {
    # System notifications
    systemNotification: SystemNotification!

    # Global updates
    globalUpdate: GlobalUpdate!
  }

  # Health Check
  type HealthCheck {
    status: String!
    timestamp: DateTime!
    version: String!
    services: [ServiceHealth!]!
    database: DatabaseHealth!
    uptime: Int!
  }

  type ServiceHealth {
    name: String!
    status: String!
    url: String
    responseTime: Int
    lastCheck: DateTime!
  }

  type DatabaseHealth {
    status: String!
    connectionCount: Int
    responseTime: Int
    lastCheck: DateTime!
  }

  # System Information
  type SystemInfo {
    name: String!
    version: String!
    environment: String!
    graphqlVersion: String!
    apolloVersion: String!
    nodeVersion: String!
    uptime: Int!
    memoryUsage: MemoryUsage!
    features: [String!]!
  }

  type MemoryUsage {
    used: Float!
    total: Float!
    percentage: Float!
  }

  # Global Search
  enum SearchType {
    DOCTOR
    PATIENT
    APPOINTMENT
    DEPARTMENT
    MEDICAL_RECORD
  }

  type SearchResults {
    doctors: [Doctor!]!
    patients: [Patient!]!
    appointments: [Appointment!]!
    departments: [Department!]!
    medicalRecords: [MedicalRecord!]!
    totalCount: Int!
  }

  # System Notifications
  type SystemNotification {
    id: UUID!
    type: NotificationType!
    title: String!
    message: String!
    data: String # JSON string
    created_at: DateTime!
  }

  enum NotificationType {
    APPOINTMENT_REMINDER
    APPOINTMENT_CANCELLED
    APPOINTMENT_CONFIRMED
    DOCTOR_AVAILABILITY_CHANGED
    PATIENT_CHECKED_IN
    EMERGENCY_ALERT
    SYSTEM_MAINTENANCE
    PAYMENT_RECEIVED
    PRESCRIPTION_READY
  }

  # Global Updates
  type GlobalUpdate {
    type: UpdateType!
    entityType: String!
    entityId: String!
    action: String!
    data: String # JSON string
    timestamp: DateTime!
  }

  enum UpdateType {
    CREATE
    UPDATE
    DELETE
    STATUS_CHANGE
  }

  # Error Types
  type GraphQLError {
    message: String!
    code: String
    path: [String!]
    extensions: ErrorExtensions
  }

  type ErrorExtensions {
    code: String
    exception: ExceptionDetails
    vietnamese: String
  }

  type ExceptionDetails {
    stacktrace: [String!]
    message: String
  }

  # Pagination (already defined in other schemas, but included for completeness)
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  # Common Response Types
  interface Node {
    id: UUID!
  }

  interface Timestamped {
    created_at: DateTime!
    updated_at: DateTime!
  }

  # Vietnamese Language Support
  type VietnameseText {
    vi: String!
    en: String
  }

  # File Upload
  scalar Upload

  type File {
    id: UUID!
    filename: String!
    mimetype: String!
    encoding: String!
    size: Int!
    url: String!
    uploaded_at: DateTime!
  }

  # Audit Log
  type AuditLog {
    id: UUID!
    entityType: String!
    entityId: String!
    action: String!
    oldValues: String # JSON
    newValues: String # JSON
    userId: String
    userType: String
    ipAddress: String
    userAgent: String
    timestamp: DateTime!
  }

  # Rate Limiting Info
  type RateLimitInfo {
    limit: Int!
    remaining: Int!
    resetTime: DateTime!
  }

  # API Usage Statistics
  type ApiUsageStats {
    totalRequests: Int!
    successfulRequests: Int!
    errorRequests: Int!
    averageResponseTime: Float!
    topQueries: [QueryStats!]!
    topMutations: [MutationStats!]!
  }

  type QueryStats {
    name: String!
    count: Int!
    averageTime: Float!
  }

  type MutationStats {
    name: String!
    count: Int!
    averageTime: Float!
  }

  # Directives
  directive @auth(requires: [Role!]) on FIELD_DEFINITION | OBJECT
  directive @rateLimit(max: Int!, window: Int!) on FIELD_DEFINITION
  directive @deprecated(reason: String) on FIELD_DEFINITION | ENUM_VALUE
  directive @vietnamese(text: String!) on FIELD_DEFINITION

  enum Role {
    ADMIN
    DOCTOR
    PATIENT
    RECEPTIONIST
  }
`;
/**
 * Combined GraphQL Schema
 * Merges all entity schemas with base schema
 */
exports.typeDefs = [
    baseTypeDefs,
    doctor_schema_1.default,
    patient_schema_1.default,
    appointment_schema_1.default,
    department_schema_1.default,
    medical_record_schema_1.default, // ✅ Schema conflicts resolved
];
/**
 * Schema validation and documentation
 */
exports.schemaInfo = {
    version: "1.0.0",
    description: "Hospital Management System GraphQL Schema",
    entities: [
        {
            name: "Doctor",
            description: "Bác sĩ - Medical doctors in the hospital system",
            fields: 25,
            queries: 8,
            mutations: 12,
            subscriptions: 5,
        },
        {
            name: "Patient",
            description: "Bệnh nhân - Patients in the hospital system",
            fields: 22,
            queries: 7,
            mutations: 8,
            subscriptions: 4,
        },
        {
            name: "Appointment",
            description: "Lịch hẹn - Medical appointments",
            fields: 20,
            queries: 12,
            mutations: 15,
            subscriptions: 8,
        },
        {
            name: "Department",
            description: "Khoa - Hospital departments",
            fields: 18,
            queries: 6,
            mutations: 5,
            subscriptions: 3,
        },
        {
            name: "MedicalRecord",
            description: "Hồ sơ y tế - Patient medical records",
            fields: 15,
            queries: 2,
            mutations: 0,
            subscriptions: 1,
        },
        {
            name: "Prescription",
            description: "Đơn thuốc - Medical prescriptions",
            fields: 12,
            queries: 2,
            mutations: 0,
            subscriptions: 1,
        },
        {
            name: "Payment",
            description: "Thanh toán - Payment records",
            fields: 18,
            queries: 2,
            mutations: 0,
            subscriptions: 0,
        },
    ],
    features: [
        "Vietnamese language support",
        "Real-time subscriptions",
        "Comprehensive pagination",
        "Type-safe scalars",
        "Role-based authentication",
        "Rate limiting",
        "Audit logging",
        "File uploads",
        "Global search",
        "Error handling with Vietnamese messages",
    ],
    totalQueries: 39,
    totalMutations: 40,
    totalSubscriptions: 21,
    totalTypes: 45,
    totalEnums: 15,
    totalScalars: 12,
};
exports.default = exports.typeDefs;
//# sourceMappingURL=index.js.map