/**
 * StaffScheduleUpdatedHandler
 * Event handler for StaffScheduleUpdated events from Provider Staff Service
 *
 * Bounded Context Integration:
 * - Provider Staff Service: Publishes StaffScheduleUpdatedEvent when work schedule changes
 * - Appointments Service: Subscribes to cache work schedule template for availability calculation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { DomainEvent } from '../../../../../shared/domain/base/domain-event';
import { EventHandler } from '../../../../../shared/infrastructure/event-bus/EventBus';
import { IProviderScheduleRepository } from '../../../domain/repositories/IProviderScheduleRepository';
/**
 * Event Handler for StaffScheduleUpdated
 * Implements EventHandler interface from shared infrastructure
 */
export declare class StaffScheduleUpdatedHandler implements EventHandler<DomainEvent> {
    private readonly providerScheduleRepository;
    constructor(providerScheduleRepository: IProviderScheduleRepository);
    /**
     * Handle StaffScheduleUpdated event
     * Caches work schedule template in Appointments Service
     */
    handle(event: DomainEvent): Promise<void>;
    /**
     * Get event type this handler subscribes to
     */
    static getEventType(): string;
    /**
     * Get handler name for logging
     */
    static getHandlerName(): string;
}
//# sourceMappingURL=StaffScheduleUpdatedHandler.d.ts.map