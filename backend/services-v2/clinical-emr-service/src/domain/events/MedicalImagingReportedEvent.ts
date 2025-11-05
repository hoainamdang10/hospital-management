/**
 * MedicalImagingReportedEvent - Domain Event
 * Published when a medical imaging study is reported by radiologist
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Event-Driven Architecture
 */

import { DomainEvent } from '@shared/domain/DomainEvent';

export interface MedicalImagingReportedEventPayload {
  imagingId: string;
  patientId: string;
  radiologistId: string;
  timestamp: Date;
}

export class MedicalImagingReportedEvent extends DomainEvent<MedicalImagingReportedEventPayload> {
  constructor(payload: MedicalImagingReportedEventPayload) {
    super('clinical.medical-imaging.reported', payload);
  }
}

