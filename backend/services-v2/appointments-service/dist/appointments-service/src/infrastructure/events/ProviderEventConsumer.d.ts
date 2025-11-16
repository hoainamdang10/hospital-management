/**
 * Provider Event Consumer
 * Consumes events from Provider Staff Service to maintain local read model
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Event-Driven Architecture, CQRS, Eventual Consistency
 */
import { ProviderReadModelRepository } from '../repositories/ProviderReadModelRepository';
import { InboxRepository } from '../inbox/InboxRepository';
/**
 * Provider Event Consumer
 *
 * Subscribed Events:
 * - provider.staff.created
 * - provider.staff.updated
 * - provider.staff.deactivated
 * - provider.staff.deleted
 *
 * Pattern: Inbox Pattern for idempotency
 */
export declare class ProviderEventConsumer {
    private readonly providerReadRepo;
    private readonly inboxRepo;
    constructor(providerReadRepo: ProviderReadModelRepository, inboxRepo: InboxRepository);
    /**
     * Handle provider event (entry point)
     */
    handle(event: any): Promise<void>;
    /**
     * Handle staff created event
     */
    private handleStaffCreated;
    /**
     * Handle staff updated event
     */
    private handleStaffUpdated;
    /**
     * Handle staff status changed event
     */
    private handleStaffStatusChanged;
    /**
     * Handle staff deleted event
     */
    private handleStaffDeleted;
}
//# sourceMappingURL=ProviderEventConsumer.d.ts.map