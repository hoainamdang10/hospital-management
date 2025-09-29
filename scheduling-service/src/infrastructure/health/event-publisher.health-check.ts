/**
 * Event Publisher Health Check - Infrastructure Layer
 * Health check implementation for event publishing infrastructure
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Health Check Pattern, Event System Monitoring, Production Readiness
 */

import { IHealthCheck, HealthCheckResult, HealthStatus } from '../../../shared/infrastructure/health/health-check.interface';
import { IEventPublisher } from '../../../shared/domain/events/event-publisher.interface';
import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';

export interface EventPublisherHealthMetrics {
  isHealthy: boolean;
  publishTime: number;
  consecutiveFailures: number;
  lastSuccessfulPublish?: Date;
  totalEventsPublished: number;
  failedPublishAttempts: number;
  successRate: number;
  averagePublishTime: number;
}

/**
 * Test Domain Event for Health Check
 */
class HealthCheckEvent extends DomainEvent<{ message: string; timestamp: string }> {
  constructor() {
    super(
      'health-check.test',
      'health-check',
      'HealthCheck',
      {
        message: 'Health check test event',
        timestamp: new Date().toISOString()
      },
      1,
      `health-check-${Date.now()}`,
      `health-check-${Date.now()}`
    );
  }
}

/**
 * Event Publisher Health Check
 * Monitors event publishing infrastructure health
 */
export class EventPublisherHealthCheck implements IHealthCheck {
  private readonly eventPublisher: IEventPublisher;
  private readonly logger: ILogger;
  private readonly checkName: string = 'event-publisher';
  private metrics: EventPublisherHealthMetrics = {
    isHealthy: false,
    publishTime: 0,
    consecutiveFailures: 0,
    totalEventsPublished: 0,
    failedPublishAttempts: 0,
    successRate: 0,
    averagePublishTime: 0
  };
  private publishTimes: number[] = [];
  private readonly maxPublishTimeHistory = 100;

  constructor(eventPublisher: IEventPublisher, logger: ILogger) {
    this.eventPublisher = eventPublisher;
    this.logger = logger;
  }

  /**
   * Perform event publisher health check
   */
  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      this.logger.debug('Starting event publisher health check');

      // Test event publishing
      const publishResult = await this.testEventPublishing();
      if (!publishResult.success) {
        return this.createFailureResult(publishResult.error, startTime);
      }

      // Test batch publishing if supported
      const batchPublishResult = await this.testBatchPublishing();
      if (!batchPublishResult.success) {
        this.logger.warn('Batch publishing test failed, but single publishing works', {
          error: batchPublishResult.error
        });
        // Don't fail the entire health check for batch publishing failure
      }

      // Test subscriber functionality if supported
      const subscriberResult = await this.testSubscriberFunctionality();
      if (!subscriberResult.success) {
        this.logger.warn('Subscriber functionality test failed', {
          error: subscriberResult.error
        });
        // Don't fail the entire health check for subscriber functionality
      }

      // Update success metrics
      this.updateSuccessMetrics(startTime);

      // Create success result
      const result: HealthCheckResult = {
        name: this.checkName,
        status: HealthStatus.HEALTHY,
        message: 'Event publisher is healthy',
        messageVietnamese: 'Hệ thống phát sự kiện hoạt động bình thường',
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        details: {
          publishTime: this.metrics.publishTime,
          consecutiveFailures: this.metrics.consecutiveFailures,
          lastSuccessfulPublish: this.metrics.lastSuccessfulPublish?.toISOString(),
          totalEventsPublished: this.metrics.totalEventsPublished,
          failedPublishAttempts: this.metrics.failedPublishAttempts,
          successRate: this.metrics.successRate,
          averagePublishTime: this.metrics.averagePublishTime,
          tests: {
            singlePublish: 'passed',
            batchPublish: batchPublishResult.success ? 'passed' : 'warning',
            subscriberFunctionality: subscriberResult.success ? 'passed' : 'warning'
          }
        }
      };

      this.logger.debug('Event publisher health check completed successfully', {
        responseTime: result.responseTime,
        publishTime: this.metrics.publishTime,
        successRate: this.metrics.successRate
      });

      return result;

    } catch (error) {
      return this.createFailureResult(error.message, startTime);
    }
  }

  /**
   * Test single event publishing
   */
  private async testEventPublishing(): Promise<{ success: boolean; error?: string }> {
    try {
      const publishStartTime = Date.now();

      // Create test event
      const testEvent = new HealthCheckEvent();

      // Publish event
      await this.eventPublisher.publish(testEvent);

      const publishTime = Date.now() - publishStartTime;
      this.metrics.publishTime = publishTime;
      this.publishTimes.push(publishTime);

      // Trim publish times history
      if (this.publishTimes.length > this.maxPublishTimeHistory) {
        this.publishTimes.shift();
      }

      // Update average publish time
      this.metrics.averagePublishTime = Math.round(
        this.publishTimes.reduce((sum, time) => sum + time, 0) / this.publishTimes.length
      );

      // Check if publish time is acceptable (< 5000ms)
      if (publishTime > 5000) {
        this.logger.warn('Event publishing is slow', {
          publishTime,
          threshold: 5000
        });

        return {
          success: false,
          error: `Event publishing is slow: ${publishTime}ms > 5000ms`
        };
      }

      this.logger.debug('Event publishing test passed', {
        publishTime,
        eventId: testEvent.eventId
      });

      return { success: true };

    } catch (error) {
      this.logger.error('Event publishing test failed', {
        error: error.message
      });

      return {
        success: false,
        error: `Event publishing failed: ${error.message}`
      };
    }
  }

  /**
   * Test batch event publishing
   */
  private async testBatchPublishing(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if batch publishing is supported
      if (!this.eventPublisher.publishBatch) {
        return {
          success: false,
          error: 'Batch publishing not supported'
        };
      }

      const batchStartTime = Date.now();

      // Create test events
      const testEvents = [
        new HealthCheckEvent(),
        new HealthCheckEvent(),
        new HealthCheckEvent()
      ];

      // Publish batch
      await this.eventPublisher.publishBatch(testEvents);

      const batchTime = Date.now() - batchStartTime;

      // Check if batch publish time is acceptable (< 10000ms for 3 events)
      if (batchTime > 10000) {
        this.logger.warn('Batch event publishing is slow', {
          batchTime,
          eventCount: testEvents.length,
          threshold: 10000
        });

        return {
          success: false,
          error: `Batch event publishing is slow: ${batchTime}ms > 10000ms`
        };
      }

      this.logger.debug('Batch event publishing test passed', {
        batchTime,
        eventCount: testEvents.length
      });

      return { success: true };

    } catch (error) {
      this.logger.error('Batch event publishing test failed', {
        error: error.message
      });

      return {
        success: false,
        error: `Batch event publishing failed: ${error.message}`
      };
    }
  }

  /**
   * Test subscriber functionality
   */
  private async testSubscriberFunctionality(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if subscriber functionality is supported (in-memory publisher)
      if (!this.eventPublisher.subscribe) {
        return {
          success: false,
          error: 'Subscriber functionality not supported'
        };
      }

      let eventReceived = false;
      const testEventType = 'health-check.subscriber-test';

      // Create test subscriber
      const testSubscriber = {
        eventType: testEventType,
        handler: async (event: DomainEvent<any>) => {
          eventReceived = true;
          this.logger.debug('Test subscriber received event', {
            eventId: event.eventId,
            eventType: event.eventType
          });
        }
      };

      // Subscribe to test events
      this.eventPublisher.subscribe(testSubscriber);

      // Create and publish test event
      const testEvent = new DomainEvent(
        testEventType,
        'health-check',
        'HealthCheck',
        { message: 'Subscriber test event' },
        1,
        `subscriber-test-${Date.now()}`,
        `subscriber-test-${Date.now()}`
      );

      await this.eventPublisher.publish(testEvent);

      // Wait a bit for event processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Unsubscribe
      if (this.eventPublisher.unsubscribe) {
        this.eventPublisher.unsubscribe(testEventType, testSubscriber.handler);
      }

      if (!eventReceived) {
        return {
          success: false,
          error: 'Test event was not received by subscriber'
        };
      }

      this.logger.debug('Subscriber functionality test passed');
      return { success: true };

    } catch (error) {
      this.logger.error('Subscriber functionality test failed', {
        error: error.message
      });

      return {
        success: false,
        error: `Subscriber functionality test failed: ${error.message}`
      };
    }
  }

  /**
   * Update metrics on successful check
   */
  private updateSuccessMetrics(startTime: number): void {
    this.metrics.consecutiveFailures = 0;
    this.metrics.lastSuccessfulPublish = new Date();
    this.metrics.isHealthy = true;
    this.metrics.totalEventsPublished++;

    // Update success rate
    const totalAttempts = this.metrics.totalEventsPublished + this.metrics.failedPublishAttempts;
    this.metrics.successRate = totalAttempts > 0 
      ? Math.round((this.metrics.totalEventsPublished / totalAttempts) * 100) 
      : 100;
  }

  /**
   * Create failure result
   */
  private createFailureResult(errorMessage: string, startTime: number): HealthCheckResult {
    this.metrics.consecutiveFailures++;
    this.metrics.failedPublishAttempts++;
    this.metrics.isHealthy = false;

    // Update success rate
    const totalAttempts = this.metrics.totalEventsPublished + this.metrics.failedPublishAttempts;
    this.metrics.successRate = totalAttempts > 0 
      ? Math.round((this.metrics.totalEventsPublished / totalAttempts) * 100) 
      : 0;

    const result: HealthCheckResult = {
      name: this.checkName,
      status: this.metrics.consecutiveFailures >= 3 ? HealthStatus.UNHEALTHY : HealthStatus.DEGRADED,
      message: `Event publisher health check failed: ${errorMessage}`,
      messageVietnamese: `Kiểm tra sức khỏe hệ thống phát sự kiện thất bại: ${errorMessage}`,
      timestamp: new Date(),
      responseTime: Date.now() - startTime,
      error: errorMessage,
      details: {
        consecutiveFailures: this.metrics.consecutiveFailures,
        lastSuccessfulPublish: this.metrics.lastSuccessfulPublish?.toISOString(),
        totalEventsPublished: this.metrics.totalEventsPublished,
        failedPublishAttempts: this.metrics.failedPublishAttempts,
        successRate: this.metrics.successRate,
        averagePublishTime: this.metrics.averagePublishTime,
        tests: {
          singlePublish: 'failed',
          batchPublish: 'not_tested',
          subscriberFunctionality: 'not_tested'
        }
      }
    };

    this.logger.error('Event publisher health check failed', {
      error: errorMessage,
      consecutiveFailures: this.metrics.consecutiveFailures,
      responseTime: result.responseTime,
      successRate: this.metrics.successRate
    });

    return result;
  }

  /**
   * Get health check name
   */
  getName(): string {
    return this.checkName;
  }

  /**
   * Get current metrics
   */
  getMetrics(): EventPublisherHealthMetrics {
    return { ...this.metrics };
  }

  /**
   * Get event publisher statistics
   */
  getEventPublisherStatistics(): any {
    const stats: any = {
      metrics: this.getMetrics(),
      publishTimeHistory: [...this.publishTimes]
    };

    // Add in-memory publisher specific stats if available
    if (this.eventPublisher.getEventHistory) {
      stats.eventHistory = {
        totalEvents: this.eventPublisher.getEventHistory().length,
        recentEvents: this.eventPublisher.getEventHistory().slice(-10).map(event => ({
          eventType: event.eventType,
          timestamp: event.timestamp.toISOString(),
          eventId: event.eventId
        }))
      };
    }

    // Add subscriber stats if available
    if (this.eventPublisher.getSubscriberCount) {
      stats.subscribers = {
        'health-check.test': this.eventPublisher.getSubscriberCount('health-check.test'),
        'appointment.scheduled': this.eventPublisher.getSubscriberCount('appointment.scheduled'),
        'appointment.cancelled': this.eventPublisher.getSubscriberCount('appointment.cancelled'),
        'appointment.rescheduled': this.eventPublisher.getSubscriberCount('appointment.rescheduled')
      };
    }

    return stats;
  }

  /**
   * Reset failure counters
   */
  resetFailures(): void {
    this.metrics.consecutiveFailures = 0;
    this.metrics.failedPublishAttempts = 0;
    this.metrics.isHealthy = true;
    
    // Recalculate success rate
    const totalAttempts = this.metrics.totalEventsPublished + this.metrics.failedPublishAttempts;
    this.metrics.successRate = totalAttempts > 0 
      ? Math.round((this.metrics.totalEventsPublished / totalAttempts) * 100) 
      : 100;

    this.logger.info('Event publisher health check failures reset');
  }

  /**
   * Clear publish time history
   */
  clearPublishTimeHistory(): void {
    this.publishTimes = [];
    this.metrics.averagePublishTime = 0;
    this.logger.info('Event publisher publish time history cleared');
  }
}
