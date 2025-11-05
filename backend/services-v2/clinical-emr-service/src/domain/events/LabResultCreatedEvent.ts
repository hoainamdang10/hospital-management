/**
 * LabResultCreatedEvent - Domain Event
 * Emitted when a new lab result is created
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface LabResultCreatedEventPayload {
  resultId: string;
  patientId: string;
  medicalRecordId: string;
  testType: string;
  orderedBy: string;
  priority: string;
  timestamp: Date;
}

export class LabResultCreatedEvent extends DomainEvent<LabResultCreatedEventPayload> {
  constructor(payload: LabResultCreatedEventPayload) {
    super('clinical.lab-result.created', payload);
  }
}

