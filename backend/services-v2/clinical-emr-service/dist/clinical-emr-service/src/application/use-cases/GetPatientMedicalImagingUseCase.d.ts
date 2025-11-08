/**
 * GetPatientMedicalImagingUseCase - Application Use Case
 * Retrieves all medical imaging studies for a patient with filters
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
import { IMedicalImagingRepository } from '../../domain/repositories/IMedicalImagingRepository';
import { ImagingType, ImagingModality, ImagingStatus } from '../../domain/aggregates/MedicalImaging.aggregate';
export interface GetPatientMedicalImagingQuery {
    patientId: string;
    imagingType?: ImagingType;
    modality?: ImagingModality;
    status?: ImagingStatus;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
}
export interface GetPatientMedicalImagingResult {
    success: boolean;
    imaging?: MedicalImagingSummaryDTO[];
    total?: number;
    limit?: number;
    offset?: number;
    error?: string;
}
export interface MedicalImagingSummaryDTO {
    imagingId: string;
    imagingType: string;
    modality: string;
    bodyPart: string;
    laterality?: string;
    studyDate: Date;
    studyDescription?: string;
    clinicalIndication?: string;
    orderedBy: string;
    priority: string;
    findings?: string;
    impression?: string;
    radiologistId?: string;
    reportedAt?: Date;
    verifiedAt?: Date;
    status: string;
    imageUrls?: string[];
    dicomStudyUid?: string;
    usesContrast: boolean;
    isUrgent: boolean;
}
export declare class GetPatientMedicalImagingUseCase {
    private readonly imagingRepository;
    constructor(imagingRepository: IMedicalImagingRepository);
    execute(query: GetPatientMedicalImagingQuery): Promise<GetPatientMedicalImagingResult>;
    private toSummaryDTO;
}
//# sourceMappingURL=GetPatientMedicalImagingUseCase.d.ts.map