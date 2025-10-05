/**
 * Infrastructure Layer Exports
 * Patient Registry Service V2
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

// Repositories
export { SupabasePatientRepository } from './repositories/SupabasePatientRepository';

// Mappers
export { PatientMapper } from './mappers/PatientMapper';
export type {
  PatientRecord,
  InsuranceRecord,
  EmergencyContactRecord,
  PatientConsentRecord,
  PatientLinkRecord
} from './mappers/PatientMapper';

// Services (moved to application layer)
// Note: PatientMatchingService and InsuranceValidationService are now in application/services
// Import from application layer instead:
// import { PatientMatchingService } from '../application/services/PatientMatchingService';
// import { InsuranceValidationService } from '../application/services/InsuranceValidationService';

// Event Handlers
// TODO: Re-enable when event infrastructure is ready
// export { PatientDomainEventHandler } from './events/PatientDomainEventHandler';
// export type { PatientDomainEventHandlerConfig } from './events/PatientDomainEventHandler';

