/**
 * Event Consumers Environment Configuration
 * Notification Service Event Consumers Configuration - Simplified for Demo
 * 
 * @author Hospital Management Team
 * @version 2.0.0-simplified
 * @compliance Clean Architecture, Environment Management
 */

export interface EventConsumersConfig {
  // RabbitMQ Configuration
  rabbitmqUrl: string;
  
  // Appointment Event Consumer
  appointmentEventQueue: string;
  appointmentEventExchange: string;
  appointmentEventEnabled: boolean;
  
  // Staff Event Consumer
  staffEventQueue: string;
  staffEventExchange: string;
  staffEventEnabled: boolean;
  
  // General Consumer Settings
  consumerPrefetchCount: number;
  consumerRetryAttempts: number;
  consumerRetryDelayMs: number;
  consumerConnectionTimeoutMs: number;
  consumerHeartbeatIntervalMs: number;
  
  // Health Check Settings
  healthCheckIntervalMs: number;
  healthCheckTimeoutMs: number;
}

/**
 * Load event consumers configuration from environment variables
 */
export function loadEventConsumersConfig(): EventConsumersConfig {
  return {
    // RabbitMQ Configuration
    rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    
    // Appointment Event Consumer
    appointmentEventQueue: process.env.APPOINTMENT_EVENT_QUEUE || 'notifications.appointment.events',
    appointmentEventExchange: process.env.APPOINTMENT_EVENT_EXCHANGE || 'appointments.events',
    appointmentEventEnabled: process.env.APPOINTMENT_EVENT_ENABLED !== 'false',
    
    // Staff Event Consumer
    staffEventQueue: process.env.STAFF_EVENT_QUEUE || 'notifications.staff.events',
    staffEventExchange: process.env.STAFF_EVENT_EXCHANGE || 'staff.events',
    staffEventEnabled: process.env.STAFF_EVENT_ENABLED !== 'false',
    
    // General Consumer Settings
    consumerPrefetchCount: parseInt(process.env.EVENT_CONSUMER_PREFETCH_COUNT || '10'),
    consumerRetryAttempts: parseInt(process.env.EVENT_CONSUMER_RETRY_ATTEMPTS || '3'),
    consumerRetryDelayMs: parseInt(process.env.EVENT_CONSUMER_RETRY_DELAY_MS || '1000'),
    consumerConnectionTimeoutMs: parseInt(process.env.EVENT_CONSUMER_CONNECTION_TIMEOUT_MS || '30000'),
    consumerHeartbeatIntervalMs: parseInt(process.env.EVENT_CONSUMER_HEARTBEAT_INTERVAL_MS || '60000'),
    
    // Health Check Settings
    healthCheckIntervalMs: parseInt(process.env.HEALTH_CHECK_INTERVAL_MS || '30000'),
    healthCheckTimeoutMs: parseInt(process.env.HEALTH_CHECK_TIMEOUT_MS || '5000'),
  };
}

/**
 * Validate event consumers configuration
 */
export function validateEventConsumersConfig(config: EventConsumersConfig): void {
  const errors: string[] = [];
  
  // Validate RabbitMQ URL
  if (!config.rabbitmqUrl) {
    errors.push('RABBITMQ_URL is required');
  } else if (!config.rabbitmqUrl.startsWith('amqp://') && !config.rabbitmqUrl.startsWith('amqps://')) {
    errors.push('RABBITMQ_URL must start with amqp:// or amqps://');
  }
  
  // Validate queue names
  if (!config.appointmentEventQueue) {
    errors.push('APPOINTMENT_EVENT_QUEUE is required');
  }
  
  if (!config.staffEventQueue) {
    errors.push('STAFF_EVENT_QUEUE is required');
  }
  
  // Validate exchange names
  if (!config.appointmentEventExchange) {
    errors.push('APPOINTMENT_EVENT_EXCHANGE is required');
  }
  
  if (!config.staffEventExchange) {
    errors.push('STAFF_EVENT_EXCHANGE is required');
  }
  
  // Validate numeric settings
  if (config.consumerPrefetchCount < 1 || config.consumerPrefetchCount > 1000) {
    errors.push('EVENT_CONSUMER_PREFETCH_COUNT must be between 1 and 1000');
  }
  
  if (config.consumerRetryAttempts < 0 || config.consumerRetryAttempts > 10) {
    errors.push('EVENT_CONSUMER_RETRY_ATTEMPTS must be between 0 and 10');
  }
  
  if (config.consumerRetryDelayMs < 100 || config.consumerRetryDelayMs > 60000) {
    errors.push('EVENT_CONSUMER_RETRY_DELAY_MS must be between 100 and 60000');
  }
  
  if (config.consumerConnectionTimeoutMs < 1000 || config.consumerConnectionTimeoutMs > 300000) {
    errors.push('EVENT_CONSUMER_CONNECTION_TIMEOUT_MS must be between 1000 and 300000');
  }
  
  if (config.consumerHeartbeatIntervalMs < 10000 || config.consumerHeartbeatIntervalMs > 300000) {
    errors.push('EVENT_CONSUMER_HEARTBEAT_INTERVAL_MS must be between 10000 and 300000');
  }
  
  if (config.healthCheckIntervalMs < 5000 || config.healthCheckIntervalMs > 300000) {
    errors.push('HEALTH_CHECK_INTERVAL_MS must be between 5000 and 300000');
  }
  
  if (config.healthCheckTimeoutMs < 1000 || config.healthCheckTimeoutMs > 30000) {
    errors.push('HEALTH_CHECK_TIMEOUT_MS must be between 1000 and 30000');
  }
  
  if (errors.length > 0) {
    throw new Error(`Event consumers configuration validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Get routing keys for each event consumer
 */
export function getEventConsumerRoutingKeys(): {
  appointment: string[];
  staff: string[];
} {
  return {
    appointment: [
      'appointment.scheduled',
      'appointment.confirmed',
      'appointment.cancelled',
      'appointment.completed',
      'appointment.rescheduled',
      'appointment.reminder',
      'appointment.no_show'
    ],
    staff: [
      'availability.staff.changed',
      'shift.staff.assigned',
      'shift.staff.cancelled',
      'schedule.staff.updated',
      'department.staff.assigned',
      'oncall.staff.assigned',
      'performance.staff.reviewed'
    ]
  };
}

/**
 * Environment variable documentation
 */
export const EVENT_CONSUMERS_ENV_DOCS = {
  // RabbitMQ Configuration
  RABBITMQ_URL: 'RabbitMQ connection URL (e.g., amqp://localhost:5672)',
  
  // Appointment Event Consumer
  APPOINTMENT_EVENT_QUEUE: 'Queue name for appointment events (default: notifications.appointment.events)',
  APPOINTMENT_EVENT_EXCHANGE: 'Exchange name for appointment events (default: appointments.events)',
  APPOINTMENT_EVENT_ENABLED: 'Enable appointment event consumer (default: true)',
  
  // Staff Event Consumer
  STAFF_EVENT_QUEUE: 'Queue name for staff events (default: notifications.staff.events)',
  STAFF_EVENT_EXCHANGE: 'Exchange name for staff events (default: staff.events)',
  STAFF_EVENT_ENABLED: 'Enable staff event consumer (default: true)',
  
  // General Consumer Settings
  EVENT_CONSUMER_PREFETCH_COUNT: 'Number of messages to prefetch (default: 10, range: 1-1000)',
  EVENT_CONSUMER_RETRY_ATTEMPTS: 'Number of retry attempts for failed messages (default: 3, range: 0-10)',
  EVENT_CONSUMER_RETRY_DELAY_MS: 'Delay between retry attempts in milliseconds (default: 1000, range: 100-60000)',
  EVENT_CONSUMER_CONNECTION_TIMEOUT_MS: 'Connection timeout in milliseconds (default: 30000, range: 1000-300000)',
  EVENT_CONSUMER_HEARTBEAT_INTERVAL_MS: 'Heartbeat interval in milliseconds (default: 60000, range: 10000-300000)',
  
  // Health Check Settings
  HEALTH_CHECK_INTERVAL_MS: 'Health check interval in milliseconds (default: 30000, range: 5000-300000)',
  HEALTH_CHECK_TIMEOUT_MS: 'Health check timeout in milliseconds (default: 5000, range: 1000-30000)',
};
