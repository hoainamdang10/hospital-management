/**
 * ExportToFHIRUseCase - Application Layer
 * Use case for exporting medical record to FHIR format
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
export interface ExportToFHIRRequest {
    recordId: string;
    fhirProfile?: string;
    includeReferences?: boolean;
    requestedBy: string;
}
export interface ExportToFHIRResponse {
    success: boolean;
    message: string;
    data?: {
        fhirResource: any;
        resourceType: string;
        fhirVersion: string;
        exportedAt: string;
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class ExportToFHIRUseCase extends BaseHealthcareUseCase<ExportToFHIRRequest, ExportToFHIRResponse> {
    private readonly medicalRecordRepository;
    constructor(medicalRecordRepository: IMedicalRecordRepository);
    execute(request: ExportToFHIRRequest): Promise<ExportToFHIRResponse>;
    protected executeInternal(request: ExportToFHIRRequest): Promise<ExportToFHIRResponse>;
    validate(request: ExportToFHIRRequest): Promise<ValidationResult>;
    authorize(request: ExportToFHIRRequest, userId: string): Promise<boolean>;
    involvesPHI(request: ExportToFHIRRequest): boolean;
    getPatientId(request: ExportToFHIRRequest): string | null;
    getDescription(): string;
    getRequiredPermissions(): string[];
}
//# sourceMappingURL=ExportToFHIRUseCase.d.ts.map