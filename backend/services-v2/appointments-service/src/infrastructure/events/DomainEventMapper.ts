/**
 * Domain Event Mapper - Infrastructure Layer
 * Maps domain events to RabbitMQ message format
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { AppointmentScheduledEvent } from '../../domain/events/AppointmentScheduledEvent';
import { AppointmentRescheduledEvent } from '../../domain/events/AppointmentRescheduledEvent';
import { AppointmentCancelledEvent } from '../../domain/events/AppointmentCancelledEvent';
import { AppointmentCompletedEvent } from '../../domain/events/AppointmentCompletedEvent';

import { AppointmentReminderScheduledEvent } from '../../domain/events/AppointmentReminderScheduledEvent';
import { AppointmentConfirmedEvent } from '../../domain/events/AppointmentConfirmedEvent';
import { AppointmentStartedEvent } from '../../domain/events/AppointmentStartedEvent';
import { AppointmentNoShowEvent } from '../../domain/events/AppointmentNoShowEvent';
import { PatientJoinedQueueEvent } from '../../domain/events/PatientJoinedQueueEvent';
import { PatientCalledEvent } from '../../domain/events/PatientCalledEvent';
import { PatientLeftQueueEvent } from '../../domain/events/PatientLeftQueueEvent';
import { DomainEvent } from '@shared/domain/base/domain-event';

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
export class DomainEventMapper {
  /**
   * Map domain event to RabbitMQ message
   */
  static toRabbitMQ(event: DomainEvent): RabbitMQMessage {
    if (event instanceof AppointmentScheduledEvent) {
      return {
        eventId: event.eventId,
        eventType: 'appointment.scheduled',
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        occurredAt: event.occurredAt,
        version: 1,
        payload: event.getEventData(),
        metadata: {
          correlationId: event.eventId,
        },
      };
    }

    if (event instanceof AppointmentRescheduledEvent) {
      return {
        eventId: event.eventId,
        eventType: 'appointment.rescheduled',
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        occurredAt: event.occurredAt,
        version: 1,
        payload: event.getEventData(),
        metadata: {
          correlationId: event.eventId,
        },
      };
    }

    if (event instanceof AppointmentCancelledEvent) {
      return {
        eventId: event.eventId,
        eventType: 'appointment.cancelled',
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        occurredAt: event.occurredAt,
        version: 1,
        payload: event.getEventData(),
        metadata: {
          correlationId: event.eventId,
        },
      };
    }

    if (event instanceof AppointmentCompletedEvent) {
      return {
        eventId: event.eventId,
        eventType: 'appointment.completed',
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        occurredAt: event.occurredAt,
        version: 1,
        payload: event.getEventData(),
        metadata: {
          correlationId: event.eventId,
        },
      };
    }



    if (event instanceof AppointmentReminderScheduledEvent) {
      return {
        eventId: event.eventId,
        eventType: 'appointment.reminder-scheduled',
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        occurredAt: event.occurredAt,
        version: 1,
        payload: event.getEventData(),
        metadata: {
          correlationId: event.eventId,
        },
      };
    }

    if (event instanceof AppointmentConfirmedEvent) {
      return {
        eventId: event.eventId,
        eventType: 'appointment.confirmed',
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        occurredAt: event.occurredAt,
        version: 1,
        payload: event.getEventData(),
        metadata: {
          correlationId: event.eventId,
        },
      };
    }

    if (event instanceof AppointmentStartedEvent) {
      return {
        eventId: event.eventId,
        eventType: 'appointment.started',
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        occurredAt: event.occurredAt,
        version: 1,
        payload: event.getEventData(),
        metadata: {
          correlationId: event.eventId,
        },
      };
    }

    if (event instanceof AppointmentNoShowEvent) {
      return {
        eventId: event.eventId,
        eventType: 'appointment.noshow',
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        occurredAt: event.occurredAt,
        version: 1,
        payload: event.getEventData(),
        metadata: {
          correlationId: event.eventId,
        },
      };
    }

    if (event instanceof PatientJoinedQueueEvent) {
      return {
        eventId: event.eventId,
        eventType: 'queue.patient.joined',
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        occurredAt: event.occurredAt,
        version: 1,
        payload: event.getEventData(),
        metadata: {
          correlationId: event.eventId,
        },
      };
    }

    if (event instanceof PatientCalledEvent) {
      return {
        eventId: event.eventId,
        eventType: 'queue.patient.called',
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        occurredAt: event.occurredAt,
        version: 1,
        payload: event.getEventData(),
        metadata: {
          correlationId: event.eventId,
        },
      };
    }

    if (event instanceof PatientLeftQueueEvent) {
      return {
        eventId: event.eventId,
        eventType: 'queue.patient.left',
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        occurredAt: event.occurredAt,
        version: 1,
        payload: event.getEventData(),
        metadata: {
          correlationId: event.eventId,
        },
      };
    }

    throw new Error(`Unknown event type: ${event.constructor.name}`);
  }

  /**
   * Get routing key for event
   */
  static getRoutingKey(event: DomainEvent): string {
    if (event instanceof AppointmentScheduledEvent) {
      return 'appointment.scheduled';
    }
    if (event instanceof AppointmentRescheduledEvent) {
      return 'appointment.rescheduled';
    }
    if (event instanceof AppointmentCancelledEvent) {
      return 'appointment.cancelled';
    }
    if (event instanceof AppointmentCompletedEvent) {
      return 'appointment.completed';
    }

    if (event instanceof AppointmentReminderScheduledEvent) {
      return 'appointment.reminder-scheduled';
    }
    if (event instanceof AppointmentConfirmedEvent) {
      return 'appointment.confirmed';
    }
    if (event instanceof AppointmentStartedEvent) {
      return 'appointment.started';
    }
    if (event instanceof AppointmentNoShowEvent) {
      return 'appointment.noshow';
    }
    if (event instanceof PatientJoinedQueueEvent) {
      return 'queue.patient.joined';
    }
    if (event instanceof PatientCalledEvent) {
      return 'queue.patient.called';
    }
    if (event instanceof PatientLeftQueueEvent) {
      return 'queue.patient.left';
    }

    throw new Error(`Unknown event type: ${event.constructor.name}`);
  }
}
