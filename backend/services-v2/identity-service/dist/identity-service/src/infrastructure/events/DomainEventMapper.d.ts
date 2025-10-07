/**
 * Domain Event Mapper
 * Converts domain events to RabbitMQ event format
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { DomainEvent as BaseDomainEvent } from '@shared/domain/base/domain-event';
import { DomainEvent as RabbitMQEvent } from './RabbitMQEventPublisher';
export declare class DomainEventMapper {
    /**
     * Convert domain event to RabbitMQ event format
     */
    static toRabbitMQEvent(domainEvent: BaseDomainEvent): RabbitMQEvent;
    /**
     * Convert multiple domain events
     */
    static toRabbitMQEvents(domainEvents: BaseDomainEvent[]): RabbitMQEvent[];
}
//# sourceMappingURL=DomainEventMapper.d.ts.map