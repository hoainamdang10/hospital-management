/**
 * CosignClinicalNoteUseCase - Application Layer
 * Use case for cosigning clinical notes
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IClinicalNoteRepository } from '../../domain/repositories/IClinicalNoteRepository';
import { CosignClinicalNoteRequest, CosignClinicalNoteResponse } from '../dto/ClinicalNoteRequest';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';
export declare class CosignClinicalNoteUseCase extends BaseHealthcareUseCase<CosignClinicalNoteRequest, CosignClinicalNoteResponse> {
    private readonly clinicalNoteRepository;
    private readonly eventPublisher;
    constructor(clinicalNoteRepository: IClinicalNoteRepository, eventPublisher: IDomainEventPublisher);
    execute(request: CosignClinicalNoteRequest): Promise<CosignClinicalNoteResponse>;
    protected executeInternal(request: CosignClinicalNoteRequest): Promise<CosignClinicalNoteResponse>;
    validate(request: CosignClinicalNoteRequest): Promise<ValidationResult>;
    authorize(request: CosignClinicalNoteRequest, userId: string): Promise<boolean>;
    involvesPHI(request: CosignClinicalNoteRequest): boolean;
    getPatientId(request: CosignClinicalNoteRequest): string | null;
}
//# sourceMappingURL=CosignClinicalNoteUseCase.d.ts.map