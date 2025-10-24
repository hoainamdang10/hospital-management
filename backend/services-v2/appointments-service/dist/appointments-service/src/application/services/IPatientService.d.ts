/**
 * Patient Service Interface - Application Layer
 * Interface for fetching patient data from Patient Registry Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Microservices
 */
export interface PatientDTO {
    patientId: string;
    fullName: string;
    phone?: string;
    email?: string;
    dateOfBirth?: Date;
    gender?: string;
    nationalId?: string;
    insuranceNumber?: string;
    insuranceType?: string;
    address?: string;
}
export interface IPatientService {
    /**
     * Get patient by ID from Patient Registry Service
     */
    getPatient(patientId: string): Promise<PatientDTO | null>;
    /**
     * Get multiple patients by IDs
     */
    getPatients(patientIds: string[]): Promise<PatientDTO[]>;
}
//# sourceMappingURL=IPatientService.d.ts.map