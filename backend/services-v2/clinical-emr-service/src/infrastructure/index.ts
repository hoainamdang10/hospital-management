/**
 * Infrastructure Layer Exports - Clinical EMR Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

// Repositories
export { SupabaseMedicalRecordRepository } from './repositories/SupabaseMedicalRecordRepository';
export { SupabaseClinicalNoteRepository } from './repositories/SupabaseClinicalNoteRepository';
export { SupabaseLabResultRepository } from './repositories/SupabaseLabResultRepository';
export { SupabaseImagingStudyRepository } from './repositories/SupabaseImagingStudyRepository';
export { SupabasePrescriptionRepository } from './repositories/SupabasePrescriptionRepository';
export { SupabaseTreatmentPlanRepository } from './repositories/SupabaseTreatmentPlanRepository';
export { SupabaseAuditLogRepository } from './repositories/SupabaseAuditLogRepository';
export { SupabaseIntegrationInboxRepository } from './repositories/SupabaseIntegrationInboxRepository';
export { SupabasePatientSnapshotRepository } from './repositories/SupabasePatientSnapshotRepository';
export { SupabaseProviderSnapshotRepository } from './repositories/SupabaseProviderSnapshotRepository';

// Event System
export { RabbitMQEventPublisher } from './events/RabbitMQEventPublisher';
export { ClinicalIntegrationEventConsumer } from './events/ClinicalIntegrationEventConsumer';
export { AppointmentEventConsumer } from './events/AppointmentEventConsumer';
export { BillingEventConsumer } from './events/BillingEventConsumer';

// Outbox Pattern
export { SupabaseOutboxRepository } from './outbox/SupabaseOutboxRepository';
export { OutboxPublisherWorker } from './outbox/OutboxPublisherWorker';

// Database
export { supabaseClient } from './db/supabase-client';

// Types
export type {
  AppointmentEventConsumerConfig,
  AppointmentCompletedEventData,
  AppointmentCheckedInEventData,
  AppointmentCancelledEventData
} from './events/AppointmentEventConsumer';

export type {
  BillingEventConsumerConfig,
  InvoicePaidEventData,
  InvoiceFinalizedEventData,
  InsuranceClaimProcessedEventData
} from './events/BillingEventConsumer';
