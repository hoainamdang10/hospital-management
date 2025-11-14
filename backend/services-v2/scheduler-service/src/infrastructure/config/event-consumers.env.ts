/**
 * Environment Configuration - Scheduler Service Event Consumers
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import dotenv from 'dotenv';

dotenv.config();

export interface SchedulerEventConsumerConfig {
  // RabbitMQ Configuration
  rabbitmqUrl: string;
  exchangeName: string;
  
  // Staff Event Consumer
  staffEventsQueue: string;
  staffEventsRoutingKeys: string[];
  staffEventsEnabled: boolean;
  staffEventsPrefetchCount: number;
  staffEventsRetryAttempts: number;
  staffEventsRetryDelayMs: number;
  
  // System Event Consumer
  systemEventsQueue: string;
  systemEventsRoutingKeys: string[];
  systemEventsEnabled: boolean;
  systemEventsPrefetchCount: number;
  systemEventsRetryAttempts: number;
  systemEventsRetryDelayMs: number;
  
  // Billing Event Consumer
  billingEventsQueue: string;
  billingEventsRoutingKeys: string[];
  billingEventsEnabled: boolean;
  billingEventsPrefetchCount: number;
  billingEventsRetryAttempts: number;
  billingEventsRetryDelayMs: number;
  
  // Department Event Consumer
  departmentEventsQueue: string;
  departmentEventsRoutingKeys: string[];
  departmentEventsEnabled: boolean;
  departmentEventsPrefetchCount: number;
  departmentEventsRetryAttempts: number;
  departmentEventsRetryDelayMs: number;
}

export const schedulerEventConsumerConfig: SchedulerEventConsumerConfig = {
  // RabbitMQ Configuration
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673',
  exchangeName: process.env.RABBITMQ_EXCHANGE || 'hospital.events',
  
  // Staff Event Consumer Configuration
  staffEventsQueue: process.env.STAFF_EVENTS_QUEUE || 'scheduler-service.staff-events',
  staffEventsRoutingKeys: (process.env.STAFF_EVENTS_ROUTING_KEYS || 'availability.staff.changed,shift.staff.assigned,shift.staff.cancelled,schedule.staff.updated').split(','),
  staffEventsEnabled: process.env.STAFF_EVENTS_ENABLED !== 'false',
  staffEventsPrefetchCount: parseInt(process.env.STAFF_EVENTS_PREFETCH_COUNT || '10'),
  staffEventsRetryAttempts: parseInt(process.env.STAFF_EVENTS_RETRY_ATTEMPTS || '3'),
  staffEventsRetryDelayMs: parseInt(process.env.STAFF_EVENTS_RETRY_DELAY_MS || '1000'),
  
  // System Event Consumer Configuration
  systemEventsQueue: process.env.SYSTEM_EVENTS_QUEUE || 'scheduler-service.system-events',
  systemEventsRoutingKeys: (process.env.SYSTEM_EVENTS_ROUTING_KEYS || 'system.health.checked,system.maintenance.scheduled,system.report.requested,system.alert.triggered').split(','),
  systemEventsEnabled: process.env.SYSTEM_EVENTS_ENABLED !== 'false',
  systemEventsPrefetchCount: parseInt(process.env.SYSTEM_EVENTS_PREFETCH_COUNT || '10'),
  systemEventsRetryAttempts: parseInt(process.env.SYSTEM_EVENTS_RETRY_ATTEMPTS || '3'),
  systemEventsRetryDelayMs: parseInt(process.env.SYSTEM_EVENTS_RETRY_DELAY_MS || '1000'),
  
  // Billing Event Consumer Configuration
  billingEventsQueue: process.env.BILLING_EVENTS_QUEUE || 'scheduler-service.billing-events',
  billingEventsRoutingKeys: (process.env.BILLING_EVENTS_ROUTING_KEYS || 'billing.invoice.generated,billing.payment.processed,billing.insurance.claim.processed,billing.report.requested').split(','),
  billingEventsEnabled: process.env.BILLING_EVENTS_ENABLED !== 'false',
  billingEventsPrefetchCount: parseInt(process.env.BILLING_EVENTS_PREFETCH_COUNT || '10'),
  billingEventsRetryAttempts: parseInt(process.env.BILLING_EVENTS_RETRY_ATTEMPTS || '3'),
  billingEventsRetryDelayMs: parseInt(process.env.BILLING_EVENTS_RETRY_DELAY_MS || '1000'),
  
  // Department Event Consumer Configuration
  departmentEventsQueue: process.env.DEPARTMENT_EVENTS_QUEUE || 'scheduler-service.department-events',
  departmentEventsRoutingKeys: (process.env.DEPARTMENT_EVENTS_ROUTING_KEYS || 'department.created,department.staff.assigned,department.resource.updated,department.operational_hours.changed').split(','),
  departmentEventsEnabled: process.env.DEPARTMENT_EVENTS_ENABLED !== 'false',
  departmentEventsPrefetchCount: parseInt(process.env.DEPARTMENT_EVENTS_PREFETCH_COUNT || '10'),
  departmentEventsRetryAttempts: parseInt(process.env.DEPARTMENT_EVENTS_RETRY_ATTEMPTS || '3'),
  departmentEventsRetryDelayMs: parseInt(process.env.DEPARTMENT_EVENTS_RETRY_DELAY_MS || '1000'),
};

export default schedulerEventConsumerConfig;
