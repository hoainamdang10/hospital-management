/**
 * Patient Event Configuration
 * Configuration for consuming patient events from Patient Registry Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

export const PATIENT_EVENT_CONFIG = {
  // RabbitMQ configuration
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    exchange: 'hospital.events',
    exchangeType: 'topic',
    durable: true,
    autoDelete: false,
  },

  // Queue configuration for patient events
  queue: {
    name: 'identity.patient.events',
    routingKeys: [
      'patient.updated',
      'patient.created',
      'patient.deleted'
    ],
    deadLetterExchange: 'hospital.events.dlx',
    deadLetterQueue: 'identity.patient.events.dlq',
    maxRetries: 3,
  },

  // Consumer configuration
  consumer: {
    connectionRetries: 5,
    connectionRetryDelayMs: 3000,
    prefetch: 1,
    reconnectDelayMs: 5000,
    maxReconnectAttempts: 10,
  }
};
