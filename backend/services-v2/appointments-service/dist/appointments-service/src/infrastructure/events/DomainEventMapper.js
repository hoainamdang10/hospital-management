"use strict";
/**
 * Domain Event Mapper - Infrastructure Layer
 * Maps domain events to RabbitMQ message format
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEventMapper = void 0;
const AppointmentScheduledEvent_1 = require("../../domain/events/AppointmentScheduledEvent");
const AppointmentRescheduledEvent_1 = require("../../domain/events/AppointmentRescheduledEvent");
const AppointmentCancelledEvent_1 = require("../../domain/events/AppointmentCancelledEvent");
const AppointmentCompletedEvent_1 = require("../../domain/events/AppointmentCompletedEvent");
const AppointmentCheckedInEvent_1 = require("../../domain/events/AppointmentCheckedInEvent");
const AppointmentReminderScheduledEvent_1 = require("../../domain/events/AppointmentReminderScheduledEvent");
const AppointmentConfirmedEvent_1 = require("../../domain/events/AppointmentConfirmedEvent");
const AppointmentStartedEvent_1 = require("../../domain/events/AppointmentStartedEvent");
const AppointmentNoShowEvent_1 = require("../../domain/events/AppointmentNoShowEvent");
const PatientJoinedQueueEvent_1 = require("../../domain/events/PatientJoinedQueueEvent");
const PatientCalledEvent_1 = require("../../domain/events/PatientCalledEvent");
const PatientLeftQueueEvent_1 = require("../../domain/events/PatientLeftQueueEvent");
/**
 * Domain Event Mapper
 * Converts domain events to RabbitMQ message format
 */
class DomainEventMapper {
    /**
     * Map domain event to RabbitMQ message
     */
    static toRabbitMQ(event) {
        if (event instanceof AppointmentScheduledEvent_1.AppointmentScheduledEvent) {
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
        if (event instanceof AppointmentRescheduledEvent_1.AppointmentRescheduledEvent) {
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
        if (event instanceof AppointmentCancelledEvent_1.AppointmentCancelledEvent) {
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
        if (event instanceof AppointmentCompletedEvent_1.AppointmentCompletedEvent) {
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
        if (event instanceof AppointmentCheckedInEvent_1.AppointmentCheckedInEvent) {
            return {
                eventId: event.eventId,
                eventType: 'appointment.checked-in',
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
        if (event instanceof AppointmentReminderScheduledEvent_1.AppointmentReminderScheduledEvent) {
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
        if (event instanceof AppointmentConfirmedEvent_1.AppointmentConfirmedEvent) {
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
        if (event instanceof AppointmentStartedEvent_1.AppointmentStartedEvent) {
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
        if (event instanceof AppointmentNoShowEvent_1.AppointmentNoShowEvent) {
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
        if (event instanceof PatientJoinedQueueEvent_1.PatientJoinedQueueEvent) {
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
        if (event instanceof PatientCalledEvent_1.PatientCalledEvent) {
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
        if (event instanceof PatientLeftQueueEvent_1.PatientLeftQueueEvent) {
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
    static getRoutingKey(event) {
        if (event instanceof AppointmentScheduledEvent_1.AppointmentScheduledEvent) {
            return 'appointment.scheduled';
        }
        if (event instanceof AppointmentRescheduledEvent_1.AppointmentRescheduledEvent) {
            return 'appointment.rescheduled';
        }
        if (event instanceof AppointmentCancelledEvent_1.AppointmentCancelledEvent) {
            return 'appointment.cancelled';
        }
        if (event instanceof AppointmentCompletedEvent_1.AppointmentCompletedEvent) {
            return 'appointment.completed';
        }
        if (event instanceof AppointmentCheckedInEvent_1.AppointmentCheckedInEvent) {
            return 'appointment.checked-in';
        }
        if (event instanceof AppointmentReminderScheduledEvent_1.AppointmentReminderScheduledEvent) {
            return 'appointment.reminder-scheduled';
        }
        if (event instanceof AppointmentConfirmedEvent_1.AppointmentConfirmedEvent) {
            return 'appointment.confirmed';
        }
        if (event instanceof AppointmentStartedEvent_1.AppointmentStartedEvent) {
            return 'appointment.started';
        }
        if (event instanceof AppointmentNoShowEvent_1.AppointmentNoShowEvent) {
            return 'appointment.noshow';
        }
        if (event instanceof PatientJoinedQueueEvent_1.PatientJoinedQueueEvent) {
            return 'queue.patient.joined';
        }
        if (event instanceof PatientCalledEvent_1.PatientCalledEvent) {
            return 'queue.patient.called';
        }
        if (event instanceof PatientLeftQueueEvent_1.PatientLeftQueueEvent) {
            return 'queue.patient.left';
        }
        throw new Error(`Unknown event type: ${event.constructor.name}`);
    }
}
exports.DomainEventMapper = DomainEventMapper;
//# sourceMappingURL=DomainEventMapper.js.map