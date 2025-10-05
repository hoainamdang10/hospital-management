/**
 * Infrastructure Layer Exports
 * Patient Registry Service V2
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
export { SupabasePatientRepository } from './repositories/SupabasePatientRepository';
export { PatientMapper } from './mappers/PatientMapper';
export type { PatientRecord, InsuranceRecord, EmergencyContactRecord, PatientConsentRecord, PatientLinkRecord } from './mappers/PatientMapper';
export { PatientMatchingService } from './services/PatientMatchingService';
export type { PatientMatchCriteria, PatientMatchResult } from './services/PatientMatchingService';
export { InsuranceValidationService } from './services/InsuranceValidationService';
export type { InsuranceValidationResult } from './services/InsuranceValidationService';
export { PatientDomainEventHandler } from './events/PatientDomainEventHandler';
export type { PatientDomainEventHandlerConfig } from './events/PatientDomainEventHandler';
//# sourceMappingURL=index.d.ts.map