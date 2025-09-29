"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDataLoaders = createDataLoaders;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const dataloader_1 = __importDefault(require("dataloader"));
/**
 * DataLoader factory for N+1 query optimization
 * Creates batched loaders for efficient data fetching from REST APIs
 */
function createDataLoaders(restApi) {
    return {
        // Doctor DataLoaders
        doctorById: new dataloader_1.default(async (ids) => {
            return batchLoadDoctors(restApi, Array.from(ids));
        }, {
            cacheKeyFn: (key) => `doctor:${key}`,
            maxBatchSize: 100,
            batchScheduleFn: (callback) => setTimeout(callback, 10),
        }),
        doctorsByDepartment: new dataloader_1.default(async (departmentIds) => {
            return batchLoadDoctorsByDepartment(restApi, Array.from(departmentIds));
        }, {
            cacheKeyFn: (key) => `doctors_by_dept:${key}`,
            maxBatchSize: 50,
        }),
        // Patient DataLoaders
        patientById: new dataloader_1.default(async (ids) => {
            return batchLoadPatients(restApi, Array.from(ids));
        }, {
            cacheKeyFn: (key) => `patient:${key}`,
            maxBatchSize: 100,
            batchScheduleFn: (callback) => setTimeout(callback, 10),
        }),
        // Appointment DataLoaders
        appointmentById: new dataloader_1.default(async (ids) => {
            return batchLoadAppointments(restApi, Array.from(ids));
        }, {
            cacheKeyFn: (key) => `appointment:${key}`,
            maxBatchSize: 100,
        }),
        appointmentsByDoctor: new dataloader_1.default(async (doctorIds) => {
            return batchLoadAppointmentsByDoctor(restApi, Array.from(doctorIds));
        }, {
            cacheKeyFn: (key) => `appointments_by_doctor:${key}`,
            maxBatchSize: 50,
        }),
        appointmentsByPatient: new dataloader_1.default(async (patientIds) => {
            return batchLoadAppointmentsByPatient(restApi, Array.from(patientIds));
        }, {
            cacheKeyFn: (key) => `appointments_by_patient:${key}`,
            maxBatchSize: 50,
        }),
        // Department DataLoaders
        departmentById: new dataloader_1.default(async (ids) => {
            return batchLoadDepartments(restApi, Array.from(ids));
        }, {
            cacheKeyFn: (key) => `department:${key}`,
            maxBatchSize: 50,
        }),
        // Medical Record DataLoaders
        medicalRecordsByPatient: new dataloader_1.default(async (patientIds) => {
            return batchLoadMedicalRecordsByPatient(restApi, Array.from(patientIds));
        }, {
            cacheKeyFn: (key) => `medical_records_by_patient:${key}`,
            maxBatchSize: 50,
        }),
        // Doctor Statistics DataLoaders
        doctorStats: new dataloader_1.default(async (doctorIds) => {
            return batchLoadDoctorStats(restApi, Array.from(doctorIds));
        }, {
            cacheKeyFn: (key) => `doctor_stats:${key}`,
            maxBatchSize: 50,
            cache: true,
        }),
        // Doctor Reviews DataLoaders
        doctorReviews: new dataloader_1.default(async (doctorIds) => {
            return batchLoadDoctorReviews(restApi, Array.from(doctorIds));
        }, {
            cacheKeyFn: (key) => `doctor_reviews:${key}`,
            maxBatchSize: 50,
        }),
        // Available Slots DataLoaders
        availableSlots: new dataloader_1.default(async (keys) => {
            // Key format: "doctor_id:date"
            return batchLoadAvailableSlots(restApi, Array.from(keys));
        }, {
            cacheKeyFn: (key) => `available_slots:${key}`,
            maxBatchSize: 20,
        }),
    };
}
/**
 * Batch load doctors by IDs
 */
async function batchLoadDoctors(restApi, ids) {
    try {
        logger_1.default.debug("Batch loading doctors:", { ids, count: ids.length });
        // Create batch requests for each doctor
        const requests = ids.map((id) => ({
            method: "GET",
            url: `/api/doctors/${id}`,
        }));
        const responses = await restApi.batchRequest(requests);
        // Map responses back to the original order
        return responses.map((response, index) => {
            if (response.success) {
                return response.data;
            }
            else {
                logger_1.default.warn(`Failed to load doctor ${ids[index]}:`, response.error);
                return null;
            }
        });
    }
    catch (error) {
        logger_1.default.error("Batch load doctors error:", error);
        return ids.map(() => null);
    }
}
/**
 * Batch load doctors by department
 */
async function batchLoadDoctorsByDepartment(restApi, departmentIds) {
    try {
        logger_1.default.debug("Batch loading doctors by department:", {
            departmentIds,
            count: departmentIds.length,
        });
        const requests = departmentIds.map((departmentId) => ({
            method: "GET",
            url: "/api/doctors",
            params: { departmentId, limit: 100 },
        }));
        const responses = await restApi.batchRequest(requests);
        return responses.map((response, index) => {
            if (response.success && Array.isArray(response.data)) {
                return response.data;
            }
            else {
                logger_1.default.warn(`Failed to load doctors for department ${departmentIds[index]}:`, response.error);
                return [];
            }
        });
    }
    catch (error) {
        logger_1.default.error("Batch load doctors by department error:", error);
        return departmentIds.map(() => []);
    }
}
/**
 * Batch load patients by IDs
 */
async function batchLoadPatients(restApi, ids) {
    try {
        logger_1.default.debug("Batch loading patients:", { ids, count: ids.length });
        const requests = ids.map((id) => ({
            method: "GET",
            url: `/api/patients/${id}`,
        }));
        const responses = await restApi.batchRequest(requests);
        return responses.map((response, index) => {
            if (response.success) {
                return response.data;
            }
            else {
                logger_1.default.warn(`Failed to load patient ${ids[index]}:`, response.error);
                return null;
            }
        });
    }
    catch (error) {
        logger_1.default.error("Batch load patients error:", error);
        return ids.map(() => null);
    }
}
/**
 * Batch load appointments by IDs
 */
async function batchLoadAppointments(restApi, ids) {
    try {
        logger_1.default.debug("Batch loading appointments:", { ids, count: ids.length });
        const requests = ids.map((id) => ({
            method: "GET",
            url: `/api/appointments/${id}`,
        }));
        const responses = await restApi.batchRequest(requests);
        return responses.map((response, index) => {
            if (response.success) {
                return response.data;
            }
            else {
                logger_1.default.warn(`Failed to load appointment ${ids[index]}:`, response.error);
                return null;
            }
        });
    }
    catch (error) {
        logger_1.default.error("Batch load appointments error:", error);
        return ids.map(() => null);
    }
}
/**
 * Batch load appointments by doctor
 */
async function batchLoadAppointmentsByDoctor(restApi, doctorIds) {
    try {
        logger_1.default.debug("Batch loading appointments by doctor:", {
            doctorIds,
            count: doctorIds.length,
        });
        const requests = doctorIds.map((doctor_id) => ({
            method: "GET",
            url: "/api/appointments",
            params: { doctor_id, limit: 100 },
        }));
        const responses = await restApi.batchRequest(requests);
        return responses.map((response, index) => {
            if (response.success && Array.isArray(response.data)) {
                return response.data;
            }
            else {
                logger_1.default.warn(`Failed to load appointments for doctor ${doctorIds[index]}:`, response.error);
                return [];
            }
        });
    }
    catch (error) {
        logger_1.default.error("Batch load appointments by doctor error:", error);
        return doctorIds.map(() => []);
    }
}
/**
 * Batch load appointments by patient
 */
async function batchLoadAppointmentsByPatient(restApi, patientIds) {
    try {
        logger_1.default.debug("Batch loading appointments by patient:", {
            patientIds,
            count: patientIds.length,
        });
        const requests = patientIds.map((patient_id) => ({
            method: "GET",
            url: "/api/appointments",
            params: { patient_id, limit: 100 },
        }));
        const responses = await restApi.batchRequest(requests);
        return responses.map((response, index) => {
            if (response.success && Array.isArray(response.data)) {
                return response.data;
            }
            else {
                logger_1.default.warn(`Failed to load appointments for patient ${patientIds[index]}:`, response.error);
                return [];
            }
        });
    }
    catch (error) {
        logger_1.default.error("Batch load appointments by patient error:", error);
        return patientIds.map(() => []);
    }
}
/**
 * Batch load departments by IDs
 */
async function batchLoadDepartments(restApi, ids) {
    try {
        logger_1.default.debug("Batch loading departments:", { ids, count: ids.length });
        const requests = ids.map((id) => ({
            method: "GET",
            url: `/api/departments/${id}`,
        }));
        const responses = await restApi.batchRequest(requests);
        return responses.map((response, index) => {
            if (response.success) {
                return response.data;
            }
            else {
                logger_1.default.warn(`Failed to load department ${ids[index]}:`, response.error);
                return null;
            }
        });
    }
    catch (error) {
        logger_1.default.error("Batch load departments error:", error);
        return ids.map(() => null);
    }
}
/**
 * Batch load medical records by patient
 */
async function batchLoadMedicalRecordsByPatient(restApi, patientIds) {
    try {
        logger_1.default.debug("Batch loading medical records by patient:", {
            patientIds,
            count: patientIds.length,
        });
        const requests = patientIds.map((patient_id) => ({
            method: "GET",
            url: "/api/medical-records",
            params: { patient_id, limit: 50 },
        }));
        const responses = await restApi.batchRequest(requests);
        return responses.map((response, index) => {
            if (response.success && Array.isArray(response.data)) {
                return response.data;
            }
            else {
                logger_1.default.warn(`Failed to load medical records for patient ${patientIds[index]}:`, response.error);
                return [];
            }
        });
    }
    catch (error) {
        logger_1.default.error("Batch load medical records by patient error:", error);
        return patientIds.map(() => []);
    }
}
/**
 * Batch load doctor statistics
 */
async function batchLoadDoctorStats(restApi, doctorIds) {
    try {
        logger_1.default.debug("Batch loading doctor stats:", {
            doctorIds,
            count: doctorIds.length,
        });
        const requests = doctorIds.map((doctor_id) => ({
            method: "GET",
            url: `/api/doctors/${doctor_id}/stats`,
        }));
        const responses = await restApi.batchRequest(requests);
        return responses.map((response, index) => {
            if (response.success) {
                return response.data;
            }
            else {
                logger_1.default.warn(`Failed to load stats for doctor ${doctorIds[index]}:`, response.error);
                return null;
            }
        });
    }
    catch (error) {
        logger_1.default.error("Batch load doctor stats error:", error);
        return doctorIds.map(() => null);
    }
}
/**
 * Batch load doctor reviews
 */
async function batchLoadDoctorReviews(restApi, doctorIds) {
    try {
        logger_1.default.debug("Batch loading doctor reviews:", {
            doctorIds,
            count: doctorIds.length,
        });
        const requests = doctorIds.map((doctor_id) => ({
            method: "GET",
            url: `/api/doctors/${doctor_id}/reviews`,
            params: { limit: 20 },
        }));
        const responses = await restApi.batchRequest(requests);
        return responses.map((response, index) => {
            if (response.success && Array.isArray(response.data)) {
                return response.data;
            }
            else {
                logger_1.default.warn(`Failed to load reviews for doctor ${doctorIds[index]}:`, response.error);
                return [];
            }
        });
    }
    catch (error) {
        logger_1.default.error("Batch load doctor reviews error:", error);
        return doctorIds.map(() => []);
    }
}
/**
 * Batch load available slots
 */
async function batchLoadAvailableSlots(restApi, keys) {
    try {
        logger_1.default.debug("Batch loading available slots:", {
            keys,
            count: keys.length,
        });
        const requests = keys.map((key) => {
            const [doctor_id, date] = key.split(":");
            return {
                method: "GET",
                url: "/api/appointments/available-slots",
                params: { doctor_id, date },
            };
        });
        const responses = await restApi.batchRequest(requests);
        return responses.map((response, index) => {
            if (response.success && Array.isArray(response.data)) {
                return response.data;
            }
            else {
                logger_1.default.warn(`Failed to load available slots for ${keys[index]}:`, response.error);
                return [];
            }
        });
    }
    catch (error) {
        logger_1.default.error("Batch load available slots error:", error);
        return keys.map(() => []);
    }
}
exports.default = createDataLoaders;
//# sourceMappingURL=index.js.map