/**
 * MedicalRecordArchivedEvent - Domain Event
 * Published when a medical record is archived
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface MedicalRecordArchivedEventData {
  recordId: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  previousStatus: string;
  archivedBy: string;
  archivedAt: Date;
  archiveReason?: string;
}

export class MedicalRecordArchivedEvent extends DomainEvent {
  public readonly recordId: string;
  public readonly patientId: string;
  public readonly doctorId: string;
  public readonly appointmentId?: string;
  public readonly previousStatus: string;
  public readonly archivedBy: string;
  public readonly archivedAt: Date;
  public readonly archiveReason?: string;

  constructor(data: MedicalRecordArchivedEventData) {
    super(
      'MedicalRecordArchived',
      data.recordId,
      'MedicalRecord',
      {
        previousStatus: data.previousStatus,
        archiveReason: data.archiveReason
      },
      1, // eventVersion
      undefined, // correlationId
      undefined, // causationId
      data.archivedBy // userId
    );
    
    this.recordId = data.recordId;
    this.patientId = data.patientId;
    this.doctorId = data.doctorId;
    this.appointmentId = data.appointmentId;
    this.previousStatus = data.previousStatus;
    this.archivedBy = data.archivedBy;
    this.archivedAt = data.archivedAt;
    this.archiveReason = data.archiveReason;
  }

  public getEventData(): any {
    return {
      recordId: this.recordId,
      patientId: this.patientId,
      doctorId: this.doctorId,
      appointmentId: this.appointmentId,
      previousStatus: this.previousStatus,
      archivedBy: this.archivedBy,
      archivedAt: this.archivedAt.toISOString(),
      archiveReason: this.archiveReason
    };
  }

  public containsPHI(): boolean {
    return true; // Medical record is PHI
  }

  public getPatientId(): string | null {
    return this.patientId;
  }
}
