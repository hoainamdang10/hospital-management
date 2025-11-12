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
import { SupabaseOutboxRepository } from "../../../infrastructure/outbox/SupabaseOutboxRepository";
import { OutboxPublisherWorker } from "../../../infrastructure/outbox/OutboxPublisherWorker";
import { ClinicalEventDispatcher } from "../../../application/services/ClinicalEventDispatcher";
import { RabbitMQEventPublisher } from "../../../infrastructure/events/RabbitMQEventPublisher";
import { SupabaseIntegrationInboxRepository } from "../../../infrastructure/repositories/SupabaseIntegrationInboxRepository";
import { SupabasePatientSnapshotRepository } from "../../../infrastructure/repositories/SupabasePatientSnapshotRepository";
import { SupabaseProviderSnapshotRepository } from "../../../infrastructure/repositories/SupabaseProviderSnapshotRepository";
import { ClinicalIntegrationSyncService } from "../../../application/services/ClinicalIntegrationSyncService";
import { ClinicalIntegrationEventConsumer } from "../../../infrastructure/events/ClinicalIntegrationEventConsumer";
import { supabaseClient } from "../../../infrastructure/db/supabase-client";
import { ILogger } from "../../../shared/logger";

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

// New use cases for enhanced endpoints
import { GetPatientSummaryUseCase } from "../../../application/use-cases/GetPatientSummaryUseCase";
import { GetMedicalRecordHistoryUseCase } from "../../../application/use-cases/GetMedicalRecordHistoryUseCase";
import { SearchClinicalDataUseCase } from "../../../application/use-cases/SearchClinicalDataUseCase";
import { GetServiceMetricsUseCase } from "../../../application/use-cases/GetServiceMetricsUseCase";
import { ExportPatientDataUseCase } from "../../../application/use-cases/ExportPatientDataUseCase";

import { MedicalRecordController } from "../controllers/MedicalRecordController";
import { ClinicalNoteController } from "../controllers/ClinicalNoteController";
import { LabResultController } from "../controllers/LabResultController";
import { ImagingStudyController } from "../controllers/ImagingStudyController";
import { PrescriptionController } from "../controllers/PrescriptionController";
import { TreatmentPlanController } from "../controllers/TreatmentPlanController";
import { AuditLogController } from "../controllers/AuditLogController";
import { ClinicalSummaryController } from "../controllers/ClinicalSummaryController";

import { createMedicalRecordRouter } from "../routes/medical-record.routes";
import { createClinicalNoteRouter } from "../routes/clinical-note.routes";
import { createLabResultRouter } from "../routes/lab-result.routes";
import { createImagingStudyRouter } from "../routes/imaging-study.routes";
import { createPrescriptionRouter } from "../routes/prescription.routes";
import { createTreatmentPlanRouter } from "../routes/treatment-plan.routes";
import { createAuditLogRouter } from "../routes/audit-log.routes";
import { createClinicalSummaryRouter } from "../routes/clinical-summary.routes";

import { errorMiddleware } from "../middlewares/error.middleware";
import { authenticationMiddleware } from "../middlewares/auth.middleware";

// New repository import
import { SupabaseClinicalEmrRepository } from "../../../infrastructure/repositories/SupabaseClinicalEmrRepository";

const buildLogger = (): ILogger => {
  const format = (message: string, meta?: Record<string, unknown>) =>
    meta && Object.keys(meta).length
      ? `${message} ${JSON.stringify(meta)}`
      : message;

  return {
    info: (message: string, meta?: Record<string, unknown>) =>
      console.log(`[clinical-emr] ${format(message, meta)}`),
    warn: (message: string, meta?: Record<string, unknown>) =>
      console.warn(`[clinical-emr] ${format(message, meta)}`),
    error: (message: string, meta?: Record<string, unknown>) =>
      console.error(`[clinical-emr] ${format(message, meta)}`),
    fatal: (message: string, meta?: Record<string, unknown>) =>
      console.error(`[clinical-emr][fatal] ${format(message, meta)}`),
    debug: (message: string, meta?: Record<string, unknown>) => {
      if (env.nodeEnv === "development") {
        console.debug(`[clinical-emr] ${format(message, meta)}`);
      }
    },
  };
};

export function createHttpServer() {
  const app = express();
  const logger = buildLogger();

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
  const outboxRepository = new SupabaseOutboxRepository(
    supabaseClient,
    logger,
  );
  const integrationInboxRepository = new SupabaseIntegrationInboxRepository(
    supabaseClient,
    logger,
  );
  const patientSnapshotRepository = new SupabasePatientSnapshotRepository(
    supabaseClient,
    logger,
  );
  const providerSnapshotRepository = new SupabaseProviderSnapshotRepository(
    supabaseClient,
    logger,
  );
  const integrationSyncService = new ClinicalIntegrationSyncService(
    patientSnapshotRepository,
    providerSnapshotRepository,
    logger,
  );

  const rabbitPublisher = new RabbitMQEventPublisher(
    {
      url: env.rabbitmqUrl,
      exchange: env.rabbitmqExchange,
      exchangeType: "topic",
      durable: true,
      autoDelete: false,
      serviceName: "clinical-emr-service",
    },
    {
      enableRetry: true,
      maxRetries: 3,
      retryDelayMs: 1000,
      enableLogging: env.nodeEnv === "development",
    },
    logger,
  );

  const outboxWorker = new OutboxPublisherWorker(
    outboxRepository,
    logger,
    async (event) => rabbitPublisher.publish(event),
    {
      enabled: env.outbox.enabled,
      pollingIntervalMs: env.outbox.pollingIntervalMs,
      batchSize: env.outbox.batchSize,
    },
  );
  let integrationConsumer: ClinicalIntegrationEventConsumer | null = null;

  const startOutboxPipeline = async () => {
    try {
      await rabbitPublisher.connect();
    } catch (error) {
      logger.error("[ClinicalEMR] Failed to connect RabbitMQ", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return;
    }

    try {
      await outboxWorker.start();
    } catch (error) {
      logger.error("[ClinicalEMR] Failed to start outbox worker", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  void startOutboxPipeline();

  if (
    env.integrationConsumer.enabled &&
    env.integrationConsumer.routingKeys.length
  ) {
    integrationConsumer = new ClinicalIntegrationEventConsumer(
      {
        url: env.rabbitmqUrl,
        exchange: env.rabbitmqExchange,
        queueName: env.integrationConsumer.queueName,
        routingKeys: env.integrationConsumer.routingKeys,
        prefetch: env.integrationConsumer.prefetch,
        serviceName: "clinical-emr-service",
      },
      logger,
      integrationInboxRepository,
      integrationSyncService,
    );

    integrationConsumer
      .start()
      .catch((error) =>
        logger.error("[ClinicalEMR] Failed to start integration consumer", {
          error: error instanceof Error ? error.message : "Unknown error",
        }),
      );
  } else {
    logger.info("[ClinicalEMR] Integration consumer disabled", {
      enabled: env.integrationConsumer.enabled,
      routingKeys: env.integrationConsumer.routingKeys.length,
    });
  }

  const eventDispatcher = new ClinicalEventDispatcher(outboxRepository, logger);

  const gracefulShutdown = async () => {
    await outboxWorker.stop().catch(() => undefined);
    await rabbitPublisher.disconnect().catch(() => undefined);
    if (integrationConsumer) {
      await integrationConsumer.stop().catch(() => undefined);
    }
  };

  process.once("SIGINT", gracefulShutdown);
  process.once("SIGTERM", gracefulShutdown);

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
    eventDispatcher,
  );

  const clinicalNoteController = new ClinicalNoteController(
    new CreateClinicalNoteUseCase(clinicalNoteRepo),
    new ListClinicalNotesUseCase(clinicalNoteRepo),
    new DeleteClinicalNoteUseCase(clinicalNoteRepo),
    auditLogUseCase,
    getMedicalRecordUseCase,
    eventDispatcher,
  );

  const labResultController = new LabResultController(
    new CreateLabResultUseCase(labResultRepo),
    new ListLabResultsUseCase(labResultRepo),
    new DeleteLabResultUseCase(labResultRepo),
    auditLogUseCase,
    getMedicalRecordUseCase,
    eventDispatcher,
  );

  const imagingStudyController = new ImagingStudyController(
    new CreateImagingStudyUseCase(imagingRepo),
    new ListImagingStudiesUseCase(imagingRepo),
    new DeleteImagingStudyUseCase(imagingRepo),
    auditLogUseCase,
    getMedicalRecordUseCase,
    eventDispatcher,
  );

  const prescriptionController = new PrescriptionController(
    new CreatePrescriptionUseCase(prescriptionRepo),
    new ListPrescriptionsUseCase(prescriptionRepo),
    auditLogUseCase,
    new DeletePrescriptionUseCase(prescriptionRepo),
    getMedicalRecordUseCase,
    eventDispatcher,
  );

  const treatmentPlanController = new TreatmentPlanController(
    new CreateTreatmentPlanUseCase(treatmentPlanRepo),
    new ListTreatmentPlansUseCase(treatmentPlanRepo),
    new UpdateTreatmentPlanStatusUseCase(treatmentPlanRepo),
    new DeleteTreatmentPlanUseCase(treatmentPlanRepo),
    auditLogUseCase,
    getMedicalRecordUseCase,
    eventDispatcher,
  );

  const auditLogController = new AuditLogController(
    new ListAuditLogsUseCase(auditLogRepo),
    auditLogUseCase,
    getMedicalRecordUseCase,
  );

  // New clinical summary controller and repository
  const clinicalEmrRepository = new SupabaseClinicalEmrRepository();
  const clinicalSummaryController = new ClinicalSummaryController(
    new GetPatientSummaryUseCase(clinicalEmrRepository),
    new GetMedicalRecordHistoryUseCase(clinicalEmrRepository),
    new SearchClinicalDataUseCase(clinicalEmrRepository),
    new GetServiceMetricsUseCase(clinicalEmrRepository),
    new ExportPatientDataUseCase(clinicalEmrRepository),
    logger
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

  // New clinical summary routes
  app.use(
    "/api/v2/clinical-emr",
    createClinicalSummaryRouter(clinicalSummaryController),
  );

  app.use(errorMiddleware);

  return app;
}
