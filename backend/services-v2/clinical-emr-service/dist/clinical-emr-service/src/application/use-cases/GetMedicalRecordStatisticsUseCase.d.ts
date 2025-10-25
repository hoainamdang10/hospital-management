/**
 * GetMedicalRecordStatisticsUseCase - Application Layer
 * Use case for getting medical record statistics
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
export interface GetMedicalRecordStatisticsRequest {
    requestedBy: string;
    patientId?: string;
    doctorId?: string;
    dateFrom?: string;
    dateTo?: string;
}
export interface GetMedicalRecordStatisticsResponse {
    success: boolean;
    message: string;
    data?: {
        overview: {
            totalRecords: number;
            activeRecords: number;
            archivedRecords: number;
            recordsThisMonth: number;
            recordsThisYear: number;
        };
        byStatus: Record<string, number>;
        bySpecialty: Record<string, number>;
        trends: {
            dailyAverage: number;
            weeklyAverage: number;
            monthlyAverage: number;
        };
        topDiagnoses: Array<{
            code: string;
            count: number;
        }>;
        topMedications: Array<{
            code: string;
            count: number;
        }>;
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class GetMedicalRecordStatisticsUseCase extends BaseHealthcareUseCase<GetMedicalRecordStatisticsRequest, GetMedicalRecordStatisticsResponse> {
    private readonly medicalRecordRepository;
    constructor(medicalRecordRepository: IMedicalRecordRepository);
    execute(request: GetMedicalRecordStatisticsRequest): Promise<GetMedicalRecordStatisticsResponse>;
    protected executeInternal(request: GetMedicalRecordStatisticsRequest): Promise<GetMedicalRecordStatisticsResponse>;
    validate(request: GetMedicalRecordStatisticsRequest): Promise<ValidationResult>;
    authorize(request: GetMedicalRecordStatisticsRequest, userId: string): Promise<boolean>;
    involvesPHI(request: GetMedicalRecordStatisticsRequest): boolean;
    getPatientId(request: GetMedicalRecordStatisticsRequest): string | null;
    getDescription(): string;
    getRequiredPermissions(): string[];
}
//# sourceMappingURL=GetMedicalRecordStatisticsUseCase.d.ts.map