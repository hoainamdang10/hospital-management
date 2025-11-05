/**
 * LabResultVerifiedEvent - Domain Event
 * Emitted when a lab result is verified by a doctor
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface LabResultVerifiedEventPayload {
  resultId: string;
  patientId: string;
  verifiedBy: string;
  timestamp: Date;
}

export class LabResultVerifiedEvent extends DomainEvent<LabResultVerifiedEventPayload> {
  constructor(payload: LabResultVerifiedEventPayload) {
    super('clinical.lab-result.verified', payload);
  }
}

