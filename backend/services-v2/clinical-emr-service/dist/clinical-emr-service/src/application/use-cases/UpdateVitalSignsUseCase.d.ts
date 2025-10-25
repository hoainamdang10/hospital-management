/**
 * UpdateVitalSignsUseCase - Application Layer
 * Use case for updating vital signs in medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';
export interface UpdateVitalSignsRequest {
    recordId: string;
    vitalSigns: {
        temperature?: number;
        bloodPressure?: string;
        heartRate?: number;
        weight?: number;
        height?: number;
    };
    updatedBy: string;
}
export interface UpdateVitalSignsResponse {
    success: boolean;
    message: string;
    data?: {
        recordId: string;
        vitalSigns: any;
        updatedAt: string;
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class UpdateVitalSignsUseCase extends BaseHealthcareUseCase<UpdateVitalSignsRequest, UpdateVitalSignsResponse> {
    private readonly medicalRecordRepository;
    private readonly eventPublisher;
    constructor(medicalRecordRepository: IMedicalRecordRepository, eventPublisher: IDomainEventPublisher);
    execute(request: UpdateVitalSignsRequest): Promise<UpdateVitalSignsResponse>;
    protected executeInternal(request: UpdateVitalSignsRequest): Promise<UpdateVitalSignsResponse>;
    validate(request: UpdateVitalSignsRequest): Promise<ValidationResult>;
    authorize(request: UpdateVitalSignsRequest, userId: string): Promise<boolean>;
    involvesPHI(request: UpdateVitalSignsRequest): boolean;
    getPatientId(request: UpdateVitalSignsRequest): string | null;
    getDescription(): string;
    getRequiredPermissions(): string[];
}
//# sourceMappingURL=UpdateVitalSignsUseCase.d.ts.map