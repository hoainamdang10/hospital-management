/**
 * Dependency Injection Setup - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Patient Registry Service DI Container Configuration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Dependency Injection
 */
import { DIContainer } from "../../../../shared/infrastructure/di/container";
export declare const ServiceTokens: {
    readonly SUPABASE_CLIENT: "SupabaseClient";
    readonly LOGGER: "Logger";
    readonly AUDIT_SERVICE: "AuditService";
    readonly EVENT_BUS: "EventBus";
    readonly PATIENT_REPOSITORY: "PatientRepository";
    readonly REGISTER_PATIENT_USE_CASE: "RegisterPatientUseCase";
    readonly GET_PATIENT_PROFILE_USE_CASE: "GetPatientProfileUseCase";
    readonly UPDATE_PATIENT_INFO_USE_CASE: "UpdatePatientInfoUseCase";
    readonly PATIENT_COMMAND_HANDLERS: "PatientCommandHandlers";
    readonly PATIENT_QUERY_HANDLERS: "PatientQueryHandlers";
    readonly PATIENT_DOMAIN_EVENT_HANDLER: "PatientDomainEventHandler";
};
export declare function setupDependencies(container: DIContainer): void;
//# sourceMappingURL=setup.d.ts.map