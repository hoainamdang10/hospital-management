/**
 * Hybrid Event Bus
 * Publishes events to both Supabase (local) and RabbitMQ (cross-service)
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Clean Architecture
 */

import { IEventBus } from '@shared/events/event-bus.interface';
import { DomainEvent } from '@shared/domain/base/domain-event';
import { ILogger } from '../../application/interfaces/ILogger';
import { SupabaseEventBus } from '../messaging/SupabaseEventBus';
import { RabbitMQEventPublisher, IntegrationEvent } from './RabbitMQEventPublisher';

/**
 * Hybrid Event Bus Configuration
 */
export interface HybridEventBusConfig {
  supabaseUrl: string;
  supabaseKey: string;
  schema: string;
  rabbitmqUrl: string;
  rabbitmqExchange: string;
  rabbitmqExchangeType: 'topic' | 'direct' | 'fanout';
  serviceName: string;
  logger: ILogger;
}

/**
 * Hybrid Event Bus
 * Combines Supabase (local event store) and RabbitMQ (cross-service messaging)
 */
export class HybridEventBus implements IEventBus {
  private supabaseEventBus: SupabaseEventBus;
  private rabbitmqPublisher: RabbitMQEventPublisher | null = null;
  private logger: ILogger;
  private serviceName: string;

  constructor(config: HybridEventBusConfig) {
    this.logger = config.logger;
    this.serviceName = config.serviceName;

    // Initialize Supabase Event Bus (local)
    this.supabaseEventBus = new SupabaseEventBus(
      config.supabaseUrl,
      config.supabaseKey,
      config.logger,
      config.schema
    );

    // Initialize RabbitMQ Publisher (cross-service)
    try {
      this.rabbitmqPublisher = new RabbitMQEventPublisher(
        {
          url: config.rabbitmqUrl,
          exchange: config.rabbitmqExchange,
          exchangeType: config.rabbitmqExchangeType,
          durable: true,
          autoDelete: false
        },
        {
          enableRetry: true,
          maxRetries: 3,
          retryDelayMs: 1000,
          enableLogging: true
        },
        config.logger
      );
    } catch (error) {
      this.logger.error('Failed to initialize RabbitMQ publisher', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.rabbitmqPublisher = null;
    }
  }

  /**
   * Connect to both event buses
   */
  async connect(): Promise<void> {
    this.logger.info('Connecting Hybrid Event Bus...');

    // Connect Supabase Event Bus
    await this.supabaseEventBus.connect();

    // Connect RabbitMQ Publisher
    if (this.rabbitmqPublisher) {
      try {
        await this.rabbitmqPublisher.connect();
        this.logger.info('RabbitMQ publisher connected successfully');
      } catch (error) {
        this.logger.error('Failed to connect RabbitMQ publisher', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        this.logger.warn('Continuing with Supabase-only event publishing');
        this.rabbitmqPublisher = null;
      }
    }

    this.logger.info('Hybrid Event Bus connected');
  }

  /**
   * Disconnect from both event buses
   */
  async disconnect(): Promise<void> {
    this.logger.info('Disconnecting Hybrid Event Bus...');

    // Disconnect Supabase Event Bus
    await this.supabaseEventBus.disconnect();

    // Disconnect RabbitMQ Publisher
    if (this.rabbitmqPublisher) {
      await this.rabbitmqPublisher.disconnect();
    }

    this.logger.info('Hybrid Event Bus disconnected');
  }

  /**
   * Publish event to both Supabase and RabbitMQ
   */
  async publish(event: DomainEvent): Promise<void> {
    try {
      // 1. Publish to Supabase (local event store)
      await this.supabaseEventBus.publish(event);
      this.logger.debug('Event published to Supabase', {
        eventType: event.eventType,
        eventId: event.eventId
      });

      // 2. Publish to RabbitMQ (cross-service)
      if (this.rabbitmqPublisher && this.rabbitmqPublisher.isReady()) {
        const integrationEvent = this.convertToIntegrationEvent(event);
        await this.rabbitmqPublisher.publish(integrationEvent);
        this.logger.debug('Event published to RabbitMQ', {
          eventType: event.eventType,
          eventId: event.eventId
        });
      } else {
        this.logger.warn('RabbitMQ publisher not ready, event only published to Supabase', {
          eventType: event.eventType,
          eventId: event.eventId
        });
      }

    } catch (error) {
      this.logger.error('Failed to publish event', {
        eventType: event.eventType,
        eventId: event.eventId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Subscribe to events (delegates to Supabase Event Bus)
   */
  async subscribe(
    eventType: string,
    handler: any,
    queueName?: string
  ): Promise<void> {
    await this.supabaseEventBus.subscribe(eventType, handler, queueName);
  }

  /**
   * Convert DomainEvent to IntegrationEvent for RabbitMQ
   */
  private convertToIntegrationEvent(event: DomainEvent): IntegrationEvent {
    return {
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType || 'ProviderStaff',
      occurredAt: (event as any).timestamp || new Date(),
      serviceName: this.serviceName,
      eventData: this.extractEventData(event),
      metadata: {
        priority: this.determineEventPriority(event.eventType),
        complianceLevel: 'hipaa',
        containsPHI: this.containsPHI(event.eventType),
        eventCategory: 'provider-staff',
        eventSubcategory: this.getEventSubcategory(event.eventType),
        vietnameseDescription: this.getVietnameseDescription(event.eventType)
      }
    };
  }

  /**
   * Extract event data from domain event
   */
  private extractEventData(event: DomainEvent): any {
    const data: any = { ...event };
    
    // Remove metadata fields
    delete data.eventId;
    delete data.eventType;
    delete data.aggregateId;
    delete data.aggregateType;
    delete data.timestamp;
    delete data.correlationId;
    delete data.causationId;

    return data;
  }

  /**
   * Determine event priority based on event type
   */
  private determineEventPriority(eventType: string): 'low' | 'normal' | 'high' | 'critical' {
    const criticalEvents = ['StaffStatusChanged', 'StaffEmploymentStatusUpdated'];
    const highEvents = ['StaffRegistered', 'StaffCredentialVerified'];
    
    if (criticalEvents.includes(eventType)) return 'critical';
    if (highEvents.includes(eventType)) return 'high';
    return 'normal';
  }

  /**
   * Check if event contains PHI (Protected Health Information)
   */
  private containsPHI(eventType: string): boolean {
    const phiEvents = ['StaffRegistered', 'StaffUpdated'];
    return phiEvents.includes(eventType);
  }

  /**
   * Get event subcategory
   */
  private getEventSubcategory(eventType: string): string {
    if (eventType.includes('Credential')) return 'credentials';
    if (eventType.includes('Schedule')) return 'scheduling';
    if (eventType.includes('Status')) return 'status-management';
    if (eventType.includes('Employment')) return 'employment';
    return 'general';
  }

  /**
   * Get Vietnamese description for event
   */
  private getVietnameseDescription(eventType: string): string {
    const descriptions: Record<string, string> = {
      'StaffRegistered': 'Đăng ký nhân viên y tế mới',
      'StaffUpdated': 'Cập nhật thông tin nhân viên',
      'StaffCredentialVerified': 'Xác minh chứng chỉ hành nghề',
      'StaffScheduleUpdated': 'Cập nhật lịch làm việc',
      'StaffStatusChanged': 'Thay đổi trạng thái nhân viên',
      'StaffEmploymentStatusUpdated': 'Cập nhật tình trạng tuyển dụng'
    };
    return descriptions[eventType] || 'Sự kiện nhân viên y tế';
  }

  /**
   * Check if RabbitMQ is ready
   */
  isRabbitMQReady(): boolean {
    return this.rabbitmqPublisher?.isReady() || false;
  }

  /**
   * Get event bus status
   */
  getStatus(): {
    supabase: boolean;
    rabbitmq: boolean;
    overall: 'healthy' | 'degraded' | 'unhealthy';
  } {
    const supabaseReady = true; // Supabase is always ready
    const rabbitmqReady = this.isRabbitMQReady();

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (supabaseReady && rabbitmqReady) {
      overall = 'healthy';
    } else if (supabaseReady) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return {
      supabase: supabaseReady,
      rabbitmq: rabbitmqReady,
      overall
    };
  }
}

