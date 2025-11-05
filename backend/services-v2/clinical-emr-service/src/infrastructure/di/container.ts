/**
 * Dependency Injection Container - Clinical EMR Service
 * Complete container setup with all dependencies
 *
 * @author Hospital Management Team
 * @version 2.1.0
 * @compliance Clean Architecture, DI Pattern, IoC
 * @updated 2025-11-02 - Registered all 40+ use cases and controllers
 */

import { Container } from "inversify";
import { SupabaseClient } from "@supabase/supabase-js";
import { TYPES } from "./types";

// =====================================================
// DOMAIN
// =====================================================
import { IMedicalRecordRepository } from "../../domain/repositories/IMedicalRecordRepository";
import { IClinicalNoteRepository } from "../../domain/repositories/IClinicalNoteRepository";
import { IDiagnosticReportRepository } from "../../domain/repositories/IDiagnosticReportRepository";
import { IPrescriptionRepository } from "../../domain/repositories/IPrescriptionRepository";
import { ITreatmentPlanRepository } from "../../domain/repositories/ITreatmentPlanRepository";
import { ILabResultRepository } from "../../domain/repositories/ILabResultRepository";
import { IMedicalImagingRepository } from "../../domain/repositories/IMedicalImagingRepository";

// =====================================================
// APPLICATION - USE CASES (Medical Records)
// =====================================================
import { CreateMedicalRecordUseCase } from "../../application/use-cases/CreateMedicalRecordUseCase";
import { GetMedicalRecordUseCase } from "../../application/use-cases/GetMedicalRecordUseCase";
import { GetPatientMedicalRecordsUseCase } from "../../application/use-cases/GetPatientMedicalRecordsUseCase";
import { GetDoctorMedicalRecordsUseCase } from "../../application/use-cases/GetDoctorMedicalRecordsUseCase";
import { UpdateMedicalRecordUseCase } from "../../application/use-cases/UpdateMedicalRecordUseCase";
import { DeleteMedicalRecordUseCase } from "../../application/use-cases/DeleteMedicalRecordUseCase";
import { ArchiveMedicalRecordUseCase } from "../../application/use-cases/ArchiveMedicalRecordUseCase";
import { RestoreMedicalRecordUseCase } from "../../application/use-cases/RestoreMedicalRecordUseCase";
import { SearchMedicalRecordsUseCase } from "../../application/use-cases/SearchMedicalRecordsUseCase";
import { GetMedicalRecordStatisticsUseCase } from "../../application/use-cases/GetMedicalRecordStatisticsUseCase";

// Diagnoses & Medications
import { AddDiagnosisUseCase } from "../../application/use-cases/AddDiagnosisUseCase";
import { RemoveDiagnosisUseCase } from "../../application/use-cases/RemoveDiagnosisUseCase";
import { AddMedicationUseCase } from "../../application/use-cases/AddMedicationUseCase";
import { RemoveMedicationUseCase } from "../../application/use-cases/RemoveMedicationUseCase";
import { UpdateVitalSignsUseCase } from "../../application/use-cases/UpdateVitalSignsUseCase";

// Access Control & Audit
import { GrantAccessUseCase } from "../../application/use-cases/GrantAccessUseCase";
import { RevokeAccessUseCase } from "../../application/use-cases/RevokeAccessUseCase";
import { AuditAccessHistoryUseCase } from "../../application/use-cases/AuditAccessHistoryUseCase";

// FHIR Compliance
import { ExportToFHIRUseCase } from "../../application/use-cases/ExportToFHIRUseCase";
import { ValidateFHIRComplianceUseCase } from "../../application/use-cases/ValidateFHIRComplianceUseCase";

// Reports
import { GenerateMedicalReportUseCase } from "../../application/use-cases/GenerateMedicalReportUseCase";

// =====================================================
// APPLICATION - USE CASES (Clinical Notes)
// =====================================================
import { CreateClinicalNoteUseCase } from "../../application/use-cases/CreateClinicalNoteUseCase";
import { GetClinicalNoteUseCase } from "../../application/use-cases/GetClinicalNoteUseCase";
import { ListClinicalNotesUseCase } from "../../application/use-cases/ListClinicalNotesUseCase";
import { UpdateClinicalNoteUseCase } from "../../application/use-cases/UpdateClinicalNoteUseCase";
import { CosignClinicalNoteUseCase } from "../../application/use-cases/CosignClinicalNoteUseCase";

// =====================================================
// APPLICATION - USE CASES (Diagnostic Reports)
// =====================================================
import { CreateDiagnosticReportUseCase } from "../../application/use-cases/CreateDiagnosticReportUseCase";
import { GetDiagnosticReportUseCase } from "../../application/use-cases/GetDiagnosticReportUseCase";
import { ListDiagnosticReportsUseCase } from "../../application/use-cases/ListDiagnosticReportsUseCase";
import { UpdateDiagnosticReportUseCase } from "../../application/use-cases/UpdateDiagnosticReportUseCase";
import { FinalizeDiagnosticReportUseCase } from "../../application/use-cases/FinalizeDiagnosticReportUseCase";

// =====================================================
// APPLICATION - USE CASES (Prescriptions)
// =====================================================
import { CreatePrescriptionUseCase } from "../../application/use-cases/CreatePrescriptionUseCase";
import { GetPrescriptionUseCase } from "../../application/use-cases/GetPrescriptionUseCase";
import { ListPrescriptionsUseCase } from "../../application/use-cases/ListPrescriptionsUseCase";
import { DispensePrescriptionUseCase } from "../../application/use-cases/DispensePrescriptionUseCase";

// =====================================================
// APPLICATION - USE CASES (Treatment Plans)
// =====================================================
import { CreateTreatmentPlanUseCase } from "../../application/use-cases/CreateTreatmentPlanUseCase";
import { GetTreatmentPlanUseCase } from "../../application/use-cases/GetTreatmentPlanUseCase";
import { ListTreatmentPlansUseCase } from "../../application/use-cases/ListTreatmentPlansUseCase";
import { UpdateTreatmentPlanUseCase } from "../../application/use-cases/UpdateTreatmentPlanUseCase";
import { CompleteTreatmentPlanUseCase } from "../../application/use-cases/CompleteTreatmentPlanUseCase";

// =====================================================
// APPLICATION - USE CASES (Lab Results)
// =====================================================
import { CreateLabResultUseCase } from "../../application/use-cases/CreateLabResultUseCase";
import { GetLabResultUseCase } from "../../application/use-cases/GetLabResultUseCase";
import { UpdateLabResultUseCase } from "../../application/use-cases/UpdateLabResultUseCase";
import { GetPatientLabResultsUseCase } from "../../application/use-cases/GetPatientLabResultsUseCase";

// =====================================================
// APPLICATION - USE CASES (Medical Imaging)
// =====================================================
import { CreateMedicalImagingUseCase } from "../../application/use-cases/CreateMedicalImagingUseCase";
import { GetMedicalImagingUseCase } from "../../application/use-cases/GetMedicalImagingUseCase";
import { UpdateMedicalImagingUseCase } from "../../application/use-cases/UpdateMedicalImagingUseCase";
import { GetPatientMedicalImagingUseCase } from "../../application/use-cases/GetPatientMedicalImagingUseCase";

// =====================================================
// INFRASTRUCTURE - REPOSITORIES
// =====================================================
import { SupabaseMedicalRecordRepository } from "../repositories/SupabaseMedicalRecordRepository";
import { SupabaseClinicalNoteRepository } from "../repositories/SupabaseClinicalNoteRepository";
import { SupabaseDiagnosticReportRepository } from "../repositories/SupabaseDiagnosticReportRepository";
import { SupabasePrescriptionRepository } from "../repositories/SupabasePrescriptionRepository";
import { SupabaseTreatmentPlanRepository } from "../repositories/SupabaseTreatmentPlanRepository";
import { SupabaseLabResultRepository } from "../repositories/SupabaseLabResultRepository";
import { SupabaseMedicalImagingRepository } from "../repositories/SupabaseMedicalImagingRepository";

// =====================================================
// INFRASTRUCTURE - SERVICES
// =====================================================
import { SupabaseTokenVerifier } from "../services/SupabaseTokenVerifier";
import { SupabaseAuditLogService } from "../audit/SupabaseAuditLogService";
import { ITokenVerifier } from "../../application/services/ITokenVerifier";
import { IAuditLogService } from "../../application/services/IAuditLogService";

// =====================================================
// INFRASTRUCTURE - EVENTS
// =====================================================
import { IDomainEventPublisher } from "@shared/domain/events/IDomainEventPublisher";
import { InMemoryDomainEventPublisher } from "@shared/infrastructure/events/InMemoryDomainEventPublisher";
import { ClinicalEMREventHandler } from "../events/ClinicalEMREventHandler";
import { MedicalRecordDomainEventHandler } from "../events/MedicalRecordDomainEventHandler";

// =====================================================
// INFRASTRUCTURE - LOGGING
// =====================================================
import { ILogger } from "@shared/infrastructure/logging/logger.interface";
import { ConsoleLogger } from "@shared/infrastructure/logging/console-logger";

// =====================================================
// PRESENTATION - CONTROLLERS
// =====================================================
import { MedicalRecordController } from "../../presentation/controllers/MedicalRecordController";
import { ClinicalNoteController } from "../../presentation/controllers/ClinicalNoteController";
import { DiagnosticReportController } from "../../presentation/controllers/DiagnosticReportController";
import { PrescriptionController } from "../../presentation/controllers/PrescriptionController";
import { TreatmentPlanController } from "../../presentation/controllers/TreatmentPlanController";
import { LabResultController } from "../../presentation/controllers/LabResultController";
import { MedicalImagingController } from "../../presentation/controllers/MedicalImagingController";

// =====================================================
// PRESENTATION - MIDDLEWARE
// =====================================================
import { AuthenticationMiddleware } from "../../presentation/middleware/AuthenticationMiddleware";

// =====================================================
// CONFIGURATION
// =====================================================
import { ClinicalEMRConfig } from "../config/clinical-emr-config";

// Global container instance
export const container = new Container({ defaultScope: "Singleton" });

/**
 * Initialize and configure the DI container
 */
export async function initializeContainer(): Promise<{
  success: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    console.log("📦 Initializing DI Container...");

    // =====================================================
    // CONFIGURATION
    // =====================================================
    console.log("  - Binding Configuration...");
    container
      .bind<ClinicalEMRConfig>(TYPES.Config)
      .to(ClinicalEMRConfig)
      .inSingletonScope();

    // =====================================================
    // INFRASTRUCTURE - LOGGING
    // =====================================================
    console.log("  - Binding Logger...");
    container.bind<ILogger>(TYPES.Logger).to(ConsoleLogger).inSingletonScope();

    // =====================================================
    // INFRASTRUCTURE - DATABASE CLIENT
    // =====================================================
    console.log("  - Binding Supabase Client...");
    container
      .bind<SupabaseClient>(TYPES.SupabaseClient)
      .toDynamicValue((context) => {
        const config = context.container.get<ClinicalEMRConfig>(TYPES.Config);
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
    container
      .bind<IDomainEventPublisher>(TYPES.DomainEventPublisher)
      .to(InMemoryDomainEventPublisher)
      .inSingletonScope();

    console.log("  - Binding Event Handlers...");
    container
      .bind<ClinicalEMREventHandler>(TYPES.ClinicalEMREventHandler)
      .to(ClinicalEMREventHandler)
      .inSingletonScope();

    container
      .bind<MedicalRecordDomainEventHandler>(
        TYPES.MedicalRecordDomainEventHandler,
      )
      .to(MedicalRecordDomainEventHandler)
      .inSingletonScope();

    // =====================================================
    // INFRASTRUCTURE - REPOSITORIES
    // =====================================================
    console.log("  - Binding Repositories...");
    container
      .bind<IMedicalRecordRepository>(TYPES.MedicalRecordRepository)
      .to(SupabaseMedicalRecordRepository)
      .inSingletonScope();

    container
      .bind<IClinicalNoteRepository>(TYPES.ClinicalNoteRepository)
      .to(SupabaseClinicalNoteRepository)
      .inSingletonScope();

    container
      .bind<IDiagnosticReportRepository>(TYPES.DiagnosticReportRepository)
      .to(SupabaseDiagnosticReportRepository)
      .inSingletonScope();

    container
      .bind<IPrescriptionRepository>(TYPES.PrescriptionRepository)
      .to(SupabasePrescriptionRepository)
      .inSingletonScope();

    container
      .bind<ITreatmentPlanRepository>(TYPES.TreatmentPlanRepository)
      .to(SupabaseTreatmentPlanRepository)
      .inSingletonScope();

    container
      .bind<ILabResultRepository>(TYPES.LabResultRepository)
      .to(SupabaseLabResultRepository)
      .inSingletonScope();

    container
      .bind<IMedicalImagingRepository>(TYPES.MedicalImagingRepository)
      .to(SupabaseMedicalImagingRepository)
      .inSingletonScope();

    // =====================================================
    // INFRASTRUCTURE - SERVICES
    // =====================================================
    console.log("  - Binding Services...");
    container
      .bind<ITokenVerifier>(TYPES.TokenVerifier)
      .to(SupabaseTokenVerifier)
      .inSingletonScope();

    container
      .bind<IAuditLogService>(TYPES.AuditLogService)
      .to(SupabaseAuditLogService)
      .inSingletonScope();

    // =====================================================
    // APPLICATION - USE CASES (Medical Records)
    // =====================================================
    console.log("  - Binding Medical Record Use Cases...");
    container
      .bind(TYPES.CreateMedicalRecordUseCase)
      .to(CreateMedicalRecordUseCase);
    container.bind(TYPES.GetMedicalRecordUseCase).to(GetMedicalRecordUseCase);
    container
      .bind(TYPES.GetPatientMedicalRecordsUseCase)
      .to(GetPatientMedicalRecordsUseCase);
    container
      .bind(TYPES.GetDoctorMedicalRecordsUseCase)
      .to(GetDoctorMedicalRecordsUseCase);
    container
      .bind(TYPES.UpdateMedicalRecordUseCase)
      .to(UpdateMedicalRecordUseCase);
    container
      .bind(TYPES.DeleteMedicalRecordUseCase)
      .to(DeleteMedicalRecordUseCase);
    container
      .bind(TYPES.ArchiveMedicalRecordUseCase)
      .to(ArchiveMedicalRecordUseCase);
    container
      .bind(TYPES.RestoreMedicalRecordUseCase)
      .to(RestoreMedicalRecordUseCase);
    container
      .bind(TYPES.SearchMedicalRecordsUseCase)
      .to(SearchMedicalRecordsUseCase);
    container
      .bind(TYPES.GetMedicalRecordStatisticsUseCase)
      .to(GetMedicalRecordStatisticsUseCase);

    console.log("  - Binding Diagnosis/Medication Use Cases...");
    container.bind(TYPES.AddDiagnosisUseCase).to(AddDiagnosisUseCase);
    container.bind(TYPES.RemoveDiagnosisUseCase).to(RemoveDiagnosisUseCase);
    container.bind(TYPES.AddMedicationUseCase).to(AddMedicationUseCase);
    container.bind(TYPES.RemoveMedicationUseCase).to(RemoveMedicationUseCase);
    container.bind(TYPES.UpdateVitalSignsUseCase).to(UpdateVitalSignsUseCase);

    console.log("  - Binding Access Control Use Cases...");
    container.bind(TYPES.GrantAccessUseCase).to(GrantAccessUseCase);
    container.bind(TYPES.RevokeAccessUseCase).to(RevokeAccessUseCase);
    container
      .bind(TYPES.AuditAccessHistoryUseCase)
      .to(AuditAccessHistoryUseCase);

    console.log("  - Binding FHIR Use Cases...");
    container.bind(TYPES.ExportToFHIRUseCase).to(ExportToFHIRUseCase);
    container
      .bind(TYPES.ValidateFHIRComplianceUseCase)
      .to(ValidateFHIRComplianceUseCase);

    console.log("  - Binding Report Use Cases...");
    container
      .bind(TYPES.GenerateMedicalReportUseCase)
      .to(GenerateMedicalReportUseCase);

    // =====================================================
    // APPLICATION - USE CASES (Clinical Notes)
    // =====================================================
    console.log("  - Binding Clinical Note Use Cases...");
    container
      .bind(TYPES.CreateClinicalNoteUseCase)
      .to(CreateClinicalNoteUseCase);
    container.bind(TYPES.GetClinicalNoteUseCase).to(GetClinicalNoteUseCase);
    container.bind(TYPES.ListClinicalNotesUseCase).to(ListClinicalNotesUseCase);
    container
      .bind(TYPES.UpdateClinicalNoteUseCase)
      .to(UpdateClinicalNoteUseCase);
    container
      .bind(TYPES.CosignClinicalNoteUseCase)
      .to(CosignClinicalNoteUseCase);

    // =====================================================
    // APPLICATION - USE CASES (Diagnostic Reports)
    // =====================================================
    console.log("  - Binding Diagnostic Report Use Cases...");
    container
      .bind(TYPES.CreateDiagnosticReportUseCase)
      .to(CreateDiagnosticReportUseCase);
    container
      .bind(TYPES.GetDiagnosticReportUseCase)
      .to(GetDiagnosticReportUseCase);
    container
      .bind(TYPES.ListDiagnosticReportsUseCase)
      .to(ListDiagnosticReportsUseCase);
    container
      .bind(TYPES.UpdateDiagnosticReportUseCase)
      .to(UpdateDiagnosticReportUseCase);
    container
      .bind(TYPES.FinalizeDiagnosticReportUseCase)
      .to(FinalizeDiagnosticReportUseCase);

    // =====================================================
    // APPLICATION - USE CASES (Prescriptions)
    // =====================================================
    console.log("  - Binding Prescription Use Cases...");
    container
      .bind(TYPES.CreatePrescriptionUseCase)
      .to(CreatePrescriptionUseCase);
    container.bind(TYPES.GetPrescriptionUseCase).to(GetPrescriptionUseCase);
    container.bind(TYPES.ListPrescriptionsUseCase).to(ListPrescriptionsUseCase);
    container
      .bind(TYPES.DispensePrescriptionUseCase)
      .to(DispensePrescriptionUseCase);

    // =====================================================
    // APPLICATION - USE CASES (Treatment Plans)
    // =====================================================
    console.log("  - Binding Treatment Plan Use Cases...");
    container
      .bind(TYPES.CreateTreatmentPlanUseCase)
      .to(CreateTreatmentPlanUseCase);
    container.bind(TYPES.GetTreatmentPlanUseCase).to(GetTreatmentPlanUseCase);
    container
      .bind(TYPES.ListTreatmentPlansUseCase)
      .to(ListTreatmentPlansUseCase);
    container
      .bind(TYPES.UpdateTreatmentPlanUseCase)
      .to(UpdateTreatmentPlanUseCase);
    container
      .bind(TYPES.CompleteTreatmentPlanUseCase)
      .to(CompleteTreatmentPlanUseCase);

    // =====================================================
    // APPLICATION - USE CASES (Lab Results)
    // =====================================================
    console.log("  - Binding Lab Result Use Cases...");
    container
      .bind(TYPES.CreateLabResultUseCase)
      .to(CreateLabResultUseCase);
    container
      .bind(TYPES.GetLabResultUseCase)
      .to(GetLabResultUseCase);
    container
      .bind(TYPES.UpdateLabResultUseCase)
      .to(UpdateLabResultUseCase);
    container
      .bind(TYPES.GetPatientLabResultsUseCase)
      .to(GetPatientLabResultsUseCase);

    // =====================================================
    // APPLICATION - USE CASES (Medical Imaging)
    // =====================================================
    console.log("  - Binding Medical Imaging Use Cases...");
    container
      .bind(TYPES.CreateMedicalImagingUseCase)
      .to(CreateMedicalImagingUseCase);
    container
      .bind(TYPES.GetMedicalImagingUseCase)
      .to(GetMedicalImagingUseCase);
    container
      .bind(TYPES.UpdateMedicalImagingUseCase)
      .to(UpdateMedicalImagingUseCase);
    container
      .bind(TYPES.GetPatientMedicalImagingUseCase)
      .to(GetPatientMedicalImagingUseCase);

    // =====================================================
    // PRESENTATION - CONTROLLERS
    // =====================================================
    console.log("  - Binding Controllers...");
    container
      .bind<MedicalRecordController>(TYPES.MedicalRecordController)
      .to(MedicalRecordController)
      .inSingletonScope();

    container
      .bind<ClinicalNoteController>(TYPES.ClinicalNoteController)
      .to(ClinicalNoteController)
      .inSingletonScope();

    container
      .bind<DiagnosticReportController>(TYPES.DiagnosticReportController)
      .to(DiagnosticReportController)
      .inSingletonScope();

    container
      .bind<PrescriptionController>(TYPES.PrescriptionController)
      .to(PrescriptionController)
      .inSingletonScope();

    container
      .bind<TreatmentPlanController>(TYPES.TreatmentPlanController)
      .to(TreatmentPlanController)
      .inSingletonScope();

    container
      .bind<LabResultController>(TYPES.LabResultController)
      .to(LabResultController)
      .inSingletonScope();

    container
      .bind<MedicalImagingController>(TYPES.MedicalImagingController)
      .to(MedicalImagingController)
      .inSingletonScope();

    // =====================================================
    // PRESENTATION - MIDDLEWARE
    // =====================================================
    console.log("  - Binding Middleware...");
    container
      .bind<AuthenticationMiddleware>(TYPES.AuthenticationMiddleware)
      .to(AuthenticationMiddleware)
      .inSingletonScope();

    console.log("✅ DI Container initialized successfully");
    console.log(`   - Registered ${container.getBindings().length} bindings`);

    return { success: true, errors: [] };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    errors.push(errorMessage);
    console.error("❌ DI Container initialization failed:", errorMessage);
    return { success: false, errors };
  }
}

/**
 * Check container health
 */
export async function checkContainerHealth(): Promise<{
  healthy: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    // Check critical dependencies
    const config = container.get<ClinicalEMRConfig>(TYPES.Config);
    const logger = container.get<ILogger>(TYPES.Logger);
    const supabase = container.get<SupabaseClient>(TYPES.SupabaseClient);

    if (!config) errors.push("Config not available");
    if (!logger) errors.push("Logger not available");
    if (!supabase) errors.push("Supabase client not available");

    return { healthy: errors.length === 0, errors };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Unknown error");
    return { healthy: false, errors };
  }
}

/**
 * Cleanup container resources
 */
export async function cleanupContainer(): Promise<void> {
  try {
    console.log("🧹 Cleaning up DI container...");

    // Unbind all
    container.unbindAll();

    console.log("✅ DI container cleaned up");
  } catch (error) {
    console.error("❌ Error cleaning up container:", error);
  }
}

/**
 * Get a service from the container (helper)
 */
export function resolve<T>(serviceIdentifier: symbol): T {
  return container.get<T>(serviceIdentifier);
}

/**
 * Export container instance
 */
export { container as DIContainer };
