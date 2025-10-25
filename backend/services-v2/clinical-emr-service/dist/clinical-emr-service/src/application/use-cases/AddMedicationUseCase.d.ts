/**
 * AddMedicationUseCase - Application Layer
 * Use case for adding medication to medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { DosageForm, RouteOfAdministration, FrequencyUnit } from '../../domain/value-objects/Medication';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';
export interface AddMedicationRequest {
    recordId: string;
    code: string;
    name: string;
    strength?: string;
    dosageForm?: DosageForm;
    route?: RouteOfAdministration;
    dosage?: string;
    frequency?: number;
    frequencyUnit?: FrequencyUnit;
    instructions?: string;
    prescribedBy: string;
}
export interface AddMedicationResponse {
    success: boolean;
    message: string;
    data?: {
        recordId: string;
        medicationCode: string;
        addedAt: string;
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
export declare class AddMedicationUseCase extends BaseHealthcareUseCase<AddMedicationRequest, AddMedicationResponse> {
    private readonly medicalRecordRepository;
    private readonly eventPublisher;
    constructor(medicalRecordRepository: IMedicalRecordRepository, eventPublisher: IDomainEventPublisher);
    execute(request: AddMedicationRequest): Promise<AddMedicationResponse>;
    protected executeInternal(request: AddMedicationRequest): Promise<AddMedicationResponse>;
    validate(request: AddMedicationRequest): Promise<ValidationResult>;
    authorize(request: AddMedicationRequest, userId: string): Promise<boolean>;
    involvesPHI(request: AddMedicationRequest): boolean;
    getPatientId(request: AddMedicationRequest): string | null;
    getDescription(): string;
    getRequiredPermissions(): string[];
}
//# sourceMappingURL=AddMedicationUseCase.d.ts.map