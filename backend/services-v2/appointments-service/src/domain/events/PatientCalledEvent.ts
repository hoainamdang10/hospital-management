/**
 * Patient Called Event - Domain Event
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface PatientCalledEventData {
  queueId: string;
  doctorId: string;
  patientId: string;
  appointmentId: string | undefined;
  queueNumber: number;
  calledTime: Date;
  calledBy: string;
}

export class PatientCalledEvent extends DomainEvent {
  constructor(
    public readonly queueId: string,
    public readonly doctorId: string,
    public readonly patientId: string,
    public readonly appointmentId: string | undefined,
    public readonly queueNumber: number,
    public readonly calledTime: Date,
    public readonly calledBy: string,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    const eventData: PatientCalledEventData = {
      queueId,
      doctorId,
      patientId,
      appointmentId,
      queueNumber,
      calledTime,
      calledBy
    };

    super(
      'PatientCalled',
      queueId,
      'Queue',
      eventData,
      1,
      correlationId,
      causationId,
      userId
    );
  }

  getEventData(): PatientCalledEventData {
    return {
      queueId: this.queueId,
      doctorId: this.doctorId,
      patientId: this.patientId,
      appointmentId: this.appointmentId,
      queueNumber: this.queueNumber,
      calledTime: this.calledTime,
      calledBy: this.calledBy
    };
  }

  containsPHI(): boolean {
    return true;
  }

  getPatientId(): string | null {
    return this.patientId;
  }
}
