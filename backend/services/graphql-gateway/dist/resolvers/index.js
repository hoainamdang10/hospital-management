"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const graphql_1 = require("graphql");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const subscription_service_1 = require("../services/subscription.service");
const appointment_resolvers_1 = require("./appointment.resolvers");
const department_resolvers_1 = require("./department.resolvers");
const doctor_resolvers_1 = require("./doctor.resolvers");
const medical_records_resolvers_1 = require("./medical-records.resolvers");
const patient_resolvers_1 = require("./patient.resolvers");
// Get PubSub instance from subscription service
const pubsub = subscription_service_1.subscriptionService.getPubSub();
/**
 * Custom scalar resolvers for Vietnamese hospital system
 */
const scalarResolvers = {
    // Date scalar (YYYY-MM-DD format)
    Date: new graphql_1.GraphQLScalarType({
        name: "Date",
        description: "Date in YYYY-MM-DD format",
        serialize(value) {
            if (value instanceof Date) {
                return value.toISOString().split("T")[0];
            }
            if (typeof value === "string") {
                return new Date(value).toISOString().split("T")[0];
            }
            throw new Error("Value must be a Date or date string");
        },
        parseValue(value) {
            if (typeof value === "string") {
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    throw new Error("Invalid date format. Expected YYYY-MM-DD");
                }
                return date;
            }
            throw new Error("Value must be a string in YYYY-MM-DD format");
        },
        parseLiteral(ast) {
            if (ast.kind === graphql_1.Kind.STRING) {
                const date = new Date(ast.value);
                if (isNaN(date.getTime())) {
                    throw new Error("Invalid date format. Expected YYYY-MM-DD");
                }
                return date;
            }
            throw new Error("Value must be a string in YYYY-MM-DD format");
        },
    }),
    // DateTime scalar (ISO 8601 format)
    DateTime: new graphql_1.GraphQLScalarType({
        name: "DateTime",
        description: "DateTime in ISO 8601 format",
        serialize(value) {
            if (value instanceof Date) {
                return value.toISOString();
            }
            if (typeof value === "string") {
                return new Date(value).toISOString();
            }
            throw new Error("Value must be a Date or datetime string");
        },
        parseValue(value) {
            if (typeof value === "string") {
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    throw new Error("Invalid datetime format. Expected ISO 8601");
                }
                return date;
            }
            throw new Error("Value must be a string in ISO 8601 format");
        },
        parseLiteral(ast) {
            if (ast.kind === graphql_1.Kind.STRING) {
                const date = new Date(ast.value);
                if (isNaN(date.getTime())) {
                    throw new Error("Invalid datetime format. Expected ISO 8601");
                }
                return date;
            }
            throw new Error("Value must be a string in ISO 8601 format");
        },
    }),
    // Time scalar (HH:MM format)
    Time: new graphql_1.GraphQLScalarType({
        name: "Time",
        description: "Time in HH:MM format",
        serialize(value) {
            if (typeof value === "string" &&
                /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
                return value;
            }
            throw new Error("Value must be a string in HH:MM format");
        },
        parseValue(value) {
            if (typeof value === "string" &&
                /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
                return value;
            }
            throw new Error("Value must be a string in HH:MM format");
        },
        parseLiteral(ast) {
            if (ast.kind === graphql_1.Kind.STRING &&
                /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(ast.value)) {
                return ast.value;
            }
            throw new Error("Value must be a string in HH:MM format");
        },
    }),
    // Vietnamese Phone Number scalar
    PhoneNumber: new graphql_1.GraphQLScalarType({
        name: "PhoneNumber",
        description: "Vietnamese phone number (10 digits starting with 0)",
        serialize(value) {
            if (typeof value === "string" && /^0[0-9]{9}$/.test(value)) {
                return value;
            }
            throw new Error("Value must be a valid Vietnamese phone number (0xxxxxxxxx)");
        },
        parseValue(value) {
            if (typeof value === "string" && /^0[0-9]{9}$/.test(value)) {
                return value;
            }
            throw new Error("Value must be a valid Vietnamese phone number (0xxxxxxxxx)");
        },
        parseLiteral(ast) {
            if (ast.kind === graphql_1.Kind.STRING && /^0[0-9]{9}$/.test(ast.value)) {
                return ast.value;
            }
            throw new Error("Value must be a valid Vietnamese phone number (0xxxxxxxxx)");
        },
    }),
    // Vietnamese License Number scalar
    LicenseNumber: new graphql_1.GraphQLScalarType({
        name: "LicenseNumber",
        description: "Vietnamese medical license number (VN-XX-YYYY)",
        serialize(value) {
            if (typeof value === "string" && /^VN-[A-Z]{2}-[0-9]{4}$/.test(value)) {
                return value;
            }
            throw new Error("Value must be a valid Vietnamese license number (VN-XX-YYYY)");
        },
        parseValue(value) {
            if (typeof value === "string" && /^VN-[A-Z]{2}-[0-9]{4}$/.test(value)) {
                return value;
            }
            throw new Error("Value must be a valid Vietnamese license number (VN-XX-YYYY)");
        },
        parseLiteral(ast) {
            if (ast.kind === graphql_1.Kind.STRING &&
                /^VN-[A-Z]{2}-[0-9]{4}$/.test(ast.value)) {
                return ast.value;
            }
            throw new Error("Value must be a valid Vietnamese license number (VN-XX-YYYY)");
        },
    }),
    // Doctor ID scalar
    DoctorID: new graphql_1.GraphQLScalarType({
        name: "DoctorID",
        description: "Doctor ID in format DEPT-DOC-YYYYMM-XXX",
        serialize(value) {
            if (typeof value === "string" &&
                /^[A-Z]{4}-DOC-[0-9]{6}-[0-9]{3}$/.test(value)) {
                return value;
            }
            throw new Error("Value must be a valid Doctor ID (DEPT-DOC-YYYYMM-XXX)");
        },
        parseValue(value) {
            if (typeof value === "string" &&
                /^[A-Z]{4}-DOC-[0-9]{6}-[0-9]{3}$/.test(value)) {
                return value;
            }
            throw new Error("Value must be a valid Doctor ID (DEPT-DOC-YYYYMM-XXX)");
        },
        parseLiteral(ast) {
            if (ast.kind === graphql_1.Kind.STRING &&
                /^[A-Z]{4}-DOC-[0-9]{6}-[0-9]{3}$/.test(ast.value)) {
                return ast.value;
            }
            throw new Error("Value must be a valid Doctor ID (DEPT-DOC-YYYYMM-XXX)");
        },
    }),
    // Patient ID scalar
    PatientID: new graphql_1.GraphQLScalarType({
        name: "PatientID",
        description: "Patient ID in format PAT-YYYYMM-XXX",
        serialize(value) {
            if (typeof value === "string" && /^PAT-[0-9]{6}-[0-9]{3}$/.test(value)) {
                return value;
            }
            throw new Error("Value must be a valid Patient ID (PAT-YYYYMM-XXX)");
        },
        parseValue(value) {
            if (typeof value === "string" && /^PAT-[0-9]{6}-[0-9]{3}$/.test(value)) {
                return value;
            }
            throw new Error("Value must be a valid Patient ID (PAT-YYYYMM-XXX)");
        },
        parseLiteral(ast) {
            if (ast.kind === graphql_1.Kind.STRING &&
                /^PAT-[0-9]{6}-[0-9]{3}$/.test(ast.value)) {
                return ast.value;
            }
            throw new Error("Value must be a valid Patient ID (PAT-YYYYMM-XXX)");
        },
    }),
    // UUID scalar
    UUID: new graphql_1.GraphQLScalarType({
        name: "UUID",
        description: "UUID string",
        serialize(value) {
            if (typeof value === "string" &&
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
                return value;
            }
            throw new Error("Value must be a valid UUID");
        },
        parseValue(value) {
            if (typeof value === "string" &&
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
                return value;
            }
            throw new Error("Value must be a valid UUID");
        },
        parseLiteral(ast) {
            if (ast.kind === graphql_1.Kind.STRING &&
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ast.value)) {
                return ast.value;
            }
            throw new Error("Value must be a valid UUID");
        },
    }),
};
/**
 * Base resolvers for root queries, mutations, and subscriptions
 */
const baseResolvers = {
    Query: {
        // Health check
        health: async (_, __, context) => {
            try {
                return {
                    status: "healthy",
                    timestamp: new Date().toISOString(),
                    version: "1.0.0",
                    services: [
                        {
                            name: "GraphQL Gateway",
                            status: "healthy",
                            url: "http://localhost:3200/graphql",
                            responseTime: 5,
                            lastCheck: new Date().toISOString(),
                        },
                    ],
                    database: {
                        status: "healthy",
                        connectionCount: 10,
                        responseTime: 15,
                        lastCheck: new Date().toISOString(),
                    },
                    uptime: Math.floor(process.uptime()),
                };
            }
            catch (error) {
                logger_1.default.error("Health check error:", error);
                throw new Error("Health check failed");
            }
        },
        // System information
        systemInfo: async (_, __, context) => {
            try {
                // Require admin role
                if (!context.user || context.user.role !== "admin") {
                    throw new Error("Chỉ admin mới có thể xem thông tin hệ thống");
                }
                const memoryUsage = process.memoryUsage();
                return {
                    name: "Hospital Management GraphQL Gateway",
                    version: "1.0.0",
                    environment: process.env.NODE_ENV || "development",
                    graphqlVersion: "16.8.1",
                    apolloVersion: "4.10.0",
                    nodeVersion: process.version,
                    uptime: Math.floor(process.uptime()),
                    memoryUsage: {
                        used: memoryUsage.heapUsed / 1024 / 1024, // MB
                        total: memoryUsage.heapTotal / 1024 / 1024, // MB
                        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
                    },
                    features: [
                        "Vietnamese language support",
                        "Real-time subscriptions",
                        "DataLoader optimization",
                        "Rate limiting",
                        "Query complexity limiting",
                        "Authentication & authorization",
                        "Request tracing",
                        "Error handling",
                    ],
                };
            }
            catch (error) {
                logger_1.default.error("System info error:", error);
                throw error;
            }
        },
        // Global search (placeholder)
        globalSearch: async (_, { query, types = [], limit = 20, }, context) => {
            try {
                logger_1.default.debug("Global search:", {
                    query,
                    types,
                    limit,
                    requestId: context.requestId,
                });
                // For now, return empty results
                // TODO: Implement actual global search across all entities
                return {
                    doctors: [],
                    patients: [],
                    appointments: [],
                    departments: [],
                    medicalRecords: [],
                    totalCount: 0,
                };
            }
            catch (error) {
                logger_1.default.error("Global search error:", error);
                throw error;
            }
        },
    },
    Mutation: {
        // Placeholder mutation
        _empty: () => "This is a placeholder mutation",
    },
    Subscription: {
        // Appointment subscriptions
        appointmentUpdated: {
            subscribe: (0, graphql_subscriptions_1.withFilter)(() => pubsub.asyncIterator(["APPOINTMENT_UPDATED"]), (payload, variables) => {
                if (!variables.appointment_id)
                    return true;
                return (payload.appointmentUpdated.appointment_id === variables.appointment_id);
            }),
        },
        appointmentStatusChanged: {
            subscribe: (0, graphql_subscriptions_1.withFilter)(() => pubsub.asyncIterator(["APPOINTMENT_STATUS_CHANGED"]), (payload, variables) => {
                if (!variables.appointment_id)
                    return true;
                return (payload.appointmentStatusChanged.appointment_id ===
                    variables.appointment_id);
            }),
        },
        doctorAppointmentUpdated: {
            subscribe: (0, graphql_subscriptions_1.withFilter)(() => pubsub.asyncIterator(["DOCTOR_APPOINTMENT_UPDATED"]), (payload, variables) => {
                return (payload.doctorAppointmentUpdated.doctor_id === variables.doctor_id);
            }),
        },
        patientAppointmentUpdated: {
            subscribe: (0, graphql_subscriptions_1.withFilter)(() => pubsub.asyncIterator(["PATIENT_APPOINTMENT_UPDATED"]), (payload, variables) => {
                return (payload.patientAppointmentUpdated.patient_id === variables.patient_id);
            }),
        },
        newAppointmentCreated: {
            subscribe: (0, graphql_subscriptions_1.withFilter)(() => pubsub.asyncIterator(["NEW_APPOINTMENT_CREATED"]), (payload, variables) => {
                if (!variables.doctor_id)
                    return true;
                return payload.newAppointmentCreated.doctor_id === variables.doctor_id;
            }),
        },
        waitingQueueUpdated: {
            subscribe: (0, graphql_subscriptions_1.withFilter)(() => pubsub.asyncIterator(["WAITING_QUEUE_UPDATED"]), (payload, variables) => {
                if (!variables.doctor_id)
                    return true;
                return payload.waitingQueueUpdated.some((apt) => apt.doctor_id === variables.doctor_id);
            }),
        },
        // Patient subscriptions
        patientStatusChanged: {
            subscribe: (0, graphql_subscriptions_1.withFilter)(() => pubsub.asyncIterator(["PATIENT_STATUS_CHANGED"]), (payload, variables) => {
                if (!variables.patient_id)
                    return true;
                return payload.patientStatusChanged.patient_id === variables.patient_id;
            }),
        },
        patientUpdated: {
            subscribe: (0, graphql_subscriptions_1.withFilter)(() => pubsub.asyncIterator(["PATIENT_UPDATED"]), (payload, variables) => {
                if (!variables.patient_id)
                    return true;
                return payload.patientUpdated.patient_id === variables.patient_id;
            }),
        },
        // Doctor subscriptions
        doctorStatusChanged: {
            subscribe: (0, graphql_subscriptions_1.withFilter)(() => pubsub.asyncIterator(["DOCTOR_STATUS_CHANGED"]), (payload, variables) => {
                if (!variables.doctor_id)
                    return true;
                return payload.doctorStatusChanged.doctor_id === variables.doctor_id;
            }),
        },
        doctorScheduleChanged: {
            subscribe: (0, graphql_subscriptions_1.withFilter)(() => pubsub.asyncIterator(["DOCTOR_SCHEDULE_CHANGED"]), (payload, variables) => {
                return payload.doctorScheduleChanged.doctor_id === variables.doctor_id;
            }),
        },
        doctorAvailabilityChanged: {
            subscribe: (0, graphql_subscriptions_1.withFilter)(() => pubsub.asyncIterator(["DOCTOR_AVAILABILITY_CHANGED"]), (payload, variables) => {
                if (!variables.doctor_id)
                    return true;
                return (payload.doctorAvailabilityChanged.doctor_id === variables.doctor_id);
            }),
        },
        // System notifications
        systemNotification: {
            subscribe: () => pubsub.asyncIterator(["SYSTEM_NOTIFICATION"]),
        },
        // Global updates
        globalUpdate: {
            subscribe: () => pubsub.asyncIterator(["GLOBAL_UPDATE"]),
        },
    },
};
/**
 * Combined resolvers
 * Merges all entity resolvers with base resolvers and scalars
 */
exports.resolvers = {
    // Scalar resolvers
    ...scalarResolvers,
    // Merge queries
    Query: {
        ...baseResolvers.Query,
        ...doctor_resolvers_1.doctorResolvers.Query,
        ...patient_resolvers_1.patientResolvers.Query,
        ...appointment_resolvers_1.appointmentResolvers.Query,
        ...medical_records_resolvers_1.medicalRecordsResolvers.Query, // ✅ Schema conflicts resolved
        ...department_resolvers_1.departmentResolvers.Query,
    },
    // Merge mutations
    Mutation: {
        ...baseResolvers.Mutation,
        ...doctor_resolvers_1.doctorResolvers.Mutation,
        ...patient_resolvers_1.patientResolvers.Mutation,
        ...appointment_resolvers_1.appointmentResolvers.Mutation,
        ...medical_records_resolvers_1.medicalRecordsResolvers.Mutation, // ✅ Schema conflicts resolved
        ...department_resolvers_1.departmentResolvers.Mutation,
    },
    // Merge subscriptions
    Subscription: {
        ...baseResolvers.Subscription,
        // TODO: Add medical records subscriptions when implemented
    },
    // Entity resolvers
    Doctor: doctor_resolvers_1.doctorResolvers.Doctor,
    Patient: patient_resolvers_1.patientResolvers.Patient,
    Appointment: appointment_resolvers_1.appointmentResolvers.Appointment,
    Department: department_resolvers_1.departmentResolvers.Department,
    MedicalRecord: medical_records_resolvers_1.medicalRecordsResolvers.MedicalRecord, // ✅ Medical record field resolvers
    VitalSigns: medical_records_resolvers_1.medicalRecordsResolvers.VitalSigns, // ✅ Vital signs field resolvers
    DoctorReview: doctor_resolvers_1.doctorResolvers.DoctorReview, // ✅ Doctor review field resolvers
    DoctorSchedule: doctor_resolvers_1.doctorResolvers.DoctorSchedule, // ✅ Doctor schedule field resolvers
    Room: doctor_resolvers_1.doctorResolvers.Room, // ✅ Room field resolvers
};
exports.default = exports.resolvers;
//# sourceMappingURL=index.js.map