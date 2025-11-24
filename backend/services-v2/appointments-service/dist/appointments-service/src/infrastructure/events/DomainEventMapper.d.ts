/**
 * Domain Event Mapper - Infrastructure Layer
 * Maps domain events to RabbitMQ message format
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
/**
 * RabbitMQ Message Format
 */
export interface RabbitMQMessage {
    eventId: string;
    eventType: string;
    aggregateId: string;
    aggregateType: string;
    occurredAt: Date;
    version: number;
    payload: any;
    metadata?: {
        correlationId?: string;
        causationId?: string;
        userId?: string;
        tenantId?: string;
    };
}
/**
 * Domain Event Mapper
 * Converts domain events to RabbitMQ message format
 */
export declare class DomainEventMapper {
    /**
     * Map domain event to RabbitMQ message
     */
    static toRabbitMQ(event: DomainEvent): RabbitMQMessage;
    /**
     * Get routing key for event
     */
    static getRoutingKey(event: DomainEvent): string;
}
//# sourceMappingURL=DomainEventMapper.d.ts.map