"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.medicalRecordsResolvers = void 0;
const shared_1 = require("@hospital/shared");
const context_1 = require("../context");
/**
 * Medical Records GraphQL Resolvers
 * Handles all medical record-related queries, mutations, and subscriptions
 * Supports Vietnamese language and hospital management requirements
 */
exports.medicalRecordsResolvers = {
    Query: {
        // Get single medical record
        async medicalRecord(_, { id }, context) {
            try {
                if (!id) {
                    throw new Error(context_1.contextUtils.translate(context, "medical_record.errors.missing_id"));
                }
                shared_1.logger.debug("Fetching medical record:", {
                    id,
                    requestId: context.requestId,
                });
                const response = await context.restApi.getMedicalRecord(id);
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "medical_record.errors.fetch_failed"));
                }
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error fetching medical record:", error);
                throw error;
            }
        },
        // Get multiple medical records with filters
        async medicalRecords(_, { filters, limit = 20, offset = 0, sortBy = "visitDate", sortOrder = "DESC", }, context) {
            try {
                shared_1.logger.debug("Fetching medical records:", {
                    filters,
                    limit,
                    offset,
                    requestId: context.requestId,
                });
                const response = await context.restApi.getMedicalRecords({
                    ...filters,
                    limit,
                    offset,
                    sortBy,
                    sortOrder,
                });
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "medical_record.errors.fetch_failed"));
                }
                return {
                    edges: response.data.map((record) => ({
                        node: record,
                        cursor: Buffer.from(record.id).toString("base64"),
                    })),
                    pageInfo: {
                        hasNextPage: response.data.length === limit,
                        hasPreviousPage: offset > 0,
                        startCursor: response.data.length > 0
                            ? Buffer.from(response.data[0].id).toString("base64")
                            : null,
                        endCursor: response.data.length > 0
                            ? Buffer.from(response.data[response.data.length - 1].id).toString("base64")
                            : null,
                    },
                    totalCount: response.totalCount || response.data.length,
                };
            }
            catch (error) {
                shared_1.logger.error("Error fetching medical records:", error);
                throw error;
            }
        },
        // Note: patientMedicalRecords resolver is moved to patient.resolvers.ts
        // to match the schema definition location
        // Get doctor medical records
        async doctorMedicalRecords(_, { doctor_id, limit = 20, offset = 0, dateFrom, dateTo }, context) {
            try {
                shared_1.logger.debug("Fetching doctor medical records:", {
                    doctor_id,
                    limit,
                    offset,
                    requestId: context.requestId,
                });
                const response = await context.restApi.getDoctorMedicalRecords({
                    doctor_id,
                    limit,
                    offset,
                    dateFrom,
                    dateTo,
                });
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "medical_record.errors.doctor_records_failed"));
                }
                return {
                    edges: response.data.map((record) => ({
                        node: record,
                        cursor: Buffer.from(record.id).toString("base64"),
                    })),
                    pageInfo: {
                        hasNextPage: response.data.length === limit,
                        hasPreviousPage: offset > 0,
                        startCursor: response.data.length > 0
                            ? Buffer.from(response.data[0].id).toString("base64")
                            : null,
                        endCursor: response.data.length > 0
                            ? Buffer.from(response.data[response.data.length - 1].id).toString("base64")
                            : null,
                    },
                    totalCount: response.totalCount || response.data.length,
                };
            }
            catch (error) {
                shared_1.logger.error("Error fetching doctor medical records:", error);
                throw error;
            }
        },
        // Search medical records
        async searchMedicalRecords(_, { query, filters, limit = 20, offset = 0 }, context) {
            try {
                shared_1.logger.debug("Searching medical records:", {
                    query,
                    filters,
                    limit,
                    offset,
                    requestId: context.requestId,
                });
                const response = await context.restApi.searchMedicalRecords({
                    query,
                    ...filters,
                    limit,
                    offset,
                });
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "medical_record.errors.search_failed"));
                }
                return {
                    edges: response.data.map((record) => ({
                        node: record,
                        cursor: Buffer.from(record.id).toString("base64"),
                    })),
                    pageInfo: {
                        hasNextPage: response.data.length === limit,
                        hasPreviousPage: offset > 0,
                        startCursor: response.data.length > 0
                            ? Buffer.from(response.data[0].id).toString("base64")
                            : null,
                        endCursor: response.data.length > 0
                            ? Buffer.from(response.data[response.data.length - 1].id).toString("base64")
                            : null,
                    },
                    totalCount: response.totalCount || response.data.length,
                };
            }
            catch (error) {
                shared_1.logger.error("Error searching medical records:", error);
                throw error;
            }
        },
        // Note: vitalSignsHistory resolver removed as it's not defined in schema
        // Note: labResults resolver removed as it's not defined in schema
    },
    Mutation: {
        // Create new medical record
        async createMedicalRecord(_, { input }, context) {
            try {
                shared_1.logger.debug("Creating medical record:", {
                    input,
                    requestId: context.requestId,
                });
                const response = await context.restApi.createMedicalRecord(input);
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "medical_record.errors.create_failed"));
                }
                shared_1.logger.info("Medical record created successfully:", {
                    recordId: response.data.id,
                });
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error creating medical record:", error);
                throw error;
            }
        },
        // Update medical record
        async updateMedicalRecord(_, { id, input }, context) {
            try {
                shared_1.logger.debug("Updating medical record:", {
                    id,
                    input,
                    requestId: context.requestId,
                });
                const response = await context.restApi.updateMedicalRecord(id, input);
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "medical_record.errors.update_failed"));
                }
                shared_1.logger.info("Medical record updated successfully:", { recordId: id });
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error updating medical record:", error);
                throw error;
            }
        },
        // Delete medical record
        async deleteMedicalRecord(_, { id }, context) {
            try {
                shared_1.logger.debug("Deleting medical record:", {
                    id,
                    requestId: context.requestId,
                });
                const response = await context.restApi.deleteMedicalRecord(id);
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "medical_record.errors.delete_failed"));
                }
                shared_1.logger.info("Medical record deleted successfully:", { recordId: id });
                return true;
            }
            catch (error) {
                shared_1.logger.error("Error deleting medical record:", error);
                throw error;
            }
        },
    },
    // Field resolvers for MedicalRecord type
    MedicalRecord: {
        // Resolve patient using DataLoader
        async patient(parent, _, context) {
            if (!parent.patient_id)
                return null;
            try {
                return await context.dataloaders.patientById.load(parent.patient_id);
            }
            catch (error) {
                shared_1.logger.error("Error loading medical record patient:", error);
                return null;
            }
        },
        // Resolve doctor using DataLoader
        async doctor(parent, _, context) {
            if (!parent.doctor_id)
                return null;
            try {
                return await context.dataloaders.doctorById.load(parent.doctor_id);
            }
            catch (error) {
                shared_1.logger.error("Error loading medical record doctor:", error);
                return null;
            }
        },
        // Resolve appointment using DataLoader
        async appointment(parent, _, context) {
            if (!parent.appointment_id)
                return null;
            try {
                return await context.dataloaders.appointmentById.load(parent.appointment_id);
            }
            catch (error) {
                shared_1.logger.error("Error loading medical record appointment:", error);
                return null;
            }
        },
    },
    // Field resolvers for VitalSigns type
    VitalSigns: {
        // Map database snake_case to GraphQL camelCase
        bloodPressureSystolic: (parent) => parent.vital_signs.vital_signs.blood_pressure_systolic,
        bloodPressureDiastolic: (parent) => parent.vital_signs.vital_signs.blood_pressure_diastolic,
        heartRate: (parent) => parent.heart_rate,
        temperature: (parent) => parent.temperature,
        respiratoryRate: (parent) => parent.respiratory_rate,
        oxygenSaturation: (parent) => parent.vital_signs.vital_signs.oxygen_saturation,
        height: (parent) => parent.height,
        weight: (parent) => parent.weight,
        recorded_at: (parent) => parent.recorded_at,
        recorded_by: (parent) => parent.recorded_by,
        notes: (parent) => parent.notes,
        // Calculate BMI if height and weight are available
        bmi(parent) {
            const height = parent.height;
            const weight = parent.weight;
            if (!height || !weight)
                return null;
            const heightInMeters = height / 100;
            return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
        },
    },
};
exports.default = exports.medicalRecordsResolvers;
//# sourceMappingURL=medical-records.resolvers.js.map