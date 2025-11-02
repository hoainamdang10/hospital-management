/**
 * Patient Joined Queue Event - Domain Event
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { QueuePriority } from '../entities/QueueEntry.entity';

export interface PatientJoinedQueueEventData {
  queueId: string;
  doctorId: string;
  patientId: string;
  appointmentId: string | undefined;
  queueNumber: number;
  priority: QueuePriority;
  estimatedWaitMinutes: number;
  checkInTime: Date;
}

export class PatientJoinedQueueEvent extends DomainEvent {
  constructor(
    public readonly queueId: string,
    public readonly doctorId: string,
    public readonly patientId: string,
    public readonly appointmentId: string | undefined,
    public readonly queueNumber: number,
    public readonly priority: QueuePriority,
    public readonly estimatedWaitMinutes: number,
    public readonly checkInTime: Date,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    const eventData: PatientJoinedQueueEventData = {
      queueId,
      doctorId,
      patientId,
      appointmentId,
      queueNumber,
      priority,
      estimatedWaitMinutes,
      checkInTime
    };

    super(
      'PatientJoinedQueue',
      queueId,
      'Queue',
      eventData,
      1,
      correlationId,
      causationId,
      userId
    );
  }

  getEventData(): PatientJoinedQueueEventData {
    return {
      queueId: this.queueId,
      doctorId: this.doctorId,
      patientId: this.patientId,
      appointmentId: this.appointmentId,
      queueNumber: this.queueNumber,
      priority: this.priority,
      estimatedWaitMinutes: this.estimatedWaitMinutes,
      checkInTime: this.checkInTime
    };
  }

  containsPHI(): boolean {
    return true; // Queue contains patient information
  }

  getPatientId(): string | null {
    return this.patientId;
  }
}
