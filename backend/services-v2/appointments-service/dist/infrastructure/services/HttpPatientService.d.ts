/**
 * HTTP Patient Service - Infrastructure Layer
 * Fetches patient data from Patient Registry Service via HTTP
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Microservices
 */
import { IPatientService, PatientDTO } from '../../application/services/IPatientService';
export declare class HttpPatientService implements IPatientService {
    private client;
    constructor(baseUrl: string);
    /**
     * Get patient by ID
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