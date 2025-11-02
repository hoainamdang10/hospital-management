/**
 * ListClinicalNotesUseCase - Application Layer
 * Use case for listing clinical notes with filtering
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA
 */
import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IClinicalNoteRepository } from '../../domain/repositories/IClinicalNoteRepository';
import { ListClinicalNotesRequest, ListClinicalNotesResponse } from '../dto/ClinicalNoteRequest';
export declare class ListClinicalNotesUseCase extends BaseHealthcareUseCase<ListClinicalNotesRequest, ListClinicalNotesResponse> {
    private readonly clinicalNoteRepository;
    constructor(clinicalNoteRepository: IClinicalNoteRepository);
    execute(request: ListClinicalNotesRequest): Promise<ListClinicalNotesResponse>;
    protected executeInternal(request: ListClinicalNotesRequest): Promise<ListClinicalNotesResponse>;
    validate(request: ListClinicalNotesRequest): Promise<ValidationResult>;
    authorize(request: ListClinicalNotesRequest, userId: string): Promise<boolean>;
    involvesPHI(request: ListClinicalNotesRequest): boolean;
    getPatientId(request: ListClinicalNotesRequest): string | null;
}
//# sourceMappingURL=ListClinicalNotesUseCase.d.ts.map