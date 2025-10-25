/**
 * MedicationAddedEvent - Domain Event
 * Published when a medication is added to a medical record
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface MedicationAddedEventData {
  recordId: string;
  patientId: string;
  doctorId: string;
  medicationCode: string;
  medicationName: string;
  genericName?: string;
  brandName?: string;
  dosage: string;
  frequency: string;
  route: string;
  instructions: string;
  prescribedBy: string;
  prescribedAt: Date;
  startDate?: Date;
  endDate?: Date;
  isHighPriority: boolean;
  hasContraindications: boolean;
  hasInteractions: boolean;
  hasAllergies: boolean;
  vietnameseDrugCode?: string;
  registrationNumber?: string;
}

export class MedicationAddedEvent extends DomainEvent {
  public readonly recordId: string;
  public readonly patientId: string;
  public readonly doctorId: string;
  public readonly medicationCode: string;
  public readonly medicationName: string;
  public readonly genericName?: string;
  public readonly brandName?: string;
  public readonly dosage: string;
  public readonly frequency: string;
  public readonly route: string;
  public readonly instructions: string;
  public readonly prescribedBy: string;
  public readonly prescribedAt: Date;
  public readonly startDate?: Date;
  public readonly endDate?: Date;
  public readonly isHighPriority: boolean;
  public readonly hasContraindications: boolean;
  public readonly hasInteractions: boolean;
  public readonly hasAllergies: boolean;
  public readonly vietnameseDrugCode?: string;
  public readonly registrationNumber?: string;

  constructor(data: MedicationAddedEventData) {
    super(
      'MedicationAdded',
      data.recordId,
      'MedicalRecord',
      {
        medicationCode: data.medicationCode,
        medicationName: data.medicationName,
        dosage: data.dosage,
        frequency: data.frequency,
        route: data.route,
        isHighPriority: data.isHighPriority,
        hasContraindications: data.hasContraindications,
        hasInteractions: data.hasInteractions,
        hasAllergies: data.hasAllergies
      },
      1, // eventVersion
      undefined, // correlationId
      undefined, // causationId
      data.prescribedBy // userId
    );
    
    this.recordId = data.recordId;
    this.patientId = data.patientId;
    this.doctorId = data.doctorId;
    this.medicationCode = data.medicationCode;
    this.medicationName = data.medicationName;
    this.genericName = data.genericName;
    this.brandName = data.brandName;
    this.dosage = data.dosage;
    this.frequency = data.frequency;
    this.route = data.route;
    this.instructions = data.instructions;
    this.prescribedBy = data.prescribedBy;
    this.prescribedAt = data.prescribedAt;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.isHighPriority = data.isHighPriority;
    this.hasContraindications = data.hasContraindications;
    this.hasInteractions = data.hasInteractions;
    this.hasAllergies = data.hasAllergies;
    this.vietnameseDrugCode = data.vietnameseDrugCode;
    this.registrationNumber = data.registrationNumber;
  }

  public getEventData(): any {
    return {
      recordId: this.recordId,
      patientId: this.patientId,
      doctorId: this.doctorId,
      medicationCode: this.medicationCode,
      medicationName: this.medicationName,
      genericName: this.genericName,
      brandName: this.brandName,
      dosage: this.dosage,
      frequency: this.frequency,
      route: this.route,
      instructions: this.instructions,
      prescribedBy: this.prescribedBy,
      prescribedAt: this.prescribedAt.toISOString(),
      startDate: this.startDate?.toISOString(),
      endDate: this.endDate?.toISOString(),
      isHighPriority: this.isHighPriority,
      hasContraindications: this.hasContraindications,
      hasInteractions: this.hasInteractions,
      hasAllergies: this.hasAllergies,
      vietnameseDrugCode: this.vietnameseDrugCode,
      registrationNumber: this.registrationNumber
    };
  }

  public containsPHI(): boolean {
    return true; // Medication prescription is PHI
  }

  public getPatientId(): string | null {
    return this.patientId;
  }
}
