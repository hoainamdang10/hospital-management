/**
 * GetPatientMedicalRecordsUseCase - Application Layer
 * Use case for retrieving all medical records for a patient
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase, ValidationResult } from '../../../shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { GetPatientMedicalRecordsRequest, GetPatientMedicalRecordsResponse } from '../dto/GetPatientMedicalRecordsRequest';
export declare class GetPatientMedicalRecordsUseCase extends BaseHealthcareUseCase<GetPatientMedicalRecordsRequest, GetPatientMedicalRecordsResponse> {
    private readonly medicalRecordRepository;
    constructor(medicalRecordRepository: IMedicalRecordRepository);
    /**
     * Execute the use case
     */
    protected executeInternal(request: GetPatientMedicalRecordsRequest): Promise<GetPatientMedicalRecordsResponse>;
    /**
     * Build response with pagination and statistics
     */
    private buildResponse;
    /**
     * Calculate statistics for patient medical records
     */
    private calculateStatistics;
    /**
     * Validate request
     */
    validate(request: GetPatientMedicalRecordsRequest): Promise<ValidationResult>;
    /**
     * Check authorization
     */
    authorize(request: GetPatientMedicalRecordsRequest, userId: string): Promise<boolean>;
    /**
     * Check if involves PHI
     */
    involvesPHI(request: GetPatientMedicalRecordsRequest): boolean;
    /**
     * Get patient ID
     */
    getPatientId(request: GetPatientMedicalRecordsRequest): string | null;
    /**
     * Get use case description for audit
     */
    getDescription(): string;
    /**
     * Get required permissions
     */
    getRequiredPermissions(): string[];
    /**
     * Enhanced authorization with role-based access control
     */
    authorizeWithRoles(request: GetPatientMedicalRecordsRequest, userId: string, userRoles: string[]): Promise<boolean>;
    /**
     * Get audit information for this use case execution
     */
    getAuditInfo(request: GetPatientMedicalRecordsRequest): any;
    /**
     * Enhanced execute with role-based access control and performance optimization
     */
    executeWithRoles(request: GetPatientMedicalRecordsRequest, userId: string, userRoles: string[]): Promise<GetPatientMedicalRecordsResponse>;
    /**
     * Check if user can access archived records
     */
    private canAccessArchivedRecords;
}
//# sourceMappingURL=GetPatientMedicalRecordsUseCase.d.ts.map