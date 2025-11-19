/**
 * Infrastructure Layer Exports - Billing Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

// Repositories
export { SupabaseInvoiceRepository } from "./repositories/SupabaseInvoiceRepository";
export { SupabasePatientRepository } from "./repositories/SupabasePatientRepository";

// Event Consumers
export { AppointmentEventConsumer } from "./events/AppointmentEventConsumer";
export { ClinicalEventConsumer } from "./events/ClinicalEventConsumer";

// Services
export { VnpayIntegrationService } from "./services/VnpayIntegrationService";

// Types
export type {
  AppointmentEventConsumerConfig,
  AppointmentScheduledEventData,
  AppointmentCancelledLateEventData,
  AppointmentNoShowEventData,
} from "./events/AppointmentEventConsumer";

export type {
  ClinicalEventConsumerConfig,
  ClinicalPrescriptionCreatedEventData,
  ClinicalLabResultCreatedEventData,
  ClinicalTreatmentPlanCreatedEventData,
  ClinicalMedicalRecordCreatedEventData,
} from "./events/ClinicalEventConsumer";
