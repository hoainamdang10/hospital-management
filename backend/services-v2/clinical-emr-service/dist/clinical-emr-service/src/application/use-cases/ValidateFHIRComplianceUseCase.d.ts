/**
 * ValidateFHIRComplianceUseCase - Application Layer
 * Use case for validating FHIR compliance of medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
export interface ValidateFHIRComplianceRequest {
    recordId: string;
    requestedBy: string;
}
export interface ValidateFHIRComplianceResponse {
    success: boolean;
    message: string;
    data?: {
        recordId: string;
        isCompliant: boolean;
        validationErrors: string[];
        fhirVersion: string;
        validatedAt: string;
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class ValidateFHIRComplianceUseCase extends BaseHealthcareUseCase<ValidateFHIRComplianceRequest, ValidateFHIRComplianceResponse> {
    private readonly medicalRecordRepository;
    constructor(medicalRecordRepository: IMedicalRecordRepository);
    execute(request: ValidateFHIRComplianceRequest): Promise<ValidateFHIRComplianceResponse>;
    protected executeInternal(request: ValidateFHIRComplianceRequest): Promise<ValidateFHIRComplianceResponse>;
    validate(request: ValidateFHIRComplianceRequest): Promise<ValidationResult>;
    authorize(request: ValidateFHIRComplianceRequest, userId: string): Promise<boolean>;
    involvesPHI(request: ValidateFHIRComplianceRequest): boolean;
    getPatientId(request: ValidateFHIRComplianceRequest): string | null;
    getDescription(): string;
    getRequiredPermissions(): string[];
}
//# sourceMappingURL=ValidateFHIRComplianceUseCase.d.ts.map