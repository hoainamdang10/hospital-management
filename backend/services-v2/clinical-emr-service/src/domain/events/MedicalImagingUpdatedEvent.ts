/**
 * MedicalImagingUpdatedEvent - Domain Event
 * Published when a medical imaging study is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Event-Driven Architecture
 */

import { DomainEvent } from '@shared/domain/DomainEvent';

export interface MedicalImagingUpdatedEventPayload {
  imagingId: string;
  patientId: string;
  status: string;
  timestamp: Date;
}

export class MedicalImagingUpdatedEvent extends DomainEvent<MedicalImagingUpdatedEventPayload> {
  constructor(payload: MedicalImagingUpdatedEventPayload) {
    super('clinical.medical-imaging.updated', payload);
  }
}

