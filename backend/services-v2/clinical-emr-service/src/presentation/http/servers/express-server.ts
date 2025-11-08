import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";

import { env } from "../../../infrastructure/config/env";
import { SupabaseMedicalRecordRepository } from "../../../infrastructure/repositories/SupabaseMedicalRecordRepository";
import { SupabaseClinicalNoteRepository } from "../../../infrastructure/repositories/SupabaseClinicalNoteRepository";
import { SupabaseLabResultRepository } from "../../../infrastructure/repositories/SupabaseLabResultRepository";
import { SupabaseImagingStudyRepository } from "../../../infrastructure/repositories/SupabaseImagingStudyRepository";
import { SupabasePrescriptionRepository } from "../../../infrastructure/repositories/SupabasePrescriptionRepository";
import { SupabaseTreatmentPlanRepository } from "../../../infrastructure/repositories/SupabaseTreatmentPlanRepository";
import { SupabaseAuditLogRepository } from "../../../infrastructure/repositories/SupabaseAuditLogRepository";

import { ListMedicalRecordsUseCase } from "../../../application/use-cases/ListMedicalRecordsUseCase";
import { GetMedicalRecordUseCase } from "../../../application/use-cases/GetMedicalRecordUseCase";
import { CreateMedicalRecordUseCase } from "../../../application/use-cases/CreateMedicalRecordUseCase";
import { UpdateMedicalRecordUseCase } from "../../../application/use-cases/UpdateMedicalRecordUseCase";
import { CreateClinicalNoteUseCase } from "../../../application/use-cases/CreateClinicalNoteUseCase";
import { ListClinicalNotesUseCase } from "../../../application/use-cases/ListClinicalNotesUseCase";
import { DeleteClinicalNoteUseCase } from "../../../application/use-cases/DeleteClinicalNoteUseCase";
import { CreateLabResultUseCase } from "../../../application/use-cases/CreateLabResultUseCase";
import { ListLabResultsUseCase } from "../../../application/use-cases/ListLabResultsUseCase";
import { DeleteLabResultUseCase } from "../../../application/use-cases/DeleteLabResultUseCase";
import { CreateImagingStudyUseCase } from "../../../application/use-cases/CreateImagingStudyUseCase";
import { ListImagingStudiesUseCase } from "../../../application/use-cases/ListImagingStudiesUseCase";
import { DeleteImagingStudyUseCase } from "../../../application/use-cases/DeleteImagingStudyUseCase";
import { CreatePrescriptionUseCase } from "../../../application/use-cases/CreatePrescriptionUseCase";
import { ListPrescriptionsUseCase } from "../../../application/use-cases/ListPrescriptionsUseCase";
import { DeletePrescriptionUseCase } from "../../../application/use-cases/DeletePrescriptionUseCase";
import { CreateTreatmentPlanUseCase } from "../../../application/use-cases/CreateTreatmentPlanUseCase";
import { ListTreatmentPlansUseCase } from "../../../application/use-cases/ListTreatmentPlansUseCase";
import { UpdateTreatmentPlanStatusUseCase } from "../../../application/use-cases/UpdateTreatmentPlanStatusUseCase";
import { DeleteTreatmentPlanUseCase } from "../../../application/use-cases/DeleteTreatmentPlanUseCase";
import { CreateAuditLogUseCase } from "../../../application/use-cases/CreateAuditLogUseCase";
import { ListAuditLogsUseCase } from "../../../application/use-cases/ListAuditLogsUseCase";

import { MedicalRecordController } from "../controllers/MedicalRecordController";
import { ClinicalNoteController } from "../controllers/ClinicalNoteController";
import { LabResultController } from "../controllers/LabResultController";
import { ImagingStudyController } from "../controllers/ImagingStudyController";
import { PrescriptionController } from "../controllers/PrescriptionController";
import { TreatmentPlanController } from "../controllers/TreatmentPlanController";
import { AuditLogController } from "../controllers/AuditLogController";

import { createMedicalRecordRouter } from "../routes/medical-record.routes";
import { createClinicalNoteRouter } from "../routes/clinical-note.routes";
import { createLabResultRouter } from "../routes/lab-result.routes";
import { createImagingStudyRouter } from "../routes/imaging-study.routes";
import { createPrescriptionRouter } from "../routes/prescription.routes";
import { createTreatmentPlanRouter } from "../routes/treatment-plan.routes";
import { createAuditLogRouter } from "../routes/audit-log.routes";

import { errorMiddleware } from "../middlewares/error.middleware";
import { authenticationMiddleware } from "../middlewares/auth.middleware";

export function createHttpServer() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "clinical-emr-service",
      timestamp: new Date().toISOString(),
    });
  });

  const medicalRecordRepo = new SupabaseMedicalRecordRepository();
  const clinicalNoteRepo = new SupabaseClinicalNoteRepository();
  const labResultRepo = new SupabaseLabResultRepository();
  const imagingRepo = new SupabaseImagingStudyRepository();
  const prescriptionRepo = new SupabasePrescriptionRepository();
  const treatmentPlanRepo = new SupabaseTreatmentPlanRepository();
  const auditLogRepo = new SupabaseAuditLogRepository();

  const auditLogUseCase = new CreateAuditLogUseCase(auditLogRepo);
  const listMedicalRecordsUseCase = new ListMedicalRecordsUseCase(
    medicalRecordRepo,
  );
  const getMedicalRecordUseCase = new GetMedicalRecordUseCase(
    medicalRecordRepo,
  );

  const medicalRecordController = new MedicalRecordController(
    listMedicalRecordsUseCase,
    getMedicalRecordUseCase,
    new CreateMedicalRecordUseCase(medicalRecordRepo),
    new UpdateMedicalRecordUseCase(medicalRecordRepo),
    auditLogUseCase,
  );

  const clinicalNoteController = new ClinicalNoteController(
    new CreateClinicalNoteUseCase(clinicalNoteRepo),
    new ListClinicalNotesUseCase(clinicalNoteRepo),
    new DeleteClinicalNoteUseCase(clinicalNoteRepo),
    auditLogUseCase,
    getMedicalRecordUseCase,
  );

  const labResultController = new LabResultController(
    new CreateLabResultUseCase(labResultRepo),
    new ListLabResultsUseCase(labResultRepo),
    new DeleteLabResultUseCase(labResultRepo),
    auditLogUseCase,
    getMedicalRecordUseCase,
  );

  const imagingStudyController = new ImagingStudyController(
    new CreateImagingStudyUseCase(imagingRepo),
    new ListImagingStudiesUseCase(imagingRepo),
    new DeleteImagingStudyUseCase(imagingRepo),
    auditLogUseCase,
    getMedicalRecordUseCase,
  );

  const prescriptionController = new PrescriptionController(
    new CreatePrescriptionUseCase(prescriptionRepo),
    new ListPrescriptionsUseCase(prescriptionRepo),
    auditLogUseCase,
    new DeletePrescriptionUseCase(prescriptionRepo),
    getMedicalRecordUseCase,
  );

  const treatmentPlanController = new TreatmentPlanController(
    new CreateTreatmentPlanUseCase(treatmentPlanRepo),
    new ListTreatmentPlansUseCase(treatmentPlanRepo),
    new UpdateTreatmentPlanStatusUseCase(treatmentPlanRepo),
    new DeleteTreatmentPlanUseCase(treatmentPlanRepo),
    auditLogUseCase,
    getMedicalRecordUseCase,
  );

  const auditLogController = new AuditLogController(
    new ListAuditLogsUseCase(auditLogRepo),
    auditLogUseCase,
    getMedicalRecordUseCase,
  );

  app.use(authenticationMiddleware);

  app.use(
    "/api/v2/clinical-emr",
    createMedicalRecordRouter(medicalRecordController),
  );
  app.use(
    "/api/v2/clinical-emr/medical-records/:recordId/notes",
    createClinicalNoteRouter(clinicalNoteController),
  );
  app.use(
    "/api/v2/clinical-emr/medical-records/:recordId/lab-results",
    createLabResultRouter(labResultController),
  );
  app.use(
    "/api/v2/clinical-emr/medical-records/:recordId/imaging-studies",
    createImagingStudyRouter(imagingStudyController),
  );
  app.use(
    "/api/v2/clinical-emr/medical-records/:recordId/prescriptions",
    createPrescriptionRouter(prescriptionController),
  );
  app.use(
    "/api/v2/clinical-emr/medical-records/:recordId/treatment-plans",
    createTreatmentPlanRouter(treatmentPlanController),
  );
  app.use(
    "/api/v2/clinical-emr/medical-records/:recordId/audit-logs",
    createAuditLogRouter(auditLogController),
  );

  app.use(errorMiddleware);

  return app;
}
