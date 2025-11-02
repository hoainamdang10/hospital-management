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
export declare class LocalPatientReadModelService implements IPatientService {
    private readonly readModelRepo;
    constructor(readModelRepo: PatientReadModelRepository);
    /**
     * Get patient by ID (local query)
     */
    getPatient(patientId: string): Promise<PatientDTO | null>;
    /**
     * Get multiple patients by IDs (batch query)
     */
    getPatients(patientIds: string[]): Promise<PatientDTO[]>;
    /**
     * Check if patient exists in read model
     */
    exists(patientId: string): Promise<boolean>;
    /**
     * Get sync statistics (monitoring)
     */
    getSyncStats(): Promise<{
        totalPatients: number;
        lastSyncedAt: Date | null;
        syncLagSeconds: number | null;
    }>;
}
//# sourceMappingURL=LocalPatientReadModelService.d.ts.map