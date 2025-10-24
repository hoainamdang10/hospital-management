"use strict";
/**
 * HTTP Patient Service - Infrastructure Layer
 * Fetches patient data from Patient Registry Service via HTTP
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Microservices
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpPatientService = void 0;
const axios_1 = __importDefault(require("axios"));
class HttpPatientService {
    constructor(baseUrl) {
        this.client = axios_1.default.create({
            baseURL: baseUrl,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    /**
     * Get patient by ID
     */
    async getPatient(patientId) {
        try {
            const response = await this.client.get(`/api/patients/${patientId}`);
            if (!response.data) {
                return null;
            }
            return this.mapToDTO(response.data);
        }
        catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            console.error(`[HttpPatientService] Failed to fetch patient ${patientId}:`, error.message);
            throw new Error(`Failed to fetch patient: ${error.message}`);
        }
    }
    /**
     * Get multiple patients by IDs
     */
    async getPatients(patientIds) {
        try {
            const promises = patientIds.map(id => this.getPatient(id));
            const results = await Promise.all(promises);
            return results.filter((patient) => patient !== null);
        }
        catch (error) {
            console.error('[HttpPatientService] Failed to fetch patients:', error.message);
            throw new Error(`Failed to fetch patients: ${error.message}`);
        }
    }
    /**
     * Map API response to DTO
     */
    mapToDTO(data) {
        return {
            patientId: data.patient_id || data.patientId,
            fullName: data.full_name || data.fullName,
            phone: data.phone,
            email: data.email,
            dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
            gender: data.gender,
            nationalId: data.national_id || data.nationalId,
            insuranceNumber: data.insurance_number || data.insuranceNumber,
            insuranceType: data.insurance_type || data.insuranceType,
            address: data.address
        };
    }
}
exports.HttpPatientService = HttpPatientService;
//# sourceMappingURL=HttpPatientService.js.map