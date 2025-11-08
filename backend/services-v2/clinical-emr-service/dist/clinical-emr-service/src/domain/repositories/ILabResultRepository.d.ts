/**
 * ILabResultRepository - Domain Repository Interface
 * Defines contract for lab result persistence
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD
 */
import { LabResult, LabResultStatus, LabTestType } from '../aggregates/LabResult.aggregate';
export interface LabResultFilterCriteria {
    patientId?: string;
    medicalRecordId?: string;
    testType?: LabTestType;
    status?: LabResultStatus;
    orderedBy?: string;
    fromDate?: Date;
    toDate?: Date;
    priority?: string;
}
export interface ILabResultRepository {
    /**
     * Save new lab result
     */
    save(labResult: LabResult): Promise<void>;
    /**
     * Update existing lab result
     */
    update(labResult: LabResult): Promise<void>;
    /**
     * Find lab result by ID
     */
    findById(resultId: string): Promise<LabResult | null>;
    /**
     * Find lab results by patient ID
     */
    findByPatientId(patientId: string, limit?: number, offset?: number): Promise<LabResult[]>;
    /**
     * Find lab results by medical record ID
     */
    findByMedicalRecordId(medicalRecordId: string): Promise<LabResult[]>;
    /**
     * Find lab results with filters
     */
    findWithFilters(criteria: LabResultFilterCriteria, limit?: number, offset?: number): Promise<LabResult[]>;
    /**
     * Count lab results with filters
     */
    count(criteria: LabResultFilterCriteria): Promise<number>;
    /**
     * Delete lab result (soft delete)
     */
    delete(resultId: string): Promise<void>;
    /**
     * Check if lab result exists
     */
    exists(resultId: string): Promise<boolean>;
}
//# sourceMappingURL=ILabResultRepository.d.ts.map