/**
 * GetClinicalNoteUseCase - Application Layer
 * Use case for retrieving a clinical note
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IClinicalNoteRepository } from '../../domain/repositories/IClinicalNoteRepository';
import { GetClinicalNoteRequest, GetClinicalNoteResponse } from '../dto/ClinicalNoteRequest';
export declare class GetClinicalNoteUseCase extends BaseHealthcareUseCase<GetClinicalNoteRequest, GetClinicalNoteResponse> {
    private readonly clinicalNoteRepository;
    constructor(clinicalNoteRepository: IClinicalNoteRepository);
    execute(request: GetClinicalNoteRequest): Promise<GetClinicalNoteResponse>;
    protected executeInternal(request: GetClinicalNoteRequest): Promise<GetClinicalNoteResponse>;
    validate(request: GetClinicalNoteRequest): Promise<ValidationResult>;
    authorize(request: GetClinicalNoteRequest, userId: string): Promise<boolean>;
    involvesPHI(request: GetClinicalNoteRequest): boolean;
    getPatientId(request: GetClinicalNoteRequest): string | null;
}
//# sourceMappingURL=GetClinicalNoteUseCase.d.ts.map