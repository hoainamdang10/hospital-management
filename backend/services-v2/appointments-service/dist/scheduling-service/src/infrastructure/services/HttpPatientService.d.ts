/**
 * HTTP Patient Service - Infrastructure Layer
 * Fetches patient data from Patient Registry Service via HTTP
 *
 * Features:
 * - Circuit breaker pattern for resilience
 * - Exponential backoff retry logic
 * - Redis cache fallback
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, Microservices, Resilience Patterns
 */
import { IPatientService, PatientDTO } from '../../application/services/IPatientService';
import { RedisCacheService } from '../cache/RedisCacheService';
export declare class HttpPatientService implements IPatientService {
    private client;
    private cache;
    private serviceName;
    constructor(baseUrl: string, cache?: RedisCacheService);
    /**
     * Setup exponential backoff retry logic
     */
    private setupRetryLogic;
    /**
     * Get patient by ID with circuit breaker and cache fallback
     */
    getPatient(patientId: string): Promise<PatientDTO | null>;
    /**
     * Get multiple patients by IDs
     */
    getPatients(patientIds: string[]): Promise<PatientDTO[]>;
    /**
     * Map API response to DTO
     */
    private mapToDTO;
}
//# sourceMappingURL=HttpPatientService.d.ts.map