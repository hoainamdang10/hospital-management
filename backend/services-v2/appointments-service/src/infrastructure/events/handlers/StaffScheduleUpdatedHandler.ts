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

import { DomainEvent } from '@shared/domain/base/domain-event';
import { EventHandler } from '@shared/infrastructure/event-bus/EventBus';
import { IProviderScheduleRepository } from '../../../domain/repositories/IProviderScheduleRepository';
import { ProviderSchedule } from '../../../domain/value-objects/ProviderSchedule.vo';

/**
 * Event Handler for StaffScheduleUpdated
 * Implements EventHandler interface from shared infrastructure
 */
export class StaffScheduleUpdatedHandler implements EventHandler<DomainEvent> {
  constructor(
    private readonly providerScheduleRepository: IProviderScheduleRepository
  ) {}

  /**
   * Handle StaffScheduleUpdated event
   * Caches work schedule template in Appointments Service
   */
  async handle(event: DomainEvent): Promise<void> {
  try {
  // Get event data from DomainEvent
  const eventData = event.getEventData();
  
  console.log(`[StaffScheduleUpdatedHandler] Received event for staff: ${eventData.staffId}`);

  // Extract schedule data from event
  const { staffId, newSchedule } = eventData;

      // Create ProviderSchedule value object
      const providerSchedule = ProviderSchedule.create({
        providerId: staffId,
        workingDays: newSchedule.working_days,
        workingHours: {
          start: newSchedule.working_hours.start,
          end: newSchedule.working_hours.end
        },
        timeZone: newSchedule.time_zone,
        isFlexible: newSchedule.is_flexible,
        effectiveDate: new Date(event.occurredAt)
      });

      // Upsert schedule in cache
      await this.providerScheduleRepository.upsert(providerSchedule);

      console.log(`[StaffScheduleUpdatedHandler] Successfully cached schedule for provider: ${staffId}`);
      console.log(`[StaffScheduleUpdatedHandler] Working days: ${newSchedule.working_days.join(', ')}`);
      console.log(`[StaffScheduleUpdatedHandler] Working hours: ${newSchedule.working_hours.start} - ${newSchedule.working_hours.end}`);
      console.log(`[StaffScheduleUpdatedHandler] Time zone: ${newSchedule.time_zone}`);
      console.log(`[StaffScheduleUpdatedHandler] Flexible: ${newSchedule.is_flexible}`);

    } catch (error) {
      console.error('[StaffScheduleUpdatedHandler] Error handling event:', error);
      
      // Log error details for debugging
      const eventData = event.getEventData();
      console.error('[StaffScheduleUpdatedHandler] Event details:', {
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        staffId: eventData.staffId,
        occurredAt: event.occurredAt
      });

      // Re-throw to trigger retry mechanism
      throw error;
    }
  }

  /**
   * Get event type this handler subscribes to
   */
  static getEventType(): string {
    return 'StaffScheduleUpdated';
  }

  /**
   * Get handler name for logging
   */
  static getHandlerName(): string {
    return 'StaffScheduleUpdatedHandler';
  }
}
