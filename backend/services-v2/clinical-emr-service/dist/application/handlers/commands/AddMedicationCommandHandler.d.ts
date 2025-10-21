/**
 * AddMedicationCommandHandler - Application Layer
 * Command handler for adding medication to medical records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase, ValidationResult } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../../domain/repositories/IMedicalRecordRepository';
import { IDomainEventPublisher } from '../../../../shared/domain/events/IDomainEventPublisher';
import { DosageForm, RouteOfAdministration, FrequencyUnit } from '../../../domain/value-objects/Medication';
/**
 * Add Medication Command
 */
export interface AddMedicationCommand {
    recordId: string;
    medicationCode: string;
    medicationName: string;
    strength: string;
    dosageForm: DosageForm;
    route: RouteOfAdministration;
    dosage: string;
    frequency: string;
    frequencyUnit: FrequencyUnit;
    instructions: string;
    prescribedBy: string;
    genericName?: string;
    brandName?: string;
    duration?: string;
    specialInstructions?: string;
    startDate?: string;
    endDate?: string;
    vietnameseDrugCode?: string;
    registrationNumber?: string;
    manufacturer?: string;
    contraindications?: string[];
    sideEffects?: string[];
    interactions?: string[];
    allergies?: string[];
    notes?: string;
    priority?: 'routine' | 'urgent' | 'stat';
}
/**
 * Add Medication Response
 */
export interface AddMedicationResponse {
    success: boolean;
    message: string;
    data?: {
        recordId: string;
        medicationCode: string;
        medicationName: string;
        dosage: string;
        frequency: string;
        instructions: string;
        prescribedAt: string;
        prescribedBy: string;
        fhirCompliant: boolean;
        vietnameseSummary: string;
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
/**
 * Add Medication Command Handler
 */
export declare class AddMedicationCommandHandler extends BaseHealthcareUseCase<AddMedicationCommand, AddMedicationResponse> {
    private readonly medicalRecordRepository;
    private readonly eventPublisher;
    constructor(medicalRecordRepository: IMedicalRecordRepository, eventPublisher: IDomainEventPublisher);
    /**
     * Execute the command
     */
    protected executeInternal(command: AddMedicationCommand): Promise<AddMedicationResponse>;
    /**
     * Create medication value object from command
     */
    private createMedication;
    /**
     * Validate FHIR compliance
     */
    private validateFHIRCompliance;
    /**
     * Validate command
     */
    validate(command: AddMedicationCommand): Promise<ValidationResult>;
    /**
     * Check authorization
     */
    authorize(command: AddMedicationCommand, userId: string): Promise<boolean>;
    /**
     * Check if involves PHI
     */
    involvesPHI(command: AddMedicationCommand): boolean;
    /**
     * Get patient ID
     */
    getPatientId(command: AddMedicationCommand): string | null;
    /**
     * Get use case description
     */
    getDescription(): string;
    /**
     * Get required permissions
     */
    getRequiredPermissions(): string[];
}
//# sourceMappingURL=AddMedicationCommandHandler.d.ts.map