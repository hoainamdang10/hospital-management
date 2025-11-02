"use strict";
/**
 * Local Patient Read Model Service
 * Replaces HttpPatientService with local read model queries (No HTTP)
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance CQRS, Zero HTTP Dependencies, Pure Outbox Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalPatientReadModelService = void 0;
const Logger_1 = require("../logging/Logger");
const logger = (0, Logger_1.createLogger)('LocalPatientReadModelService');
/**
 * Local Patient Service - Pure Outbox Pattern
 *
 * Benefits:
 * - No HTTP calls (no network errors, timeouts, circuit breakers)
 * - Fast local queries (<10ms vs 100-500ms HTTP)
 * - Always available (no dependency on Patient Service uptime)
 * - Eventual consistency via event sourcing
 *
 * Trade-offs:
 * - Data may be slightly stale (target sync lag: <5s)
 * - Requires event consumers to keep read model updated
 */
class LocalPatientReadModelService {
    constructor(readModelRepo) {
        this.readModelRepo = readModelRepo;
        logger.info('Initialized (No HTTP dependencies)');
    }
    /**
     * Get patient by ID (local query)
     */
    async getPatient(patientId) {
        try {
            const patient = await this.readModelRepo.findById(patientId);
            if (!patient) {
                logger.debug('Patient not found in read model', { patientId });
                return null;
            }
            return {
                patientId: patient.patientId,
                fullName: patient.fullName,
                phone: patient.phone,
                email: patient.email,
                dateOfBirth: patient.dateOfBirth,
                gender: patient.gender,
                nationalId: patient.nationalId,
                insuranceNumber: patient.insuranceNumber,
                insuranceType: patient.insuranceType,
                address: patient.address
            };
        }
        catch (error) {
            console.error(`[LocalPatientReadModelService] Error fetching patient ${patientId}:`, error);
            throw new Error(`Failed to fetch patient from read model: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get multiple patients by IDs (batch query)
     */
    async getPatients(patientIds) {
        try {
            if (patientIds.length === 0)
                return [];
            const patients = await this.readModelRepo.findByIds(patientIds);
            return patients.map(patient => ({
                patientId: patient.patientId,
                fullName: patient.fullName,
                phone: patient.phone,
                email: patient.email,
                dateOfBirth: patient.dateOfBirth,
                gender: patient.gender,
                nationalId: patient.nationalId,
                insuranceNumber: patient.insuranceNumber,
                insuranceType: patient.insuranceType,
                address: patient.address
            }));
        }
        catch (error) {
            console.error('[LocalPatientReadModelService] Error fetching patients:', error);
            throw new Error(`Failed to fetch patients from read model: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Check if patient exists in read model
     */
    async exists(patientId) {
        try {
            return await this.readModelRepo.exists(patientId);
        }
        catch (error) {
            console.error(`[LocalPatientReadModelService] Error checking patient existence ${patientId}:`, error);
            return false;
        }
    }
    /**
     * Get sync statistics (monitoring)
     */
    async getSyncStats() {
        try {
            return await this.readModelRepo.getSyncStats();
        }
        catch (error) {
            console.error('[LocalPatientReadModelService] Error getting sync stats:', error);
            return {
                totalPatients: 0,
                lastSyncedAt: null,
                syncLagSeconds: null
            };
        }
    }
}
exports.LocalPatientReadModelService = LocalPatientReadModelService;
//# sourceMappingURL=LocalPatientReadModelService.js.map