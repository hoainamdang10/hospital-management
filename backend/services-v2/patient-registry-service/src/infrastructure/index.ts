/**
 * Infrastructure Layer Exports
 * Patient Registry Service V2
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

// Repositories
export { SupabasePatientRepository } from "./repositories/SupabasePatientRepository";

// Mappers
export { PatientMapper } from "./mappers/PatientMapper";
export type {
  PatientRecord,
  InsuranceRecord,
  EmergencyContactRecord,
  PatientConsentRecord,
  PatientLinkRecord,
} from "./mappers/PatientMapper";

// Services (moved to application layer)
// Note: PatientMatchingService and InsuranceValidationService are now in application/services
// Import from application layer instead:
// import { PatientMatchingService } from '../application/services/PatientMatchingService';
// import { InsuranceValidationService } from '../application/services/InsuranceValidationService';

// Event Infrastructure
export { RabbitMQEventPublisher } from "./events/RabbitMQEventPublisher";
export { IdentityEventConsumer } from "./events/IdentityEventConsumer";
export type { IdentityEventConsumerConfig } from "./events/IdentityEventConsumer";

// Event Handlers
export { IdentityUserCreatedEventHandler } from "./events/handlers/IdentityUserCreatedEventHandler";
export { IdentityUserDeletedEventHandler } from "./events/handlers/IdentityUserDeletedEventHandler";
export { IdentityUserUpdatedEventHandler } from "./events/handlers/IdentityUserUpdatedEventHandler";
export { UserActivatedEventHandler } from "./events/handlers/UserActivatedEventHandler";
export { UserDeactivatedEventHandler } from "./events/handlers/UserDeactivatedEventHandler";
export type { IdentityUserCreatedEventData } from "./events/handlers/IdentityUserCreatedEventHandler";
export type { IdentityUserDeletedEventData } from "./events/handlers/IdentityUserDeletedEventHandler";
export type { IdentityUserUpdatedEventData } from "./events/handlers/IdentityUserUpdatedEventHandler";
export type { UserActivatedEventData } from "./events/handlers/UserActivatedEventHandler";
export type { UserDeactivatedEventData } from "./events/handlers/UserDeactivatedEventHandler";
