/**
 * CreateMedicalImagingUseCase - Application Use Case
 * Creates a new medical imaging study order
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
import { IMedicalImagingRepository } from '../../domain/repositories/IMedicalImagingRepository';
import { ImagingType, ImagingModality, ImagingPriority } from '../../domain/aggregates/MedicalImaging.aggregate';
export interface CreateMedicalImagingCommand {
    medicalRecordId: string;
    patientId: string;
    imagingType: ImagingType;
    modality: ImagingModality;
    bodyPart: string;
    laterality?: string;
    studyDate?: Date;
    studyDescription?: string;
    clinicalIndication?: string;
    orderedBy: string;
    orderedAt?: Date;
    priority?: ImagingPriority;
    technique?: string;
    contrastUsed?: boolean;
    contrastType?: string;
    notes?: string;
    createdBy: string;
}
export interface CreateMedicalImagingResult {
    success: boolean;
    imagingId?: string;
    error?: string;
}
export declare class CreateMedicalImagingUseCase {
    private readonly imagingRepository;
    constructor(imagingRepository: IMedicalImagingRepository);
    execute(command: CreateMedicalImagingCommand): Promise<CreateMedicalImagingResult>;
    private validateCommand;
}
//# sourceMappingURL=CreateMedicalImagingUseCase.d.ts.map