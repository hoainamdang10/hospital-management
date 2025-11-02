/**
 * Local Patient Read Model Service
 * Replaces HttpPatientService with local read model queries (No HTTP)
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance CQRS, Zero HTTP Dependencies, Pure Outbox Pattern
 */

import { IPatientService, PatientDTO } from '../../application/services/IPatientService';
import { PatientReadModelRepository } from '../repositories/PatientReadModelRepository';
import { createLogger } from '../logging/Logger';

const logger = createLogger('LocalPatientReadModelService');

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
export class LocalPatientReadModelService implements IPatientService {
  constructor(private readonly readModelRepo: PatientReadModelRepository) {
    logger.info('Initialized (No HTTP dependencies)');
  }

  /**
   * Get patient by ID (local query)
   */
  async getPatient(patientId: string): Promise<PatientDTO | null> {
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
    } catch (error) {
      console.error(`[LocalPatientReadModelService] Error fetching patient ${patientId}:`, error);
      throw new Error(`Failed to fetch patient from read model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get multiple patients by IDs (batch query)
   */
  async getPatients(patientIds: string[]): Promise<PatientDTO[]> {
    try {
      if (patientIds.length === 0) return [];

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
    } catch (error) {
      console.error('[LocalPatientReadModelService] Error fetching patients:', error);
      throw new Error(`Failed to fetch patients from read model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if patient exists in read model
   */
  async exists(patientId: string): Promise<boolean> {
    try {
      return await this.readModelRepo.exists(patientId);
    } catch (error) {
      console.error(`[LocalPatientReadModelService] Error checking patient existence ${patientId}:`, error);
      return false;
    }
  }

  /**
   * Get sync statistics (monitoring)
   */
  async getSyncStats(): Promise<{
    totalPatients: number;
    lastSyncedAt: Date | null;
    syncLagSeconds: number | null;
  }> {
    try {
      return await this.readModelRepo.getSyncStats();
    } catch (error) {
      console.error('[LocalPatientReadModelService] Error getting sync stats:', error);
      return {
        totalPatients: 0,
        lastSyncedAt: null,
        syncLagSeconds: null
      };
    }
  }
}
