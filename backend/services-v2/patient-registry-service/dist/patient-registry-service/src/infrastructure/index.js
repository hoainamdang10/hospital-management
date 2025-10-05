"use strict";
/**
 * Infrastructure Layer Exports
 * Patient Registry Service V2
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientMapper = exports.SupabasePatientRepository = void 0;
// Repositories
var SupabasePatientRepository_1 = require("./repositories/SupabasePatientRepository");
Object.defineProperty(exports, "SupabasePatientRepository", { enumerable: true, get: function () { return SupabasePatientRepository_1.SupabasePatientRepository; } });
// Mappers
var PatientMapper_1 = require("./mappers/PatientMapper");
Object.defineProperty(exports, "PatientMapper", { enumerable: true, get: function () { return PatientMapper_1.PatientMapper; } });
// Services (moved to application layer)
// Note: PatientMatchingService and InsuranceValidationService are now in application/services
// Import from application layer instead:
// import { PatientMatchingService } from '../application/services/PatientMatchingService';
// import { InsuranceValidationService } from '../application/services/InsuranceValidationService';
// Event Handlers
// TODO: Re-enable when event infrastructure is ready
// export { PatientDomainEventHandler } from './events/PatientDomainEventHandler';
// export type { PatientDomainEventHandlerConfig } from './events/PatientDomainEventHandler';
//# sourceMappingURL=index.js.map