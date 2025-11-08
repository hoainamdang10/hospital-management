/**
 * LabResultUpdatedEvent - Domain Event
 * Emitted when a lab result is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export interface LabResultUpdatedEventPayload {
    resultId: string;
    patientId: string;
    status: string;
    updatedBy: string;
    timestamp: Date;
}
export declare class LabResultUpdatedEvent extends DomainEvent<LabResultUpdatedEventPayload> {
    constructor(payload: LabResultUpdatedEventPayload);
}
//# sourceMappingURL=LabResultUpdatedEvent.d.ts.map