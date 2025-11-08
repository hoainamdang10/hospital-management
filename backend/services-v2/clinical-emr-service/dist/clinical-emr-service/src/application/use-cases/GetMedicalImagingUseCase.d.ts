/**
 * GetMedicalImagingUseCase - Application Use Case
 * Retrieves a medical imaging study by ID with audit logging
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA
 */
import { IMedicalImagingRepository } from '../../domain/repositories/IMedicalImagingRepository';
export interface GetMedicalImagingQuery {
    imagingId: string;
    accessedBy: string;
    accessPurpose?: string;
    ipAddress?: string;
}
export interface GetMedicalImagingResult {
    success: boolean;
    imaging?: MedicalImagingDTO;
    error?: string;
}
export interface MedicalImagingDTO {
    imagingId: string;
    medicalRecordId: string;
    patientId: string;
    imagingType: string;
    modality: string;
    bodyPart: string;
    laterality?: string;
    studyDate: Date;
    studyDescription?: string;
    clinicalIndication?: string;
    orderedBy: string;
    orderedAt: Date;
    priority: string;
    findings?: string;
    impression?: string;
    radiologistId?: string;
    reportedAt?: Date;
    verifiedBy?: string;
    verifiedAt?: Date;
    imageUrls?: string[];
    dicomStudyUid?: string;
    seriesCount?: number;
    instanceCount?: number;
    status: string;
    technique?: string;
    contrastUsed?: boolean;
    contrastType?: string;
    radiationDose?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    usesContrast: boolean;
    isUrgent: boolean;
}
export declare class GetMedicalImagingUseCase {
    private readonly imagingRepository;
    constructor(imagingRepository: IMedicalImagingRepository);
    execute(query: GetMedicalImagingQuery): Promise<GetMedicalImagingResult>;
    private toDTO;
}
//# sourceMappingURL=GetMedicalImagingUseCase.d.ts.map