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
import { MedicalImagingCreatedEvent } from '../events/MedicalImagingCreatedEvent';
import { MedicalImagingUpdatedEvent } from '../events/MedicalImagingUpdatedEvent';
import { MedicalImagingReportedEvent } from '../events/MedicalImagingReportedEvent';

export enum ImagingType {
  X_RAY = 'x_ray',
  CT_SCAN = 'ct_scan',
  MRI = 'mri',
  ULTRASOUND = 'ultrasound',
  PET_SCAN = 'pet_scan',
  MAMMOGRAPHY = 'mammography',
  FLUOROSCOPY = 'fluoroscopy',
  NUCLEAR_MEDICINE = 'nuclear_medicine',
  OTHER = 'other',
}

export enum ImagingModality {
  CR = 'CR', // Computed Radiography
  DX = 'DX', // Digital Radiography
  CT = 'CT', // Computed Tomography
  MR = 'MR', // Magnetic Resonance
  US = 'US', // Ultrasound
  PT = 'PT', // Positron Emission Tomography
  MG = 'MG', // Mammography
  XA = 'XA', // X-Ray Angiography
  NM = 'NM', // Nuclear Medicine
  OTHER = 'OTHER',
}

export enum ImagingStatus {
  ORDERED = 'ordered',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REPORTED = 'reported',
  VERIFIED = 'verified',
  CANCELLED = 'cancelled',
}

export enum ImagingPriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  STAT = 'stat',
  ASAP = 'asap',
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

export class MedicalImaging extends AggregateRoot<MedicalImagingProps> {
  private constructor(props: MedicalImagingProps, id?: string) {
    super(props, id);
  }

  get imagingId(): MedicalImagingId {
    return this.props.imagingId;
  }

  get medicalRecordId(): string {
    return this.props.medicalRecordId;
  }

  get patientId(): string {
    return this.props.patientId;
  }

  get imagingType(): ImagingType {
    return this.props.imagingType;
  }

  get modality(): ImagingModality {
    return this.props.modality;
  }

  get bodyPart(): string {
    return this.props.bodyPart;
  }

  get status(): ImagingStatus {
    return this.props.status;
  }

  get priority(): ImagingPriority {
    return this.props.priority;
  }

  get imageUrls(): string[] | undefined {
    return this.props.imageUrls;
  }

  get findings(): string | undefined {
    return this.props.findings;
  }

  get impression(): string | undefined {
    return this.props.impression;
  }

  /**
   * Create new medical imaging study
   */
  public static create(props: Omit<MedicalImagingProps, 'imagingId' | 'createdAt' | 'updatedAt' | 'status' | 'accessLog'>): MedicalImaging {
    const imagingId = MedicalImagingId.create();
    const now = new Date();

    const imaging = new MedicalImaging({
      ...props,
      imagingId,
      status: ImagingStatus.ORDERED,
      createdAt: now,
      updatedAt: now,
      accessLog: [],
    });

    imaging.addDomainEvent(new MedicalImagingCreatedEvent({
      imagingId: imagingId.value,
      patientId: props.patientId,
      imagingType: props.imagingType,
      modality: props.modality,
      timestamp: now,
    }));

    return imaging;
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(props: MedicalImagingProps, id: string): MedicalImaging {
    return new MedicalImaging(props, id);
  }

  /**
   * Update imaging results
   */
  public updateResults(
    findings: string,
    impression: string,
    radiologistId: string,
    technique?: string,
    updatedBy?: string
  ): void {
    this.props.findings = findings;
    this.props.impression = impression;
    this.props.radiologistId = radiologistId;
    this.props.technique = technique;
    this.props.reportedAt = new Date();
    this.props.status = ImagingStatus.REPORTED;
    this.props.updatedBy = updatedBy || radiologistId;
    this.props.updatedAt = new Date();

    this.addDomainEvent(new MedicalImagingReportedEvent({
      imagingId: this.imagingId.value,
      patientId: this.patientId,
      radiologistId,
      timestamp: new Date(),
    }));
  }

  /**
   * Verify imaging report
   */
  public verify(verifiedBy: string): void {
    if (this.props.status !== ImagingStatus.REPORTED) {
      throw new Error('Can only verify reported imaging studies');
    }

    this.props.verifiedBy = verifiedBy;
    this.props.verifiedAt = new Date();
    this.props.status = ImagingStatus.VERIFIED;
    this.props.updatedBy = verifiedBy;
    this.props.updatedAt = new Date();

    this.addDomainEvent(new MedicalImagingUpdatedEvent({
      imagingId: this.imagingId.value,
      patientId: this.patientId,
      status: this.props.status,
      timestamp: new Date(),
    }));
  }

  /**
   * Add image URLs
   */
  public addImageUrls(urls: string[], updatedBy: string): void {
    if (!this.props.imageUrls) {
      this.props.imageUrls = [];
    }
    this.props.imageUrls.push(...urls);
    this.props.updatedBy = updatedBy;
    this.props.updatedAt = new Date();
  }

  /**
   * Update DICOM metadata
   */
  public updateDicomMetadata(
    dicomStudyUid: string,
    seriesCount: number,
    instanceCount: number,
    updatedBy: string
  ): void {
    this.props.dicomStudyUid = dicomStudyUid;
    this.props.seriesCount = seriesCount;
    this.props.instanceCount = instanceCount;
    this.props.updatedBy = updatedBy;
    this.props.updatedAt = new Date();
  }

  /**
   * Mark as completed
   */
  public markCompleted(updatedBy: string): void {
    this.props.status = ImagingStatus.COMPLETED;
    this.props.updatedBy = updatedBy;
    this.props.updatedAt = new Date();
  }

  /**
   * Cancel imaging study
   */
  public cancel(reason: string, cancelledBy: string): void {
    this.props.status = ImagingStatus.CANCELLED;
    this.props.notes = this.props.notes
      ? `${this.props.notes}\n\nCancelled: ${reason}`
      : `Cancelled: ${reason}`;
    this.props.updatedBy = cancelledBy;
    this.props.updatedAt = new Date();
  }

  /**
   * Log access for HIPAA compliance
   */
  public logAccess(accessedBy: string, accessPurpose: string, ipAddress?: string): void {
    if (!this.props.accessLog) {
      this.props.accessLog = [];
    }

    this.props.accessLog.push({
      accessedBy,
      accessedAt: new Date(),
      accessPurpose,
      ipAddress,
    });
  }

  /**
   * Check if imaging uses contrast
   */
  public usesContrast(): boolean {
    return this.props.contrastUsed === true;
  }

  /**
   * Check if imaging is urgent
   */
  public isUrgent(): boolean {
    return this.props.priority === ImagingPriority.URGENT ||
           this.props.priority === ImagingPriority.STAT ||
           this.props.priority === ImagingPriority.ASAP;
  }

  /**
   * Validate business rules
   */
  public validate(): void {
    if (!this.props.medicalRecordId) {
      throw new Error('Medical record ID is required');
    }

    if (!this.props.patientId) {
      throw new Error('Patient ID is required');
    }

    if (!this.props.bodyPart || this.props.bodyPart.trim().length === 0) {
      throw new Error('Body part is required');
    }

    if (!this.props.orderedBy) {
      throw new Error('Ordered by is required');
    }

    if (!this.props.createdBy) {
      throw new Error('Created by is required');
    }
  }
}

