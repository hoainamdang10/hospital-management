/**
 * BulkExportFHIRUseCase - Application Layer
 * HIPAA Compliance: Bulk FHIR R4 export for data portability
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, FHIR R4, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { IFHIRExportService } from '../../domain/services/IFHIRExportService';
export interface BulkExportFHIRRequest {
    patientIds?: string[];
    resourceTypes?: string[];
    startDate?: string;
    endDate?: string;
    format?: 'json' | 'xml' | 'ndjson';
    async?: boolean;
    requestedBy: string;
    requestedByRole: string;
}
export interface BulkExportFHIRResponse {
    success: boolean;
    message: string;
    data?: {
        jobId?: string;
        fhirBundle?: {
            resourceType: 'Bundle';
            type: 'collection';
            total: number;
            entry: Array<{
                fullUrl: string;
                resource: any;
            }>;
        };
        exportedAt: string;
        fhirVersion: string;
        format: string;
        statistics: {
            totalRecords: number;
            totalPatients: number;
            resourceCounts: Record<string, number>;
        };
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class BulkExportFHIRUseCase extends BaseHealthcareUseCase<BulkExportFHIRRequest, BulkExportFHIRResponse> {
    private readonly medicalRecordRepository;
    private readonly fhirExportService;
    constructor(medicalRecordRepository: IMedicalRecordRepository, fhirExportService: IFHIRExportService);
    execute(request: BulkExportFHIRRequest): Promise<BulkExportFHIRResponse>;
    protected executeInternal(request: BulkExportFHIRRequest): Promise<BulkExportFHIRResponse>;
    validate(request: BulkExportFHIRRequest): Promise<ValidationResult>;
    private isAuthorized;
    authorize(request: BulkExportFHIRRequest, userId: string): Promise<boolean>;
    involvesPHI(request: BulkExportFHIRRequest): boolean;
    getPatientId(request: BulkExportFHIRRequest): string | null;
    getDescription(): string;
    getRequiredPermissions(): string[];
}
//# sourceMappingURL=BulkExportFHIRUseCase.d.ts.map