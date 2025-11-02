/**
 * Patient Left Queue Event - Domain Event
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface PatientLeftQueueEventData {
  queueId: string;
  doctorId: string;
  patientId: string;
  appointmentId: string | undefined;
  queueNumber: number;
  reason: string;
  removedBy: string;
  leftTime: Date;
}

export class PatientLeftQueueEvent extends DomainEvent {
  constructor(
    public readonly queueId: string,
    public readonly doctorId: string,
    public readonly patientId: string,
    public readonly appointmentId: string | undefined,
    public readonly queueNumber: number,
    public readonly reason: string,
    public readonly removedBy: string,
    public readonly leftTime: Date,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    const eventData: PatientLeftQueueEventData = {
      queueId,
      doctorId,
      patientId,
      appointmentId,
      queueNumber,
      reason,
      removedBy,
      leftTime
    };

    super(
      'PatientLeftQueue',
      queueId,
      'Queue',
      eventData,
      1,
      correlationId,
      causationId,
      userId
    );
  }

  getEventData(): PatientLeftQueueEventData {
    return {
      queueId: this.queueId,
      doctorId: this.doctorId,
      patientId: this.patientId,
      appointmentId: this.appointmentId,
      queueNumber: this.queueNumber,
      reason: this.reason,
      removedBy: this.removedBy,
      leftTime: this.leftTime
    };
  }

  containsPHI(): boolean {
    return true;
  }

  getPatientId(): string | null {
    return this.patientId;
  }
}
