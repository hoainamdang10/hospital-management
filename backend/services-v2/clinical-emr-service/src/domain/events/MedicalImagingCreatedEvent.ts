/**
 * MedicalImagingCreatedEvent - Domain Event
 * Published when a new medical imaging study is created
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Event-Driven Architecture
 */

import { DomainEvent } from '@shared/domain/DomainEvent';

export interface MedicalImagingCreatedEventPayload {
  imagingId: string;
  patientId: string;
  imagingType: string;
  modality: string;
  timestamp: Date;
}

export class MedicalImagingCreatedEvent extends DomainEvent<MedicalImagingCreatedEventPayload> {
  constructor(payload: MedicalImagingCreatedEventPayload) {
    super('clinical.medical-imaging.created', payload);
  }
}

