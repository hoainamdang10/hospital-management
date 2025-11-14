/**
 * Department Event Publisher - Infrastructure Layer
 * Handles publishing of department domain events to RabbitMQ
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, Outbox Pattern
 */

import { IEventBus } from '@shared/application/services/event-bus.interface';
import { Logger } from '@infrastructure/logging/Logger';
import { HealthcareDomainEvent } from '@shared/domain/base/domain-event';
import { Department } from '../../domain/entities/Department';

export interface DepartmentEventPublisherConfig {
  rabbitmqUrl: string;
  exchangeName: string;
  serviceName: string;
  retryAttempts?: number;
  retryDelayMs?: number;
}

/**
 * DepartmentEventPublisher - Publishes department events to message broker
 */
export class DepartmentEventPublisher {
  private isInitialized = false;

  constructor(
    private config: DepartmentEventPublisherConfig,
    private eventBus: IEventBus,
    private logger: Logger,
  ) {}

  /**
   * Initialize the event publisher
   */
  async initialize(): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.eventBus.connect();
        this.isInitialized = true;
        this.logger.info('Department event publisher initialized');
      }
    } catch (error) {
      this.logger.error('Failed to initialize department event publisher', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Publish department domain events
   */
  async publishDepartmentEvents(department: Department): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const events = department.domainEvents;
    
    if (events.length === 0) {
      this.logger.debug('No domain events to publish for department', {
        departmentId: department.id,
      });
      return;
    }

    this.logger.info('Publishing department domain events', {
      departmentId: department.id,
      eventCount: events.length,
    });

    for (const event of events) {
      try {
        await this.publishEvent(event);
        this.logger.debug('Department event published successfully', {
          eventType: event.eventType,
          eventId: event.eventId,
          departmentId: department.id,
        });
      } catch (error) {
        this.logger.error('Failed to publish department event', {
          eventType: event.eventType,
          eventId: event.eventId,
          departmentId: department.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Continue with other events even if one fails
      }
    }

    // Clear events after publishing
    department.clearDomainEvents();
  }

  /**
   * Publish a single event
   */
  private async publishEvent(event: HealthcareDomainEvent): Promise<void> {
    const retryAttempts = this.config.retryAttempts || 3;
    const retryDelayMs = this.config.retryDelayMs || 1000;

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        await this.eventBus.publish(event);
        return; // Success, exit retry loop
      } catch (error) {
        this.logger.warn(`Event publish attempt ${attempt} failed`, {
          eventType: event.eventType,
          eventId: event.eventId,
          attempt,
          maxAttempts: retryAttempts,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        if (attempt === retryAttempts) {
          throw error; // Final attempt failed
        }

        // Wait before retry
        await this.delay(retryDelayMs * attempt);
      }
    }
  }

  /**
   * Publish department created event
   */
  async publishDepartmentCreated(department: Department): Promise<void> {
    this.logger.info('Publishing department created event', {
      departmentId: department.id,
      departmentCode: department.code,
    });

    // The event is already in the domain events collection
    await this.publishDepartmentEvents(department);
  }

  /**
   * Publish department updated event
   */
  async publishDepartmentUpdated(department: Department): Promise<void> {
    this.logger.info('Publishing department updated event', {
      departmentId: department.id,
      departmentCode: department.code,
    });

    await this.publishDepartmentEvents(department);
  }

  /**
   * Publish department head assigned event
   */
  async publishDepartmentHeadAssigned(department: Department): Promise<void> {
    this.logger.info('Publishing department head assigned event', {
      departmentId: department.id,
      departmentCode: department.code,
      headId: department.headOfDepartmentId,
    });

    await this.publishDepartmentEvents(department);
  }

  /**
   * Publish department activated event
   */
  async publishDepartmentActivated(department: Department): Promise<void> {
    this.logger.info('Publishing department activated event', {
      departmentId: department.id,
      departmentCode: department.code,
    });

    await this.publishDepartmentEvents(department);
  }

  /**
   * Publish department deactivated event
   */
  async publishDepartmentDeactivated(department: Department): Promise<void> {
    this.logger.info('Publishing department deactivated event', {
      departmentId: department.id,
      departmentCode: department.code,
    });

    await this.publishDepartmentEvents(department);
  }

  /**
   * Publish department staff count changed event
   */
  async publishDepartmentStaffCountChanged(department: Department): Promise<void> {
    this.logger.info('Publishing department staff count changed event', {
      departmentId: department.id,
      departmentCode: department.code,
      staffCount: department.staffCount,
    });

    await this.publishDepartmentEvents(department);
  }

  /**
   * Disconnect from event bus
   */
  async disconnect(): Promise<void> {
    try {
      if (this.isInitialized) {
        await this.eventBus.disconnect();
        this.isInitialized = false;
        this.logger.info('Department event publisher disconnected');
      }
    } catch (error) {
      this.logger.error('Error disconnecting department event publisher', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if publisher is initialized
   */
  isPublisherInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Utility method for delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Factory function for dependency injection
export function createDepartmentEventPublisher(
  config: DepartmentEventPublisherConfig,
  eventBus: IEventBus,
  logger: Logger,
): DepartmentEventPublisher {
  return new DepartmentEventPublisher(config, eventBus, logger);
}
