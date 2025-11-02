/**
 * UpdateClinicalNoteUseCase - Application Layer
 * Use case for updating clinical note content
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IClinicalNoteRepository } from '../../domain/repositories/IClinicalNoteRepository';
import { UpdateClinicalNoteRequest, UpdateClinicalNoteResponse } from '../dto/ClinicalNoteRequest';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';
export declare class UpdateClinicalNoteUseCase extends BaseHealthcareUseCase<UpdateClinicalNoteRequest, UpdateClinicalNoteResponse> {
    private readonly clinicalNoteRepository;
    private readonly eventPublisher;
    constructor(clinicalNoteRepository: IClinicalNoteRepository, eventPublisher: IDomainEventPublisher);
    execute(request: UpdateClinicalNoteRequest): Promise<UpdateClinicalNoteResponse>;
    protected executeInternal(request: UpdateClinicalNoteRequest): Promise<UpdateClinicalNoteResponse>;
    validate(request: UpdateClinicalNoteRequest): Promise<ValidationResult>;
    authorize(request: UpdateClinicalNoteRequest, userId: string): Promise<boolean>;
    involvesPHI(request: UpdateClinicalNoteRequest): boolean;
    getPatientId(request: UpdateClinicalNoteRequest): string | null;
}
//# sourceMappingURL=UpdateClinicalNoteUseCase.d.ts.map