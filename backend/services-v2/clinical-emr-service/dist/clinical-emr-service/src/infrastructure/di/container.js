"use strict";
/**
 * Dependency Injection Container - Clinical EMR Service
 * Complete container setup with all dependencies
 *
 * @author Hospital Management Team
 * @version 2.1.0
 * @compliance Clean Architecture, DI Pattern, IoC
 * @updated 2025-11-02 - Registered all 40+ use cases and controllers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIContainer = exports.container = void 0;
exports.initializeContainer = initializeContainer;
exports.checkContainerHealth = checkContainerHealth;
exports.cleanupContainer = cleanupContainer;
exports.resolve = resolve;
const inversify_1 = require("inversify");
const types_1 = require("./types");
// =====================================================
// APPLICATION - USE CASES (Medical Records)
// =====================================================
const CreateMedicalRecordUseCase_1 = require("../../application/use-cases/CreateMedicalRecordUseCase");
const GetMedicalRecordUseCase_1 = require("../../application/use-cases/GetMedicalRecordUseCase");
const GetPatientMedicalRecordsUseCase_1 = require("../../application/use-cases/GetPatientMedicalRecordsUseCase");
const GetDoctorMedicalRecordsUseCase_1 = require("../../application/use-cases/GetDoctorMedicalRecordsUseCase");
const UpdateMedicalRecordUseCase_1 = require("../../application/use-cases/UpdateMedicalRecordUseCase");
const DeleteMedicalRecordUseCase_1 = require("../../application/use-cases/DeleteMedicalRecordUseCase");
const ArchiveMedicalRecordUseCase_1 = require("../../application/use-cases/ArchiveMedicalRecordUseCase");
const RestoreMedicalRecordUseCase_1 = require("../../application/use-cases/RestoreMedicalRecordUseCase");
const SearchMedicalRecordsUseCase_1 = require("../../application/use-cases/SearchMedicalRecordsUseCase");
const GetMedicalRecordStatisticsUseCase_1 = require("../../application/use-cases/GetMedicalRecordStatisticsUseCase");
// Diagnoses & Medications
const AddDiagnosisUseCase_1 = require("../../application/use-cases/AddDiagnosisUseCase");
const RemoveDiagnosisUseCase_1 = require("../../application/use-cases/RemoveDiagnosisUseCase");
const AddMedicationUseCase_1 = require("../../application/use-cases/AddMedicationUseCase");
const RemoveMedicationUseCase_1 = require("../../application/use-cases/RemoveMedicationUseCase");
const UpdateVitalSignsUseCase_1 = require("../../application/use-cases/UpdateVitalSignsUseCase");
// Access Control & Audit
const GrantAccessUseCase_1 = require("../../application/use-cases/GrantAccessUseCase");
const RevokeAccessUseCase_1 = require("../../application/use-cases/RevokeAccessUseCase");
const AuditAccessHistoryUseCase_1 = require("../../application/use-cases/AuditAccessHistoryUseCase");
// FHIR Compliance
const ExportToFHIRUseCase_1 = require("../../application/use-cases/ExportToFHIRUseCase");
const ValidateFHIRComplianceUseCase_1 = require("../../application/use-cases/ValidateFHIRComplianceUseCase");
// Reports
const GenerateMedicalReportUseCase_1 = require("../../application/use-cases/GenerateMedicalReportUseCase");
// =====================================================
// APPLICATION - USE CASES (Clinical Notes)
// =====================================================
const CreateClinicalNoteUseCase_1 = require("../../application/use-cases/CreateClinicalNoteUseCase");
const GetClinicalNoteUseCase_1 = require("../../application/use-cases/GetClinicalNoteUseCase");
const ListClinicalNotesUseCase_1 = require("../../application/use-cases/ListClinicalNotesUseCase");
const UpdateClinicalNoteUseCase_1 = require("../../application/use-cases/UpdateClinicalNoteUseCase");
const CosignClinicalNoteUseCase_1 = require("../../application/use-cases/CosignClinicalNoteUseCase");
// =====================================================
// APPLICATION - USE CASES (Diagnostic Reports)
// =====================================================
const CreateDiagnosticReportUseCase_1 = require("../../application/use-cases/CreateDiagnosticReportUseCase");
const GetDiagnosticReportUseCase_1 = require("../../application/use-cases/GetDiagnosticReportUseCase");
const ListDiagnosticReportsUseCase_1 = require("../../application/use-cases/ListDiagnosticReportsUseCase");
const UpdateDiagnosticReportUseCase_1 = require("../../application/use-cases/UpdateDiagnosticReportUseCase");
const FinalizeDiagnosticReportUseCase_1 = require("../../application/use-cases/FinalizeDiagnosticReportUseCase");
// =====================================================
// APPLICATION - USE CASES (Prescriptions)
// =====================================================
const CreatePrescriptionUseCase_1 = require("../../application/use-cases/CreatePrescriptionUseCase");
const GetPrescriptionUseCase_1 = require("../../application/use-cases/GetPrescriptionUseCase");
const ListPrescriptionsUseCase_1 = require("../../application/use-cases/ListPrescriptionsUseCase");
const DispensePrescriptionUseCase_1 = require("../../application/use-cases/DispensePrescriptionUseCase");
// =====================================================
// APPLICATION - USE CASES (Treatment Plans)
// =====================================================
const CreateTreatmentPlanUseCase_1 = require("../../application/use-cases/CreateTreatmentPlanUseCase");
const GetTreatmentPlanUseCase_1 = require("../../application/use-cases/GetTreatmentPlanUseCase");
const ListTreatmentPlansUseCase_1 = require("../../application/use-cases/ListTreatmentPlansUseCase");
const UpdateTreatmentPlanUseCase_1 = require("../../application/use-cases/UpdateTreatmentPlanUseCase");
const CompleteTreatmentPlanUseCase_1 = require("../../application/use-cases/CompleteTreatmentPlanUseCase");
// =====================================================
// APPLICATION - USE CASES (Lab Results)
// =====================================================
const CreateLabResultUseCase_1 = require("../../application/use-cases/CreateLabResultUseCase");
const GetLabResultUseCase_1 = require("../../application/use-cases/GetLabResultUseCase");
const UpdateLabResultUseCase_1 = require("../../application/use-cases/UpdateLabResultUseCase");
const GetPatientLabResultsUseCase_1 = require("../../application/use-cases/GetPatientLabResultsUseCase");
// =====================================================
// APPLICATION - USE CASES (Medical Imaging)
// =====================================================
const CreateMedicalImagingUseCase_1 = require("../../application/use-cases/CreateMedicalImagingUseCase");
const GetMedicalImagingUseCase_1 = require("../../application/use-cases/GetMedicalImagingUseCase");
const UpdateMedicalImagingUseCase_1 = require("../../application/use-cases/UpdateMedicalImagingUseCase");
const GetPatientMedicalImagingUseCase_1 = require("../../application/use-cases/GetPatientMedicalImagingUseCase");
// =====================================================
// INFRASTRUCTURE - REPOSITORIES
// =====================================================
const SupabaseMedicalRecordRepository_1 = require("../repositories/SupabaseMedicalRecordRepository");
const SupabaseClinicalNoteRepository_1 = require("../repositories/SupabaseClinicalNoteRepository");
const SupabaseDiagnosticReportRepository_1 = require("../repositories/SupabaseDiagnosticReportRepository");
const SupabasePrescriptionRepository_1 = require("../repositories/SupabasePrescriptionRepository");
const SupabaseTreatmentPlanRepository_1 = require("../repositories/SupabaseTreatmentPlanRepository");
const SupabaseLabResultRepository_1 = require("../repositories/SupabaseLabResultRepository");
const SupabaseMedicalImagingRepository_1 = require("../repositories/SupabaseMedicalImagingRepository");
// =====================================================
// INFRASTRUCTURE - SERVICES
// =====================================================
const SupabaseTokenVerifier_1 = require("../services/SupabaseTokenVerifier");
const SupabaseAuditLogService_1 = require("../audit/SupabaseAuditLogService");
const InMemoryDomainEventPublisher_1 = require("@shared/infrastructure/events/InMemoryDomainEventPublisher");
const ClinicalEMREventHandler_1 = require("../events/ClinicalEMREventHandler");
const MedicalRecordDomainEventHandler_1 = require("../events/MedicalRecordDomainEventHandler");
const console_logger_1 = require("@shared/infrastructure/logging/console-logger");
// =====================================================
// PRESENTATION - CONTROLLERS
// =====================================================
const MedicalRecordController_1 = require("../../presentation/controllers/MedicalRecordController");
const ClinicalNoteController_1 = require("../../presentation/controllers/ClinicalNoteController");
const DiagnosticReportController_1 = require("../../presentation/controllers/DiagnosticReportController");
const PrescriptionController_1 = require("../../presentation/controllers/PrescriptionController");
const TreatmentPlanController_1 = require("../../presentation/controllers/TreatmentPlanController");
const LabResultController_1 = require("../../presentation/controllers/LabResultController");
const MedicalImagingController_1 = require("../../presentation/controllers/MedicalImagingController");
// =====================================================
// PRESENTATION - MIDDLEWARE
// =====================================================
const AuthenticationMiddleware_1 = require("../../presentation/middleware/AuthenticationMiddleware");
// =====================================================
// CONFIGURATION
// =====================================================
const clinical_emr_config_1 = require("../config/clinical-emr-config");
// Global container instance
exports.container = new inversify_1.Container({ defaultScope: "Singleton" });
exports.DIContainer = exports.container;
/**
 * Initialize and configure the DI container
 */
async function initializeContainer() {
    const errors = [];
    try {
        console.log("📦 Initializing DI Container...");
        // =====================================================
        // CONFIGURATION
        // =====================================================
        console.log("  - Binding Configuration...");
        exports.container
            .bind(types_1.TYPES.Config)
            .to(clinical_emr_config_1.ClinicalEMRConfig)
            .inSingletonScope();
        // =====================================================
        // INFRASTRUCTURE - LOGGING
        // =====================================================
        console.log("  - Binding Logger...");
        exports.container.bind(types_1.TYPES.Logger).to(console_logger_1.ConsoleLogger).inSingletonScope();
        // =====================================================
        // INFRASTRUCTURE - DATABASE CLIENT
        // =====================================================
        console.log("  - Binding Supabase Client...");
        exports.container
            .bind(types_1.TYPES.SupabaseClient)
            .toDynamicValue((context) => {
            const config = context.container.get(types_1.TYPES.Config);
            const { createClient } = require("@supabase/supabase-js");
            return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
                db: {
                    schema: "clinical_schema",
                },
            });
        })
            .inSingletonScope();
        // =====================================================
        // INFRASTRUCTURE - EVENTS
        // =====================================================
        console.log("  - Binding Event Publisher...");
        exports.container
            .bind(types_1.TYPES.DomainEventPublisher)
            .to(InMemoryDomainEventPublisher_1.InMemoryDomainEventPublisher)
            .inSingletonScope();
        console.log("  - Binding Event Handlers...");
        exports.container
            .bind(types_1.TYPES.ClinicalEMREventHandler)
            .to(ClinicalEMREventHandler_1.ClinicalEMREventHandler)
            .inSingletonScope();
        exports.container
            .bind(types_1.TYPES.MedicalRecordDomainEventHandler)
            .to(MedicalRecordDomainEventHandler_1.MedicalRecordDomainEventHandler)
            .inSingletonScope();
        // =====================================================
        // INFRASTRUCTURE - REPOSITORIES
        // =====================================================
        console.log("  - Binding Repositories...");
        exports.container
            .bind(types_1.TYPES.MedicalRecordRepository)
            .to(SupabaseMedicalRecordRepository_1.SupabaseMedicalRecordRepository)
            .inSingletonScope();
        exports.container
            .bind(types_1.TYPES.ClinicalNoteRepository)
            .to(SupabaseClinicalNoteRepository_1.SupabaseClinicalNoteRepository)
            .inSingletonScope();
        exports.container
            .bind(types_1.TYPES.DiagnosticReportRepository)
            .to(SupabaseDiagnosticReportRepository_1.SupabaseDiagnosticReportRepository)
            .inSingletonScope();
        exports.container
            .bind(types_1.TYPES.PrescriptionRepository)
            .to(SupabasePrescriptionRepository_1.SupabasePrescriptionRepository)
            .inSingletonScope();
        exports.container
            .bind(types_1.TYPES.TreatmentPlanRepository)
            .to(SupabaseTreatmentPlanRepository_1.SupabaseTreatmentPlanRepository)
            .inSingletonScope();
        exports.container
            .bind(types_1.TYPES.LabResultRepository)
            .to(SupabaseLabResultRepository_1.SupabaseLabResultRepository)
            .inSingletonScope();
        exports.container
            .bind(types_1.TYPES.MedicalImagingRepository)
            .to(SupabaseMedicalImagingRepository_1.SupabaseMedicalImagingRepository)
            .inSingletonScope();
        // =====================================================
        // INFRASTRUCTURE - SERVICES
        // =====================================================
        console.log("  - Binding Services...");
        exports.container
            .bind(types_1.TYPES.TokenVerifier)
            .to(SupabaseTokenVerifier_1.SupabaseTokenVerifier)
            .inSingletonScope();
        exports.container
            .bind(types_1.TYPES.AuditLogService)
            .to(SupabaseAuditLogService_1.SupabaseAuditLogService)
            .inSingletonScope();
        // =====================================================
        // APPLICATION - USE CASES (Medical Records)
        // =====================================================
        console.log("  - Binding Medical Record Use Cases...");
        exports.container
            .bind(types_1.TYPES.CreateMedicalRecordUseCase)
            .to(CreateMedicalRecordUseCase_1.CreateMedicalRecordUseCase);
        exports.container.bind(types_1.TYPES.GetMedicalRecordUseCase).to(GetMedicalRecordUseCase_1.GetMedicalRecordUseCase);
        exports.container
            .bind(types_1.TYPES.GetPatientMedicalRecordsUseCase)
            .to(GetPatientMedicalRecordsUseCase_1.GetPatientMedicalRecordsUseCase);
        exports.container
            .bind(types_1.TYPES.GetDoctorMedicalRecordsUseCase)
            .to(GetDoctorMedicalRecordsUseCase_1.GetDoctorMedicalRecordsUseCase);
        exports.container
            .bind(types_1.TYPES.UpdateMedicalRecordUseCase)
            .to(UpdateMedicalRecordUseCase_1.UpdateMedicalRecordUseCase);
        exports.container
            .bind(types_1.TYPES.DeleteMedicalRecordUseCase)
            .to(DeleteMedicalRecordUseCase_1.DeleteMedicalRecordUseCase);
        exports.container
            .bind(types_1.TYPES.ArchiveMedicalRecordUseCase)
            .to(ArchiveMedicalRecordUseCase_1.ArchiveMedicalRecordUseCase);
        exports.container
            .bind(types_1.TYPES.RestoreMedicalRecordUseCase)
            .to(RestoreMedicalRecordUseCase_1.RestoreMedicalRecordUseCase);
        exports.container
            .bind(types_1.TYPES.SearchMedicalRecordsUseCase)
            .to(SearchMedicalRecordsUseCase_1.SearchMedicalRecordsUseCase);
        exports.container
            .bind(types_1.TYPES.GetMedicalRecordStatisticsUseCase)
            .to(GetMedicalRecordStatisticsUseCase_1.GetMedicalRecordStatisticsUseCase);
        console.log("  - Binding Diagnosis/Medication Use Cases...");
        exports.container.bind(types_1.TYPES.AddDiagnosisUseCase).to(AddDiagnosisUseCase_1.AddDiagnosisUseCase);
        exports.container.bind(types_1.TYPES.RemoveDiagnosisUseCase).to(RemoveDiagnosisUseCase_1.RemoveDiagnosisUseCase);
        exports.container.bind(types_1.TYPES.AddMedicationUseCase).to(AddMedicationUseCase_1.AddMedicationUseCase);
        exports.container.bind(types_1.TYPES.RemoveMedicationUseCase).to(RemoveMedicationUseCase_1.RemoveMedicationUseCase);
        exports.container.bind(types_1.TYPES.UpdateVitalSignsUseCase).to(UpdateVitalSignsUseCase_1.UpdateVitalSignsUseCase);
        console.log("  - Binding Access Control Use Cases...");
        exports.container.bind(types_1.TYPES.GrantAccessUseCase).to(GrantAccessUseCase_1.GrantAccessUseCase);
        exports.container.bind(types_1.TYPES.RevokeAccessUseCase).to(RevokeAccessUseCase_1.RevokeAccessUseCase);
        exports.container
            .bind(types_1.TYPES.AuditAccessHistoryUseCase)
            .to(AuditAccessHistoryUseCase_1.AuditAccessHistoryUseCase);
        console.log("  - Binding FHIR Use Cases...");
        exports.container.bind(types_1.TYPES.ExportToFHIRUseCase).to(ExportToFHIRUseCase_1.ExportToFHIRUseCase);
        exports.container
            .bind(types_1.TYPES.ValidateFHIRComplianceUseCase)
            .to(ValidateFHIRComplianceUseCase_1.ValidateFHIRComplianceUseCase);
        console.log("  - Binding Report Use Cases...");
        exports.container
            .bind(types_1.TYPES.GenerateMedicalReportUseCase)
            .to(GenerateMedicalReportUseCase_1.GenerateMedicalReportUseCase);
        // =====================================================
        // APPLICATION - USE CASES (Clinical Notes)
        // =====================================================
        console.log("  - Binding Clinical Note Use Cases...");
        exports.container
            .bind(types_1.TYPES.CreateClinicalNoteUseCase)
            .to(CreateClinicalNoteUseCase_1.CreateClinicalNoteUseCase);
        exports.container.bind(types_1.TYPES.GetClinicalNoteUseCase).to(GetClinicalNoteUseCase_1.GetClinicalNoteUseCase);
        exports.container.bind(types_1.TYPES.ListClinicalNotesUseCase).to(ListClinicalNotesUseCase_1.ListClinicalNotesUseCase);
        exports.container
            .bind(types_1.TYPES.UpdateClinicalNoteUseCase)
            .to(UpdateClinicalNoteUseCase_1.UpdateClinicalNoteUseCase);
        exports.container
            .bind(types_1.TYPES.CosignClinicalNoteUseCase)
            .to(CosignClinicalNoteUseCase_1.CosignClinicalNoteUseCase);
        // =====================================================
        // APPLICATION - USE CASES (Diagnostic Reports)
        // =====================================================
        console.log("  - Binding Diagnostic Report Use Cases...");
        exports.container
            .bind(types_1.TYPES.CreateDiagnosticReportUseCase)
            .to(CreateDiagnosticReportUseCase_1.CreateDiagnosticReportUseCase);
        exports.container
            .bind(types_1.TYPES.GetDiagnosticReportUseCase)
            .to(GetDiagnosticReportUseCase_1.GetDiagnosticReportUseCase);
        exports.container
            .bind(types_1.TYPES.ListDiagnosticReportsUseCase)
            .to(ListDiagnosticReportsUseCase_1.ListDiagnosticReportsUseCase);
        exports.container
            .bind(types_1.TYPES.UpdateDiagnosticReportUseCase)
            .to(UpdateDiagnosticReportUseCase_1.UpdateDiagnosticReportUseCase);
        exports.container
            .bind(types_1.TYPES.FinalizeDiagnosticReportUseCase)
            .to(FinalizeDiagnosticReportUseCase_1.FinalizeDiagnosticReportUseCase);
        // =====================================================
        // APPLICATION - USE CASES (Prescriptions)
        // =====================================================
        console.log("  - Binding Prescription Use Cases...");
        exports.container
            .bind(types_1.TYPES.CreatePrescriptionUseCase)
            .to(CreatePrescriptionUseCase_1.CreatePrescriptionUseCase);
        exports.container.bind(types_1.TYPES.GetPrescriptionUseCase).to(GetPrescriptionUseCase_1.GetPrescriptionUseCase);
        exports.container.bind(types_1.TYPES.ListPrescriptionsUseCase).to(ListPrescriptionsUseCase_1.ListPrescriptionsUseCase);
        exports.container
            .bind(types_1.TYPES.DispensePrescriptionUseCase)
            .to(DispensePrescriptionUseCase_1.DispensePrescriptionUseCase);
        // =====================================================
        // APPLICATION - USE CASES (Treatment Plans)
        // =====================================================
        console.log("  - Binding Treatment Plan Use Cases...");
        exports.container
            .bind(types_1.TYPES.CreateTreatmentPlanUseCase)
            .to(CreateTreatmentPlanUseCase_1.CreateTreatmentPlanUseCase);
        exports.container.bind(types_1.TYPES.GetTreatmentPlanUseCase).to(GetTreatmentPlanUseCase_1.GetTreatmentPlanUseCase);
        exports.container
            .bind(types_1.TYPES.ListTreatmentPlansUseCase)
            .to(ListTreatmentPlansUseCase_1.ListTreatmentPlansUseCase);
        exports.container
            .bind(types_1.TYPES.UpdateTreatmentPlanUseCase)
            .to(UpdateTreatmentPlanUseCase_1.UpdateTreatmentPlanUseCase);
        exports.container
            .bind(types_1.TYPES.CompleteTreatmentPlanUseCase)
            .to(CompleteTreatmentPlanUseCase_1.CompleteTreatmentPlanUseCase);
        // =====================================================
        // APPLICATION - USE CASES (Lab Results)
        // =====================================================
        console.log("  - Binding Lab Result Use Cases...");
        exports.container
            .bind(types_1.TYPES.CreateLabResultUseCase)
            .to(CreateLabResultUseCase_1.CreateLabResultUseCase);
        exports.container
            .bind(types_1.TYPES.GetLabResultUseCase)
            .to(GetLabResultUseCase_1.GetLabResultUseCase);
        exports.container
            .bind(types_1.TYPES.UpdateLabResultUseCase)
            .to(UpdateLabResultUseCase_1.UpdateLabResultUseCase);
        exports.container
            .bind(types_1.TYPES.GetPatientLabResultsUseCase)
            .to(GetPatientLabResultsUseCase_1.GetPatientLabResultsUseCase);
        // =====================================================
        // APPLICATION - USE CASES (Medical Imaging)
        // =====================================================
        console.log("  - Binding Medical Imaging Use Cases...");
        exports.container
            .bind(types_1.TYPES.CreateMedicalImagingUseCase)
            .to(CreateMedicalImagingUseCase_1.CreateMedicalImagingUseCase);
        exports.container
            .bind(types_1.TYPES.GetMedicalImagingUseCase)
            .to(GetMedicalImagingUseCase_1.GetMedicalImagingUseCase);
        exports.container
            .bind(types_1.TYPES.UpdateMedicalImagingUseCase)
            .to(UpdateMedicalImagingUseCase_1.UpdateMedicalImagingUseCase);
        exports.container
            .bind(types_1.TYPES.GetPatientMedicalImagingUseCase)
            .to(GetPatientMedicalImagingUseCase_1.GetPatientMedicalImagingUseCase);
        // =====================================================
        // PRESENTATION - CONTROLLERS
        // =====================================================
        console.log("  - Binding Controllers...");
        exports.container
            .bind(types_1.TYPES.MedicalRecordController)
            .to(MedicalRecordController_1.MedicalRecordController)
            .inSingletonScope();
        exports.container
            .bind(types_1.TYPES.ClinicalNoteController)
            .to(ClinicalNoteController_1.ClinicalNoteController)
            .inSingletonScope();
        exports.container
            .bind(types_1.TYPES.DiagnosticReportController)
            .to(DiagnosticReportController_1.DiagnosticReportController)
            .inSingletonScope();
        exports.container
            .bind(types_1.TYPES.PrescriptionController)
            .to(PrescriptionController_1.PrescriptionController)
            .inSingletonScope();
        exports.container
            .bind(types_1.TYPES.TreatmentPlanController)
            .to(TreatmentPlanController_1.TreatmentPlanController)
            .inSingletonScope();
        exports.container
            .bind(types_1.TYPES.LabResultController)
            .to(LabResultController_1.LabResultController)
            .inSingletonScope();
        exports.container
            .bind(types_1.TYPES.MedicalImagingController)
            .to(MedicalImagingController_1.MedicalImagingController)
            .inSingletonScope();
        // =====================================================
        // PRESENTATION - MIDDLEWARE
        // =====================================================
        console.log("  - Binding Middleware...");
        exports.container
            .bind(types_1.TYPES.AuthenticationMiddleware)
            .to(AuthenticationMiddleware_1.AuthenticationMiddleware)
            .inSingletonScope();
        console.log("✅ DI Container initialized successfully");
        console.log(`   - Registered ${exports.container.getBindings().length} bindings`);
        return { success: true, errors: [] };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        errors.push(errorMessage);
        console.error("❌ DI Container initialization failed:", errorMessage);
        return { success: false, errors };
    }
}
/**
 * Check container health
 */
async function checkContainerHealth() {
    const errors = [];
    try {
        // Check critical dependencies
        const config = exports.container.get(types_1.TYPES.Config);
        const logger = exports.container.get(types_1.TYPES.Logger);
        const supabase = exports.container.get(types_1.TYPES.SupabaseClient);
        if (!config)
            errors.push("Config not available");
        if (!logger)
            errors.push("Logger not available");
        if (!supabase)
            errors.push("Supabase client not available");
        return { healthy: errors.length === 0, errors };
    }
    catch (error) {
        errors.push(error instanceof Error ? error.message : "Unknown error");
        return { healthy: false, errors };
    }
}
/**
 * Cleanup container resources
 */
async function cleanupContainer() {
    try {
        console.log("🧹 Cleaning up DI container...");
        // Unbind all
        exports.container.unbindAll();
        console.log("✅ DI container cleaned up");
    }
    catch (error) {
        console.error("❌ Error cleaning up container:", error);
    }
}
/**
 * Get a service from the container (helper)
 */
function resolve(serviceIdentifier) {
    return exports.container.get(serviceIdentifier);
}
//# sourceMappingURL=container.js.map