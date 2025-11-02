/**
 * CreateClinicalNoteUseCase - Application Layer
 * Use case for creating new clinical notes
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IClinicalNoteRepository } from '../../domain/repositories/IClinicalNoteRepository';
import { CreateClinicalNoteRequest, CreateClinicalNoteResponse } from '../dto/ClinicalNoteRequest';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';
export declare class CreateClinicalNoteUseCase extends BaseHealthcareUseCase<CreateClinicalNoteRequest, CreateClinicalNoteResponse> {
    private readonly clinicalNoteRepository;
    private readonly eventPublisher;
    constructor(clinicalNoteRepository: IClinicalNoteRepository, eventPublisher: IDomainEventPublisher);
    execute(request: CreateClinicalNoteRequest): Promise<CreateClinicalNoteResponse>;
    protected executeInternal(request: CreateClinicalNoteRequest): Promise<CreateClinicalNoteResponse>;
    validate(request: CreateClinicalNoteRequest): Promise<ValidationResult>;
    authorize(request: CreateClinicalNoteRequest, userId: string): Promise<boolean>;
    involvesPHI(request: CreateClinicalNoteRequest): boolean;
    getPatientId(request: CreateClinicalNoteRequest): string | null;
}
//# sourceMappingURL=CreateClinicalNoteUseCase.d.ts.map