import logger from "@hospital/shared/dist/utils/logger";
import { GraphQLScalarType, Kind } from "graphql";
import { withFilter } from "graphql-subscriptions";
import { GraphQLContext } from "../context";
import { subscriptionService } from "../services/subscription.service";
import { appointmentResolvers } from "./appointment.resolvers";
import { departmentResolvers } from "./department.resolvers";
import { doctorResolvers } from "./doctor.resolvers";
import { medicalRecordsResolvers } from "./medical-records.resolvers";
import { patientResolvers } from "./patient.resolvers";

// Get PubSub instance from subscription service
const pubsub = subscriptionService.getPubSub();

/**
 * Custom scalar resolvers for Vietnamese hospital system
 */
const scalarResolvers = {
  // Date scalar (YYYY-MM-DD format)
  Date: new GraphQLScalarType({
    name: "Date",
    description: "Date in YYYY-MM-DD format",
    serialize(value: any): string {
      if (value instanceof Date) {
        return value.toISOString().split("T")[0];
      }
      if (typeof value === "string") {
        return new Date(value).toISOString().split("T")[0];
      }
      throw new Error("Value must be a Date or date string");
    },
    parseValue(value: any): Date {
      if (typeof value === "string") {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error("Invalid date format. Expected YYYY-MM-DD");
        }
        return date;
      }
      throw new Error("Value must be a string in YYYY-MM-DD format");
    },
    parseLiteral(ast): Date {
      if (ast.kind === Kind.STRING) {
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
  DateTime: new GraphQLScalarType({
    name: "DateTime",
    description: "DateTime in ISO 8601 format",
    serialize(value: any): string {
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (typeof value === "string") {
        return new Date(value).toISOString();
      }
      throw new Error("Value must be a Date or datetime string");
    },
    parseValue(value: any): Date {
      if (typeof value === "string") {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error("Invalid datetime format. Expected ISO 8601");
        }
        return date;
      }
      throw new Error("Value must be a string in ISO 8601 format");
    },
    parseLiteral(ast): Date {
      if (ast.kind === Kind.STRING) {
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
  Time: new GraphQLScalarType({
    name: "Time",
    description: "Time in HH:MM format",
    serialize(value: any): string {
      if (
        typeof value === "string" &&
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
      ) {
        return value;
      }
      throw new Error("Value must be a string in HH:MM format");
    },
    parseValue(value: any): string {
      if (
        typeof value === "string" &&
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
      ) {
        return value;
      }
      throw new Error("Value must be a string in HH:MM format");
    },
    parseLiteral(ast): string {
      if (
        ast.kind === Kind.STRING &&
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(ast.value)
      ) {
        return ast.value;
      }
      throw new Error("Value must be a string in HH:MM format");
    },
  }),

  // Vietnamese Phone Number scalar
  PhoneNumber: new GraphQLScalarType({
    name: "PhoneNumber",
    description: "Vietnamese phone number (10 digits starting with 0)",
    serialize(value: any): string {
      if (typeof value === "string" && /^0[0-9]{9}$/.test(value)) {
        return value;
      }
      throw new Error(
        "Value must be a valid Vietnamese phone number (0xxxxxxxxx)"
      );
    },
    parseValue(value: any): string {
      if (typeof value === "string" && /^0[0-9]{9}$/.test(value)) {
        return value;
      }
      throw new Error(
        "Value must be a valid Vietnamese phone number (0xxxxxxxxx)"
      );
    },
    parseLiteral(ast): string {
      if (ast.kind === Kind.STRING && /^0[0-9]{9}$/.test(ast.value)) {
        return ast.value;
      }
      throw new Error(
        "Value must be a valid Vietnamese phone number (0xxxxxxxxx)"
      );
    },
  }),

  // Vietnamese License Number scalar
  LicenseNumber: new GraphQLScalarType({
    name: "LicenseNumber",
    description: "Vietnamese medical license number (VN-XX-YYYY)",
    serialize(value: any): string {
      if (typeof value === "string" && /^VN-[A-Z]{2}-[0-9]{4}$/.test(value)) {
        return value;
      }
      throw new Error(
        "Value must be a valid Vietnamese license number (VN-XX-YYYY)"
      );
    },
    parseValue(value: any): string {
      if (typeof value === "string" && /^VN-[A-Z]{2}-[0-9]{4}$/.test(value)) {
        return value;
      }
      throw new Error(
        "Value must be a valid Vietnamese license number (VN-XX-YYYY)"
      );
    },
    parseLiteral(ast): string {
      if (
        ast.kind === Kind.STRING &&
        /^VN-[A-Z]{2}-[0-9]{4}$/.test(ast.value)
      ) {
        return ast.value;
      }
      throw new Error(
        "Value must be a valid Vietnamese license number (VN-XX-YYYY)"
      );
    },
  }),

  // Doctor ID scalar
  DoctorID: new GraphQLScalarType({
    name: "DoctorID",
    description: "Doctor ID in format DEPT-DOC-YYYYMM-XXX",
    serialize(value: any): string {
      if (
        typeof value === "string" &&
        /^[A-Z]{4}-DOC-[0-9]{6}-[0-9]{3}$/.test(value)
      ) {
        return value;
      }
      throw new Error("Value must be a valid Doctor ID (DEPT-DOC-YYYYMM-XXX)");
    },
    parseValue(value: any): string {
      if (
        typeof value === "string" &&
        /^[A-Z]{4}-DOC-[0-9]{6}-[0-9]{3}$/.test(value)
      ) {
        return value;
      }
      throw new Error("Value must be a valid Doctor ID (DEPT-DOC-YYYYMM-XXX)");
    },
    parseLiteral(ast): string {
      if (
        ast.kind === Kind.STRING &&
        /^[A-Z]{4}-DOC-[0-9]{6}-[0-9]{3}$/.test(ast.value)
      ) {
        return ast.value;
      }
      throw new Error("Value must be a valid Doctor ID (DEPT-DOC-YYYYMM-XXX)");
    },
  }),

  // Patient ID scalar
  PatientID: new GraphQLScalarType({
    name: "PatientID",
    description: "Patient ID in format PAT-YYYYMM-XXX",
    serialize(value: any): string {
      if (typeof value === "string" && /^PAT-[0-9]{6}-[0-9]{3}$/.test(value)) {
        return value;
      }
      throw new Error("Value must be a valid Patient ID (PAT-YYYYMM-XXX)");
    },
    parseValue(value: any): string {
      if (typeof value === "string" && /^PAT-[0-9]{6}-[0-9]{3}$/.test(value)) {
        return value;
      }
      throw new Error("Value must be a valid Patient ID (PAT-YYYYMM-XXX)");
    },
    parseLiteral(ast): string {
      if (
        ast.kind === Kind.STRING &&
        /^PAT-[0-9]{6}-[0-9]{3}$/.test(ast.value)
      ) {
        return ast.value;
      }
      throw new Error("Value must be a valid Patient ID (PAT-YYYYMM-XXX)");
    },
  }),

  // UUID scalar
  UUID: new GraphQLScalarType({
    name: "UUID",
    description: "UUID string",
    serialize(value: any): string {
      if (
        typeof value === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          value
        )
      ) {
        return value;
      }
      throw new Error("Value must be a valid UUID");
    },
    parseValue(value: any): string {
      if (
        typeof value === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          value
        )
      ) {
        return value;
      }
      throw new Error("Value must be a valid UUID");
    },
    parseLiteral(ast): string {
      if (
        ast.kind === Kind.STRING &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          ast.value
        )
      ) {
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
    health: async (_: any, __: any, context: GraphQLContext) => {
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
      } catch (error) {
        logger.error("Health check error:", error);
        throw new Error("Health check failed");
      }
    },

    // System information
    systemInfo: async (_: any, __: any, context: GraphQLContext) => {
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
      } catch (error) {
        logger.error("System info error:", error);
        throw error;
      }
    },

    // Global search (placeholder)
    globalSearch: async (
      _: any,
      {
        query,
        types = [],
        limit = 20,
      }: { query: string; types: string[]; limit: number },
      context: GraphQLContext
    ) => {
      try {
        logger.debug("Global search:", {
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
      } catch (error) {
        logger.error("Global search error:", error);
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
      subscribe: withFilter(
        () => pubsub.asyncIterator(["APPOINTMENT_UPDATED"]),
        (payload, variables) => {
          if (!variables.appointment_id) return true;
          return (
            payload.appointmentUpdated.appointment_id === variables.appointment_id
          );
        }
      ),
    },

    appointmentStatusChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(["APPOINTMENT_STATUS_CHANGED"]),
        (payload, variables) => {
          if (!variables.appointment_id) return true;
          return (
            payload.appointmentStatusChanged.appointment_id ===
            variables.appointment_id
          );
        }
      ),
    },

    doctorAppointmentUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(["DOCTOR_APPOINTMENT_UPDATED"]),
        (payload, variables) => {
          return (
            payload.doctorAppointmentUpdated.doctor_id === variables.doctor_id
          );
        }
      ),
    },

    patientAppointmentUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(["PATIENT_APPOINTMENT_UPDATED"]),
        (payload, variables) => {
          return (
            payload.patientAppointmentUpdated.patient_id === variables.patient_id
          );
        }
      ),
    },

    newAppointmentCreated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(["NEW_APPOINTMENT_CREATED"]),
        (payload, variables) => {
          if (!variables.doctor_id) return true;
          return payload.newAppointmentCreated.doctor_id === variables.doctor_id;
        }
      ),
    },

    waitingQueueUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(["WAITING_QUEUE_UPDATED"]),
        (payload, variables) => {
          if (!variables.doctor_id) return true;
          return payload.waitingQueueUpdated.some(
            (apt: any) => apt.doctor_id === variables.doctor_id
          );
        }
      ),
    },

    // Patient subscriptions
    patientStatusChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(["PATIENT_STATUS_CHANGED"]),
        (payload, variables) => {
          if (!variables.patient_id) return true;
          return payload.patientStatusChanged.patient_id === variables.patient_id;
        }
      ),
    },

    patientUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(["PATIENT_UPDATED"]),
        (payload, variables) => {
          if (!variables.patient_id) return true;
          return payload.patientUpdated.patient_id === variables.patient_id;
        }
      ),
    },

    // Doctor subscriptions
    doctorStatusChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(["DOCTOR_STATUS_CHANGED"]),
        (payload, variables) => {
          if (!variables.doctor_id) return true;
          return payload.doctorStatusChanged.doctor_id === variables.doctor_id;
        }
      ),
    },

    doctorScheduleChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(["DOCTOR_SCHEDULE_CHANGED"]),
        (payload, variables) => {
          return payload.doctorScheduleChanged.doctor_id === variables.doctor_id;
        }
      ),
    },

    doctorAvailabilityChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(["DOCTOR_AVAILABILITY_CHANGED"]),
        (payload, variables) => {
          if (!variables.doctor_id) return true;
          return (
            payload.doctorAvailabilityChanged.doctor_id === variables.doctor_id
          );
        }
      ),
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
export const resolvers = {
  // Scalar resolvers
  ...scalarResolvers,

  // Merge queries
  Query: {
    ...baseResolvers.Query,
    ...doctorResolvers.Query,
    ...patientResolvers.Query,
    ...appointmentResolvers.Query,
    ...medicalRecordsResolvers.Query, // ✅ Schema conflicts resolved
    ...departmentResolvers.Query,
  },

  // Merge mutations
  Mutation: {
    ...baseResolvers.Mutation,
    ...doctorResolvers.Mutation,
    ...patientResolvers.Mutation,
    ...appointmentResolvers.Mutation,
    ...medicalRecordsResolvers.Mutation, // ✅ Schema conflicts resolved
    ...departmentResolvers.Mutation,
  },

  // Merge subscriptions
  Subscription: {
    ...baseResolvers.Subscription,
    // TODO: Add medical records subscriptions when implemented
  },

  // Entity resolvers
  Doctor: doctorResolvers.Doctor,
  Patient: patientResolvers.Patient,
  Appointment: appointmentResolvers.Appointment,
  Department: departmentResolvers.Department,
  MedicalRecord: medicalRecordsResolvers.MedicalRecord, // ✅ Medical record field resolvers
  VitalSigns: medicalRecordsResolvers.VitalSigns, // ✅ Vital signs field resolvers
  DoctorReview: doctorResolvers.DoctorReview, // ✅ Doctor review field resolvers
  DoctorSchedule: doctorResolvers.DoctorSchedule, // ✅ Doctor schedule field resolvers
  Room: doctorResolvers.Room, // ✅ Room field resolvers
};

export default resolvers;
