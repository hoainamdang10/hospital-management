/**
 * VitalSignsUpdatedEvent - Domain Event
 * Published when vital signs are updated in a medical record
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface VitalSignsUpdatedEventData {
  recordId: string;
  patientId: string;
  doctorId: string;
  vitalSigns: {
    temperature?: number;
    bloodPressure?: string;
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    weight?: number;
    height?: number;
    bmi?: number;
  };
  hasCompleteVitalSigns: boolean;
  hasAbnormalVitals: boolean;
  criticalVitals: string[];
  updatedBy: string;
  updatedAt: Date;
}

export class VitalSignsUpdatedEvent extends DomainEvent {
  public readonly recordId: string;
  public readonly patientId: string;
  public readonly doctorId: string;
  public readonly vitalSigns: any;
  public readonly hasCompleteVitalSigns: boolean;
  public readonly hasAbnormalVitals: boolean;
  public readonly criticalVitals: string[];
  public readonly updatedBy: string;
  public readonly updatedAt: Date;

  constructor(data: VitalSignsUpdatedEventData) {
    super(
      'VitalSignsUpdated',
      data.recordId,
      'MedicalRecord',
      {
        vitalSigns: data.vitalSigns,
        hasCompleteVitalSigns: data.hasCompleteVitalSigns,
        hasAbnormalVitals: data.hasAbnormalVitals,
        criticalVitals: data.criticalVitals
      },
      1, // eventVersion
      undefined, // correlationId
      undefined, // causationId
      data.updatedBy // userId
    );
    
    this.recordId = data.recordId;
    this.patientId = data.patientId;
    this.doctorId = data.doctorId;
    this.vitalSigns = data.vitalSigns;
    this.hasCompleteVitalSigns = data.hasCompleteVitalSigns;
    this.hasAbnormalVitals = data.hasAbnormalVitals;
    this.criticalVitals = data.criticalVitals;
    this.updatedBy = data.updatedBy;
    this.updatedAt = data.updatedAt;
  }

  public getEventData(): any {
    return {
      recordId: this.recordId,
      patientId: this.patientId,
      doctorId: this.doctorId,
      vitalSigns: this.vitalSigns,
      hasCompleteVitalSigns: this.hasCompleteVitalSigns,
      hasAbnormalVitals: this.hasAbnormalVitals,
      criticalVitals: this.criticalVitals,
      updatedBy: this.updatedBy,
      updatedAt: this.updatedAt.toISOString()
    };
  }

  public containsPHI(): boolean {
    return true; // Vital signs are PHI
  }

  public getPatientId(): string | null {
    return this.patientId;
  }
}
