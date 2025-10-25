/**
 * DiagnosisAddedEvent - Domain Event
 * Published when a diagnosis is added to a medical record
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface DiagnosisAddedEventData {
  recordId: string;
  patientId: string;
  doctorId: string;
  diagnosisCode: string;
  diagnosisDisplay: string;
  diagnosisCategory: string;
  diagnosisSeverity: string;
  diagnosisStatus: string;
  isCritical: boolean;
  isPrimary: boolean;
  addedBy: string;
  addedAt: Date;
  specialtyCode?: string;
  vietnameseClassification?: string;
}

export class DiagnosisAddedEvent extends DomainEvent {
  public readonly recordId: string;
  public readonly patientId: string;
  public readonly doctorId: string;
  public readonly diagnosisCode: string;
  public readonly diagnosisDisplay: string;
  public readonly diagnosisCategory: string;
  public readonly diagnosisSeverity: string;
  public readonly diagnosisStatus: string;
  public readonly isCritical: boolean;
  public readonly isPrimary: boolean;
  public readonly addedBy: string;
  public readonly addedAt: Date;
  public readonly specialtyCode?: string;
  public readonly vietnameseClassification?: string;

  constructor(data: DiagnosisAddedEventData) {
    super(
      'DiagnosisAdded',
      data.recordId,
      'MedicalRecord',
      {
        diagnosisCode: data.diagnosisCode,
        diagnosisDisplay: data.diagnosisDisplay,
        diagnosisCategory: data.diagnosisCategory,
        diagnosisSeverity: data.diagnosisSeverity,
        isCritical: data.isCritical,
        isPrimary: data.isPrimary
      },
      1, // eventVersion
      undefined, // correlationId
      undefined, // causationId
      data.addedBy // userId
    );
    
    this.recordId = data.recordId;
    this.patientId = data.patientId;
    this.doctorId = data.doctorId;
    this.diagnosisCode = data.diagnosisCode;
    this.diagnosisDisplay = data.diagnosisDisplay;
    this.diagnosisCategory = data.diagnosisCategory;
    this.diagnosisSeverity = data.diagnosisSeverity;
    this.diagnosisStatus = data.diagnosisStatus;
    this.isCritical = data.isCritical;
    this.isPrimary = data.isPrimary;
    this.addedBy = data.addedBy;
    this.addedAt = data.addedAt;
    this.specialtyCode = data.specialtyCode;
    this.vietnameseClassification = data.vietnameseClassification;
  }

  public getEventData(): any {
    return {
      recordId: this.recordId,
      patientId: this.patientId,
      doctorId: this.doctorId,
      diagnosisCode: this.diagnosisCode,
      diagnosisDisplay: this.diagnosisDisplay,
      diagnosisCategory: this.diagnosisCategory,
      diagnosisSeverity: this.diagnosisSeverity,
      diagnosisStatus: this.diagnosisStatus,
      isCritical: this.isCritical,
      isPrimary: this.isPrimary,
      addedBy: this.addedBy,
      addedAt: this.addedAt.toISOString(),
      specialtyCode: this.specialtyCode,
      vietnameseClassification: this.vietnameseClassification
    };
  }

  public containsPHI(): boolean {
    return true; // Medical diagnosis is PHI
  }

  public getPatientId(): string | null {
    return this.patientId;
  }
}
