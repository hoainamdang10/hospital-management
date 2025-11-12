/**
 * Idempotent Event Handler
 * Ensures events are processed only once
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { ILogger } from '@shared/application/services/logger.interface';
import { AuditService } from '../audit/AuditService';

export interface EventMessage {
  eventId: string;
  eventType: string;
  timestamp: Date;
  data: unknown;
  correlationId?: string;
  causationId?: string;
}

/**
 * Idempotent Event Handler
 */
export class IdempotentEventHandler {
  constructor(
    private logger: ILogger,
    private auditService: AuditService
  ) {}

  /**
   * Check if event has been processed
   */
  async hasBeenProcessed(eventId: string, _timestamp: Date): Promise<boolean> {
    try {
      return await this.auditService.hasBeenProcessed(eventId);
    } catch (error) {
      this.logger.error('Failed to check event processing status', {
        eventId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Fail safe - assume not processed
      return false;
    }
  }

  /**
   * Mark event as processed
   */
  async markAsProcessed(eventId: string, timestamp: Date): Promise<void> {
    try {
      await this.auditService.markAsProcessed(eventId, timestamp);
    } catch (error) {
      this.logger.error('Failed to mark event as processed', {
        eventId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
