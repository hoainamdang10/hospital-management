/**
 * GetMedicalRecordUseCase - Application Layer
 * Use case for retrieving medical records by ID
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase, ValidationResult } from '../../../shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { GetMedicalRecordRequest, GetMedicalRecordResponse } from '../dto/GetMedicalRecordRequest';
export declare class GetMedicalRecordUseCase extends BaseHealthcareUseCase<GetMedicalRecordRequest, GetMedicalRecordResponse> {
    private readonly medicalRecordRepository;
    constructor(medicalRecordRepository: IMedicalRecordRepository);
    /**
     * Execute the use case
     */
    protected executeInternal(request: GetMedicalRecordRequest): Promise<GetMedicalRecordResponse>;
    /**
     * Validate request
     */
    validate(request: GetMedicalRecordRequest): Promise<ValidationResult>;
    /**
     * Check authorization
     */
    authorize(request: GetMedicalRecordRequest, userId: string): Promise<boolean>;
    /**
     * Check if involves PHI
     */
    involvesPHI(request: GetMedicalRecordRequest): boolean;
    /**
     * Get patient ID
     */
    getPatientId(request: GetMedicalRecordRequest): string | null;
    /**
     * Get patient ID from medical record (helper method)
     */
    private getPatientIdFromRecord;
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
    authorizeWithRoles(request: GetMedicalRecordRequest, userId: string, userRoles: string[]): Promise<boolean>;
    /**
     * Get audit information for this use case execution
     */
    getAuditInfoAsync(request: GetMedicalRecordRequest): Promise<any>;
    /**
     * Check if user can access archived records
     */
    private canAccessArchivedRecords;
    /**
     * Enhanced execute with role-based access control
     */
    executeWithRoles(request: GetMedicalRecordRequest, userId: string, userRoles: string[]): Promise<GetMedicalRecordResponse>;
}
//# sourceMappingURL=GetMedicalRecordUseCase.d.ts.map