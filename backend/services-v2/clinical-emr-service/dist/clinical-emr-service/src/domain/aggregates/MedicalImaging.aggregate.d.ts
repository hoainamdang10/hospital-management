/**
 * MedicalImaging - Aggregate Root
 * Represents a medical imaging study (X-Ray, CT, MRI, Ultrasound, etc.)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Aggregate Pattern, DICOM Standards
 */
import { AggregateRoot } from '@shared/domain/AggregateRoot';
import { MedicalImagingId } from '../value-objects/MedicalImagingId';
export declare enum ImagingType {
    X_RAY = "x_ray",
    CT_SCAN = "ct_scan",
    MRI = "mri",
    ULTRASOUND = "ultrasound",
    PET_SCAN = "pet_scan",
    MAMMOGRAPHY = "mammography",
    FLUOROSCOPY = "fluoroscopy",
    NUCLEAR_MEDICINE = "nuclear_medicine",
    OTHER = "other"
}
export declare enum ImagingModality {
    CR = "CR",// Computed Radiography
    DX = "DX",// Digital Radiography
    CT = "CT",// Computed Tomography
    MR = "MR",// Magnetic Resonance
    US = "US",// Ultrasound
    PT = "PT",// Positron Emission Tomography
    MG = "MG",// Mammography
    XA = "XA",// X-Ray Angiography
    NM = "NM",// Nuclear Medicine
    OTHER = "OTHER"
}
export declare enum ImagingStatus {
    ORDERED = "ordered",
    SCHEDULED = "scheduled",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    REPORTED = "reported",
    VERIFIED = "verified",
    CANCELLED = "cancelled"
}
export declare enum ImagingPriority {
    ROUTINE = "routine",
    URGENT = "urgent",
    STAT = "stat",
    ASAP = "asap"
}
export interface MedicalImagingProps {
    imagingId: MedicalImagingId;
    medicalRecordId: string;
    patientId: string;
    imagingType: ImagingType;
    modality: ImagingModality;
    bodyPart: string;
    laterality?: string;
    studyDate: Date;
    studyDescription?: string;
    clinicalIndication?: string;
    orderedBy: string;
    orderedAt: Date;
    priority: ImagingPriority;
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
    status: ImagingStatus;
    technique?: string;
    contrastUsed?: boolean;
    contrastType?: string;
    radiationDose?: number;
    notes?: string;
    createdBy: string;
    createdAt: Date;
    updatedBy?: string;
    updatedAt: Date;
    accessLog?: Array<{
        accessedBy: string;
        accessedAt: Date;
        accessPurpose: string;
        ipAddress?: string;
    }>;
}
export declare class MedicalImaging extends AggregateRoot<MedicalImagingProps> {
    private constructor();
    get imagingId(): MedicalImagingId;
    get medicalRecordId(): string;
    get patientId(): string;
    get imagingType(): ImagingType;
    get modality(): ImagingModality;
    get bodyPart(): string;
    get status(): ImagingStatus;
    get priority(): ImagingPriority;
    get imageUrls(): string[] | undefined;
    get findings(): string | undefined;
    get impression(): string | undefined;
    /**
     * Create new medical imaging study
     */
    static create(props: Omit<MedicalImagingProps, 'imagingId' | 'createdAt' | 'updatedAt' | 'status' | 'accessLog'>): MedicalImaging;
    /**
     * Reconstitute from persistence
     */
    static reconstitute(props: MedicalImagingProps, id: string): MedicalImaging;
    /**
     * Update imaging results
     */
    updateResults(findings: string, impression: string, radiologistId: string, technique?: string, updatedBy?: string): void;
    /**
     * Verify imaging report
     */
    verify(verifiedBy: string): void;
    /**
     * Add image URLs
     */
    addImageUrls(urls: string[], updatedBy: string): void;
    /**
     * Update DICOM metadata
     */
    updateDicomMetadata(dicomStudyUid: string, seriesCount: number, instanceCount: number, updatedBy: string): void;
    /**
     * Mark as completed
     */
    markCompleted(updatedBy: string): void;
    /**
     * Cancel imaging study
     */
    cancel(reason: string, cancelledBy: string): void;
    /**
     * Log access for HIPAA compliance
     */
    logAccess(accessedBy: string, accessPurpose: string, ipAddress?: string): void;
    /**
     * Check if imaging uses contrast
     */
    usesContrast(): boolean;
    /**
     * Check if imaging is urgent
     */
    isUrgent(): boolean;
    /**
     * Validate business rules
     */
    validate(): void;
}
//# sourceMappingURL=MedicalImaging.aggregate.d.ts.map