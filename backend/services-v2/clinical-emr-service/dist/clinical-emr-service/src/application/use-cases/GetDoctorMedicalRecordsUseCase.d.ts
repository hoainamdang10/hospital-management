/**
 * GetDoctorMedicalRecordsUseCase - Application Layer
 * Use case for retrieving all medical records by doctor
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { MedicalRecordStatus } from '../../domain/aggregates/clinical.aggregate';
export interface GetDoctorMedicalRecordsRequest {
    doctorId: string;
    status?: MedicalRecordStatus;
    page?: number;
    pageSize?: number;
    requestedBy: string;
}
export interface GetDoctorMedicalRecordsResponse {
    success: boolean;
    message: string;
    data?: {
        records: any[];
        pagination: {
            totalCount: number;
            page: number;
            pageSize: number;
            totalPages: number;
        };
        statistics: {
            totalRecords: number;
            totalPatients: number;
            recordsThisMonth: number;
        };
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class GetDoctorMedicalRecordsUseCase extends BaseHealthcareUseCase<GetDoctorMedicalRecordsRequest, GetDoctorMedicalRecordsResponse> {
    private readonly medicalRecordRepository;
    constructor(medicalRecordRepository: IMedicalRecordRepository);
    execute(request: GetDoctorMedicalRecordsRequest): Promise<GetDoctorMedicalRecordsResponse>;
    protected executeInternal(request: GetDoctorMedicalRecordsRequest): Promise<GetDoctorMedicalRecordsResponse>;
    validate(request: GetDoctorMedicalRecordsRequest): Promise<ValidationResult>;
    authorize(request: GetDoctorMedicalRecordsRequest, userId: string): Promise<boolean>;
    involvesPHI(request: GetDoctorMedicalRecordsRequest): boolean;
    getPatientId(request: GetDoctorMedicalRecordsRequest): string | null;
    getDescription(): string;
    getRequiredPermissions(): string[];
}
//# sourceMappingURL=GetDoctorMedicalRecordsUseCase.d.ts.map