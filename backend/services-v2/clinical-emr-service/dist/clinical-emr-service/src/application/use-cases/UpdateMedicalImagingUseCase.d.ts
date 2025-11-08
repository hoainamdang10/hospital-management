/**
 * UpdateMedicalImagingUseCase - Application Use Case
 * Updates medical imaging with results and findings
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
import { IMedicalImagingRepository } from '../../domain/repositories/IMedicalImagingRepository';
export interface UpdateMedicalImagingCommand {
    imagingId: string;
    findings?: string;
    impression?: string;
    radiologistId?: string;
    technique?: string;
    imageUrls?: string[];
    dicomStudyUid?: string;
    seriesCount?: number;
    instanceCount?: number;
    verifiedBy?: string;
    notes?: string;
    updatedBy: string;
}
export interface UpdateMedicalImagingResult {
    success: boolean;
    imagingId?: string;
    status?: string;
    error?: string;
}
export declare class UpdateMedicalImagingUseCase {
    private readonly imagingRepository;
    constructor(imagingRepository: IMedicalImagingRepository);
    execute(command: UpdateMedicalImagingCommand): Promise<UpdateMedicalImagingResult>;
}
//# sourceMappingURL=UpdateMedicalImagingUseCase.d.ts.map