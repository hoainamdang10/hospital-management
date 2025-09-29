"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patientResolvers = void 0;
const shared_1 = require("@hospital/shared");
const context_1 = require("../context");
/**
 * Patient GraphQL Resolvers
 * Handles all patient-related queries, mutations, and subscriptions
 * Supports Vietnamese language and hospital management requirements
 */
exports.patientResolvers = {
    Query: {
        // Get single patient
        async patient(_, { id, patient_id }, context) {
            try {
                const identifier = id || patient_id;
                if (!identifier) {
                    throw new Error(context_1.contextUtils.translate(context, "patient.errors.missing_identifier"));
                }
                shared_1.logger.debug("Fetching patient:", {
                    identifier,
                    requestId: context.requestId,
                });
                const response = await context.restApi.getPatient(identifier);
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "patient.errors.fetch_failed"));
                }
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error fetching patient:", error);
                throw error;
            }
        },
        // Get patient by profile ID
        async patientByProfile(_, { profileId }, context) {
            try {
                shared_1.logger.debug("Fetching patient by profile:", {
                    profileId,
                    requestId: context.requestId,
                });
                const response = await context.restApi.getPatientByProfile(profileId);
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "patient.errors.fetch_failed"));
                }
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error fetching patient by profile:", error);
                throw error;
            }
        },
        // Get multiple patients with filters
        async patients(_, { filters, limit = 20, offset = 0, sortBy = "created_at", sortOrder = "DESC", }, context) {
            try {
                shared_1.logger.debug("Fetching patients:", {
                    filters,
                    limit,
                    offset,
                    requestId: context.requestId,
                });
                const response = await context.restApi.getPatients({
                    ...filters,
                    limit,
                    offset,
                    sortBy,
                    sortOrder,
                });
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "patient.errors.fetch_failed"));
                }
                return {
                    edges: response.data.map((patient) => ({
                        node: patient,
                        cursor: Buffer.from(patient.id).toString("base64"),
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
                shared_1.logger.error("Error fetching patients:", error);
                throw error;
            }
        },
        // Search patients
        async searchPatients(_, { query, filters, limit = 20, offset = 0 }, context) {
            try {
                shared_1.logger.debug("Searching patients:", {
                    query,
                    filters,
                    limit,
                    offset,
                    requestId: context.requestId,
                });
                const response = await context.restApi.searchPatients({
                    query,
                    ...filters,
                    limit,
                    offset,
                });
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "patient.errors.search_failed"));
                }
                return {
                    edges: response.data.map((patient) => ({
                        node: patient,
                        cursor: Buffer.from(patient.id).toString("base64"),
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
                shared_1.logger.error("Error searching patients:", error);
                throw error;
            }
        },
        // Get patient medical summary
        async patientMedicalSummary(_, { patient_id }, context) {
            try {
                shared_1.logger.debug("Fetching patient medical summary:", {
                    patient_id,
                    requestId: context.requestId,
                });
                const response = await context.restApi.getPatientMedicalSummary(patient_id);
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "patient.errors.medical_summary_failed"));
                }
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error fetching patient medical summary:", error);
                throw error;
            }
        },
        // Get patient statistics
        async patientStats(_, { patient_id }, context) {
            try {
                shared_1.logger.debug("Fetching patient stats:", {
                    patient_id,
                    requestId: context.requestId,
                });
                const response = await context.restApi.getPatientStats(patient_id);
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "patient.errors.stats_failed"));
                }
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error fetching patient stats:", error);
                throw error;
            }
        },
        // Get patient-doctor history
        async patientDoctorHistory(_, { patient_id, doctor_id, limit = 10, }, context) {
            try {
                shared_1.logger.debug("Fetching patient-doctor history:", {
                    patient_id,
                    doctor_id,
                    limit,
                    requestId: context.requestId,
                });
                const response = await context.restApi.getPatientDoctorHistory(patient_id, doctor_id, limit);
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "patient.errors.history_failed"));
                }
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error fetching patient-doctor history:", error);
                throw error;
            }
        },
        // Get patient medical records
        async patientMedicalRecords(_, { patient_id, limit = 20, offset = 0, dateFrom, dateTo }, context) {
            try {
                shared_1.logger.debug("Fetching patient medical records:", {
                    patient_id,
                    limit,
                    offset,
                    requestId: context.requestId,
                });
                const response = await context.restApi.getPatientMedicalRecords({
                    patient_id,
                    limit,
                    offset,
                    dateFrom,
                    dateTo,
                });
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "medical_record.errors.patient_records_failed"));
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
                shared_1.logger.error("Error fetching patient medical records:", error);
                throw error;
            }
        },
    },
    Mutation: {
        // Create new patient
        async createPatient(_, { input }, context) {
            try {
                shared_1.logger.debug("Creating patient:", {
                    input,
                    requestId: context.requestId,
                });
                const response = await context.restApi.createPatient(input);
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "patient.errors.create_failed"));
                }
                shared_1.logger.info("Patient created successfully:", {
                    patient_id: response.data.patient_id,
                });
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error creating patient:", error);
                throw error;
            }
        },
        // Update patient
        async updatePatient(_, { id, input }, context) {
            try {
                shared_1.logger.debug("Updating patient:", {
                    id,
                    input,
                    requestId: context.requestId,
                });
                const response = await context.restApi.updatePatient(id, input);
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "patient.errors.update_failed"));
                }
                shared_1.logger.info("Patient updated successfully:", { patient_id: id });
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error updating patient:", error);
                throw error;
            }
        },
        // Delete patient
        async deletePatient(_, { id }, context) {
            try {
                shared_1.logger.debug("Deleting patient:", { id, requestId: context.requestId });
                const response = await context.restApi.deletePatient(id);
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "patient.errors.delete_failed"));
                }
                shared_1.logger.info("Patient deleted successfully:", { patient_id: id });
                return true;
            }
            catch (error) {
                shared_1.logger.error("Error deleting patient:", error);
                throw error;
            }
        },
        // Activate patient
        async activatePatient(_, { id }, context) {
            try {
                shared_1.logger.debug("Activating patient:", {
                    id,
                    requestId: context.requestId,
                });
                const response = await context.restApi.activatePatient(id);
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "patient.errors.activate_failed"));
                }
                shared_1.logger.info("Patient activated successfully:", { patient_id: id });
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error activating patient:", error);
                throw error;
            }
        },
        // Deactivate patient
        async deactivatePatient(_, { id }, context) {
            try {
                shared_1.logger.debug("Deactivating patient:", {
                    id,
                    requestId: context.requestId,
                });
                const response = await context.restApi.deactivatePatient(id);
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "patient.errors.deactivate_failed"));
                }
                shared_1.logger.info("Patient deactivated successfully:", { patient_id: id });
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error deactivating patient:", error);
                throw error;
            }
        },
        // Update patient medical information
        async updatePatientMedicalInfo(_, { id, bloodType, height, weight, allergies, chronicConditions, currentMedications, }, context) {
            try {
                shared_1.logger.debug("Updating patient medical info:", {
                    id,
                    requestId: context.requestId,
                });
                const medicalInfo = {
                    bloodType,
                    height,
                    weight,
                    allergies,
                    chronicConditions,
                    currentMedications,
                };
                const response = await context.restApi.updatePatientMedicalInfo(id, medicalInfo);
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "patient.errors.medical_update_failed"));
                }
                shared_1.logger.info("Patient medical info updated successfully:", {
                    patient_id: id,
                });
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error updating patient medical info:", error);
                throw error;
            }
        },
        // Update patient insurance
        async updatePatientInsurance(_, { id, insuranceType, insuranceNumber, insuranceProvider, insuranceExpiryDate, }, context) {
            try {
                shared_1.logger.debug("Updating patient insurance:", {
                    id,
                    requestId: context.requestId,
                });
                const insuranceInfo = {
                    insuranceType,
                    insuranceNumber,
                    insuranceProvider,
                    insuranceExpiryDate,
                };
                const response = await context.restApi.updatePatientInsurance(id, insuranceInfo);
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "patient.errors.insurance_update_failed"));
                }
                shared_1.logger.info("Patient insurance updated successfully:", {
                    patient_id: id,
                });
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error updating patient insurance:", error);
                throw error;
            }
        },
    },
    // Field resolvers for Patient type
    Patient: {
        // Calculate age from date of birth
        age(parent) {
            if (!parent.dateOfBirth)
                return null;
            const today = new Date();
            const birthDate = new Date(parent.dateOfBirth);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 ||
                (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        },
        // Calculate BMI
        bmi(parent) {
            if (!parent.height || !parent.weight)
                return null;
            const heightInMeters = parent.height / 100;
            return parseFloat((parent.weight / (heightInMeters * heightInMeters)).toFixed(1));
        },
        // Resolve appointments using DataLoader
        async appointments(parent, { status, dateFrom, dateTo, limit = 10, offset = 0 }, context) {
            try {
                const appointments = await context.dataloaders.appointmentsByPatient.load(parent.patient_id || parent.id);
                // Apply filters
                let filteredAppointments = appointments || [];
                if (status) {
                    filteredAppointments = filteredAppointments.filter((apt) => apt.status === status);
                }
                if (dateFrom) {
                    filteredAppointments = filteredAppointments.filter((apt) => new Date(apt.scheduledDate) >= new Date(dateFrom));
                }
                if (dateTo) {
                    filteredAppointments = filteredAppointments.filter((apt) => new Date(apt.scheduledDate) <= new Date(dateTo));
                }
                // Apply pagination
                const paginatedAppointments = filteredAppointments.slice(offset, offset + limit);
                return {
                    edges: paginatedAppointments.map((appointment) => ({
                        node: appointment,
                        cursor: Buffer.from(appointment.id).toString("base64"),
                    })),
                    pageInfo: {
                        hasNextPage: offset + limit < filteredAppointments.length,
                        hasPreviousPage: offset > 0,
                        startCursor: paginatedAppointments.length > 0
                            ? Buffer.from(paginatedAppointments[0].id).toString("base64")
                            : null,
                        endCursor: paginatedAppointments.length > 0
                            ? Buffer.from(paginatedAppointments[paginatedAppointments.length - 1].id).toString("base64")
                            : null,
                    },
                    totalCount: filteredAppointments.length,
                };
            }
            catch (error) {
                shared_1.logger.error("Error loading patient appointments:", error);
                return {
                    edges: [],
                    pageInfo: {
                        hasNextPage: false,
                        hasPreviousPage: false,
                        startCursor: null,
                        endCursor: null,
                    },
                    totalCount: 0,
                };
            }
        },
        // Resolve medical records using DataLoader
        async medicalRecords(parent, { limit = 10, offset = 0, dateFrom, dateTo }, context) {
            try {
                const medicalRecords = await context.dataloaders.medicalRecordsByPatient.load(parent.patient_id || parent.id);
                // Apply date filters
                let filteredRecords = medicalRecords || [];
                if (dateFrom) {
                    filteredRecords = filteredRecords.filter((record) => new Date(record.visitDate) >= new Date(dateFrom));
                }
                if (dateTo) {
                    filteredRecords = filteredRecords.filter((record) => new Date(record.visitDate) <= new Date(dateTo));
                }
                // Apply pagination
                const paginatedRecords = filteredRecords.slice(offset, offset + limit);
                return {
                    edges: paginatedRecords.map((record) => ({
                        node: record,
                        cursor: Buffer.from(record.id).toString("base64"),
                    })),
                    pageInfo: {
                        hasNextPage: offset + limit < filteredRecords.length,
                        hasPreviousPage: offset > 0,
                        startCursor: paginatedRecords.length > 0
                            ? Buffer.from(paginatedRecords[0].id).toString("base64")
                            : null,
                        endCursor: paginatedRecords.length > 0
                            ? Buffer.from(paginatedRecords[paginatedRecords.length - 1].id).toString("base64")
                            : null,
                    },
                    totalCount: filteredRecords.length,
                };
            }
            catch (error) {
                shared_1.logger.error("Error loading patient medical records:", error);
                return {
                    edges: [],
                    pageInfo: {
                        hasNextPage: false,
                        hasPreviousPage: false,
                        startCursor: null,
                        endCursor: null,
                    },
                    totalCount: 0,
                };
            }
        },
        // Computed fields
        async totalAppointments(parent, _, context) {
            try {
                const appointments = await context.dataloaders.appointmentsByPatient.load(parent.patient_id || parent.id);
                return appointments ? appointments.length : 0;
            }
            catch (error) {
                shared_1.logger.error("Error calculating total appointments:", error);
                return 0;
            }
        },
        async upcomingAppointments(parent, _, context) {
            try {
                const appointments = await context.dataloaders.appointmentsByPatient.load(parent.patient_id || parent.id);
                if (!appointments)
                    return 0;
                const now = new Date();
                return appointments.filter((apt) => new Date(apt.scheduledDateTime) > now && apt.status !== "CANCELLED").length;
            }
            catch (error) {
                shared_1.logger.error("Error calculating upcoming appointments:", error);
                return 0;
            }
        },
        async completedAppointments(parent, _, context) {
            try {
                const appointments = await context.dataloaders.appointmentsByPatient.load(parent.patient_id || parent.id);
                if (!appointments)
                    return 0;
                return appointments.filter((apt) => apt.status === "COMPLETED")
                    .length;
            }
            catch (error) {
                shared_1.logger.error("Error calculating completed appointments:", error);
                return 0;
            }
        },
        async lastAppointment(parent, _, context) {
            try {
                const appointments = await context.dataloaders.appointmentsByPatient.load(parent.patient_id || parent.id);
                if (!appointments || appointments.length === 0)
                    return null;
                const sortedAppointments = appointments
                    .filter((apt) => apt.status === "COMPLETED")
                    .sort((a, b) => new Date(b.scheduledDateTime).getTime() -
                    new Date(a.scheduledDateTime).getTime());
                return sortedAppointments[0] || null;
            }
            catch (error) {
                shared_1.logger.error("Error getting last appointment:", error);
                return null;
            }
        },
        async nextAppointment(parent, _, context) {
            try {
                const appointments = await context.dataloaders.appointmentsByPatient.load(parent.patient_id || parent.id);
                if (!appointments || appointments.length === 0)
                    return null;
                const now = new Date();
                const upcomingAppointments = appointments
                    .filter((apt) => new Date(apt.scheduledDateTime) > now &&
                    apt.status !== "CANCELLED")
                    .sort((a, b) => new Date(a.scheduledDateTime).getTime() -
                    new Date(b.scheduledDateTime).getTime());
                return upcomingAppointments[0] || null;
            }
            catch (error) {
                shared_1.logger.error("Error getting next appointment:", error);
                return null;
            }
        },
    },
};
exports.default = exports.patientResolvers;
//# sourceMappingURL=patient.resolvers.js.map