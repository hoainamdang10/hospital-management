/**
 * Patient Event Consumer
 * Consumes events from Patient Registry Service to maintain local read model
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Event-Driven Architecture, CQRS, Eventual Consistency
 */
import { PatientReadModelRepository } from '../repositories/PatientReadModelRepository';
import { InboxRepository } from '../inbox/InboxRepository';
/**
 * Patient Event Consumer
 *
 * Subscribed Events:
 * - patient.patient.registered
 * - patient.patient.updated
 * - patient.patient.deactivated
 *
 * Pattern: Inbox Pattern for idempotency
 */
export declare class PatientEventConsumer {
    private readonly patientReadRepo;
    private readonly inboxRepo;
    constructor(patientReadRepo: PatientReadModelRepository, inboxRepo: InboxRepository);
    /**
     * Handle patient event (entry point)
     */
    handle(event: any): Promise<void>;
    /**
     * Handle patient registered event
     */
    private handlePatientRegistered;
    /**
     * Handle patient updated event
     */
    private handlePatientUpdated;
    /**
     * Handle patient deactivated event
     */
    private handlePatientDeactivated;
    /**
     * Handle patient deleted event
     */
    private handlePatientDeleted;
    private extractFullName;
    private extractPhone;
    private extractEmail;
    private extractDateOfBirth;
    private extractGender;
    private extractNationalId;
    private extractInsuranceNumber;
    private extractInsuranceType;
    private extractAddress;
}
//# sourceMappingURL=PatientEventConsumer.d.ts.map