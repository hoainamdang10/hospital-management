import { CreateDiagnosisRequest, Diagnosis, FHIRPatient, FHIRPractitioner, FHIRValidationResult, ICD10Code, ICD10SearchResult, UpdateDiagnosisRequest } from "../types/healthcare.types";
export declare class HealthcareService {
    private icd10Codes;
    constructor();
    /**
     * Convert doctor data to FHIR Practitioner format
     */
    convertDoctorToFHIR(doctorId: string): Promise<FHIRPractitioner>;
    /**
     * Validate FHIR Practitioner resource
     */
    validateFHIRPractitioner(practitioner: FHIRPractitioner): Promise<FHIRValidationResult>;
    /**
     * Search ICD-10 codes
     */
    searchICD10Codes(query: string, limit?: number): Promise<ICD10SearchResult>;
    /**
     * Validate ICD-10 code
     */
    validateICD10Code(code: string): Promise<{
        isValid: boolean;
        code?: ICD10Code;
    }>;
    /**
     * Get ICD-10 codes by category
     */
    getICD10CodesByCategory(category: string): Promise<ICD10Code[]>;
    /**
     * Create diagnosis (placeholder)
     */
    createDiagnosis(diagnosisData: CreateDiagnosisRequest): Promise<Diagnosis>;
    /**
     * Update diagnosis (placeholder)
     */
    updateDiagnosis(diagnosisId: string, updateData: UpdateDiagnosisRequest): Promise<Diagnosis>;
    /**
     * Get patient diagnoses (placeholder)
     */
    getPatientDiagnoses(patientId: string): Promise<Diagnosis[]>;
    /**
     * Initialize sample ICD-10 codes
     */
    private initializeICD10Codes;
    /**
     * Convert patient data to FHIR Patient format
     */
    convertPatientToFHIR(patientId: string): Promise<FHIRPatient>;
    /**
     * Validate FHIR Patient resource
     */
    validateFHIRPatient(patient: FHIRPatient): Promise<FHIRValidationResult>;
}
//# sourceMappingURL=healthcare.service.d.ts.map