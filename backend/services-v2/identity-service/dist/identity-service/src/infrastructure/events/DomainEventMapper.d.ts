/**
 * Domain Event Mapper
 * Converts domain events to RabbitMQ event format
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { DomainEvent as BaseDomainEvent } from '../../../../shared/domain/base/domain-event';
import { IntegrationEventPayload } from '../../application/services/IEventPublisher';
export declare class DomainEventMapper {
    /**
     * Convert domain event to RabbitMQ event format
     */
    static toRabbitMQEvent(domainEvent: BaseDomainEvent): IntegrationEventPayload;
    /**
     * Convert multiple domain events
     */
    static toRabbitMQEvents(domainEvents: BaseDomainEvent[]): IntegrationEventPayload[];
}
//# sourceMappingURL=DomainEventMapper.d.ts.map