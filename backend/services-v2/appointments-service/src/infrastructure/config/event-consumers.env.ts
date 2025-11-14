/**
 * Environment Configuration - Appointment Service Event Consumers
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import dotenv from 'dotenv';

dotenv.config();

export interface AppointmentEventConsumerConfig {
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
  
  // Department Event Consumer
  departmentEventsQueue: string;
  departmentEventsRoutingKeys: string[];
  departmentEventsEnabled: boolean;
  departmentEventsPrefetchCount: number;
  departmentEventsRetryAttempts: number;
  departmentEventsRetryDelayMs: number;
  
  // Clinical EMR Event Consumer
  clinicalEMREventsQueue: string;
  clinicalEMREventsRoutingKeys: string[];
  clinicalEMREventsEnabled: boolean;
  clinicalEMREventsPrefetchCount: number;
  clinicalEMREventsRetryAttempts: number;
  clinicalEMREventsRetryDelayMs: number;
  
  // Billing Event Consumer
  billingEventsQueue: string;
  billingEventsRoutingKeys: string[];
  billingEventsEnabled: boolean;
  billingEventsPrefetchCount: number;
  billingEventsRetryAttempts: number;
  billingEventsRetryDelayMs: number;
}

export const appointmentEventConsumerConfig: AppointmentEventConsumerConfig = {
  // RabbitMQ Configuration
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673',
  exchangeName: process.env.RABBITMQ_EXCHANGE || 'hospital.events',
  
  // Staff Event Consumer Configuration
  staffEventsQueue: process.env.STAFF_EVENTS_QUEUE || 'appointments-service.staff-events',
  staffEventsRoutingKeys: (process.env.STAFF_EVENTS_ROUTING_KEYS || 'availability.staff.changed,shift.staff.assigned,shift.staff.cancelled,schedule.staff.updated').split(','),
  staffEventsEnabled: process.env.STAFF_EVENTS_ENABLED !== 'false',
  staffEventsPrefetchCount: parseInt(process.env.STAFF_EVENTS_PREFETCH_COUNT || '10'),
  staffEventsRetryAttempts: parseInt(process.env.STAFF_EVENTS_RETRY_ATTEMPTS || '3'),
  staffEventsRetryDelayMs: parseInt(process.env.STAFF_EVENTS_RETRY_DELAY_MS || '1000'),
  
  // Department Event Consumer Configuration
  departmentEventsQueue: process.env.DEPARTMENT_EVENTS_QUEUE || 'appointments-service.department-events',
  departmentEventsRoutingKeys: (process.env.DEPARTMENT_EVENTS_ROUTING_KEYS || 'department.created,department.staff.assigned,department.resource.updated,department.operational_hours.changed,department.capacity.updated').split(','),
  departmentEventsEnabled: process.env.DEPARTMENT_EVENTS_ENABLED !== 'false',
  departmentEventsPrefetchCount: parseInt(process.env.DEPARTMENT_EVENTS_PREFETCH_COUNT || '10'),
  departmentEventsRetryAttempts: parseInt(process.env.DEPARTMENT_EVENTS_RETRY_ATTEMPTS || '3'),
  departmentEventsRetryDelayMs: parseInt(process.env.DEPARTMENT_EVENTS_RETRY_DELAY_MS || '1000'),
  
  // Clinical EMR Event Consumer Configuration
  clinicalEMREventsQueue: process.env.CLINICAL_EM_EVENTS_QUEUE || 'appointments-service.clinical-emr-events',
  clinicalEMREventsRoutingKeys: (process.env.CLINICAL_EM_EVENTS_ROUTING_KEYS || 'clinical.patient.profile.updated,clinical.treatment.plan.created,clinical.test.ordered,clinical.document.added,clinical.vitals.recorded').split(','),
  clinicalEMREventsEnabled: process.env.CLINICAL_EM_EVENTS_ENABLED !== 'false',
  clinicalEMREventsPrefetchCount: parseInt(process.env.CLINICAL_EM_EVENTS_PREFETCH_COUNT || '10'),
  clinicalEMREventsRetryAttempts: parseInt(process.env.CLINICAL_EM_EVENTS_RETRY_ATTEMPTS || '3'),
  clinicalEMREventsRetryDelayMs: parseInt(process.env.CLINICAL_EM_EVENTS_RETRY_DELAY_MS || '1000'),
  
  // Billing Event Consumer Configuration
  billingEventsQueue: process.env.BILLING_EVENTS_QUEUE || 'appointments-service.billing-events',
  billingEventsRoutingKeys: (process.env.BILLING_EVENTS_ROUTING_KEYS || 'billing.insurance.coverage.verified,billing.preauthorization.requested,billing.preauthorization.approved,billing.preauthorization.denied,billing.rate.updated').split(','),
  billingEventsEnabled: process.env.BILLING_EVENTS_ENABLED !== 'false',
  billingEventsPrefetchCount: parseInt(process.env.BILLING_EVENTS_PREFETCH_COUNT || '10'),
  billingEventsRetryAttempts: parseInt(process.env.BILLING_EVENTS_RETRY_ATTEMPTS || '3'),
  billingEventsRetryDelayMs: parseInt(process.env.BILLING_EVENTS_RETRY_DELAY_MS || '1000'),
};

export default appointmentEventConsumerConfig;
