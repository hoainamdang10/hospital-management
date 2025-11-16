"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpServer = createHttpServer;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("../../../infrastructure/config/env");
const SupabaseMedicalRecordRepository_1 = require("../../../infrastructure/repositories/SupabaseMedicalRecordRepository");
const SupabaseClinicalNoteRepository_1 = require("../../../infrastructure/repositories/SupabaseClinicalNoteRepository");
const SupabaseLabResultRepository_1 = require("../../../infrastructure/repositories/SupabaseLabResultRepository");
const SupabaseImagingStudyRepository_1 = require("../../../infrastructure/repositories/SupabaseImagingStudyRepository");
const SupabasePrescriptionRepository_1 = require("../../../infrastructure/repositories/SupabasePrescriptionRepository");
const SupabaseTreatmentPlanRepository_1 = require("../../../infrastructure/repositories/SupabaseTreatmentPlanRepository");
const SupabaseAuditLogRepository_1 = require("../../../infrastructure/repositories/SupabaseAuditLogRepository");
const SupabaseOutboxRepository_1 = require("../../../infrastructure/outbox/SupabaseOutboxRepository");
const OutboxPublisherWorker_1 = require("../../../infrastructure/outbox/OutboxPublisherWorker");
const ClinicalEventDispatcher_1 = require("../../../application/services/ClinicalEventDispatcher");
const RabbitMQEventPublisher_1 = require("../../../infrastructure/events/RabbitMQEventPublisher");
const SupabaseIntegrationInboxRepository_1 = require("../../../infrastructure/repositories/SupabaseIntegrationInboxRepository");
const SupabasePatientSnapshotRepository_1 = require("../../../infrastructure/repositories/SupabasePatientSnapshotRepository");
const SupabaseProviderSnapshotRepository_1 = require("../../../infrastructure/repositories/SupabaseProviderSnapshotRepository");
const ClinicalIntegrationSyncService_1 = require("../../../application/services/ClinicalIntegrationSyncService");
const ClinicalIntegrationEventConsumer_1 = require("../../../infrastructure/events/ClinicalIntegrationEventConsumer");
const AppointmentEventConsumer_1 = require("../../../infrastructure/events/AppointmentEventConsumer");
const BillingEventConsumer_1 = require("../../../infrastructure/events/BillingEventConsumer");
const supabase_client_1 = require("../../../infrastructure/db/supabase-client");
const ListMedicalRecordsUseCase_1 = require("../../../application/use-cases/ListMedicalRecordsUseCase");
const GetMedicalRecordUseCase_1 = require("../../../application/use-cases/GetMedicalRecordUseCase");
const CreateMedicalRecordUseCase_1 = require("../../../application/use-cases/CreateMedicalRecordUseCase");
const UpdateMedicalRecordUseCase_1 = require("../../../application/use-cases/UpdateMedicalRecordUseCase");
const CreateClinicalNoteUseCase_1 = require("../../../application/use-cases/CreateClinicalNoteUseCase");
const ListClinicalNotesUseCase_1 = require("../../../application/use-cases/ListClinicalNotesUseCase");
const DeleteClinicalNoteUseCase_1 = require("../../../application/use-cases/DeleteClinicalNoteUseCase");
const CreateLabResultUseCase_1 = require("../../../application/use-cases/CreateLabResultUseCase");
const ListLabResultsUseCase_1 = require("../../../application/use-cases/ListLabResultsUseCase");
const DeleteLabResultUseCase_1 = require("../../../application/use-cases/DeleteLabResultUseCase");
const CreateImagingStudyUseCase_1 = require("../../../application/use-cases/CreateImagingStudyUseCase");
const ListImagingStudiesUseCase_1 = require("../../../application/use-cases/ListImagingStudiesUseCase");
const DeleteImagingStudyUseCase_1 = require("../../../application/use-cases/DeleteImagingStudyUseCase");
const CreatePrescriptionUseCase_1 = require("../../../application/use-cases/CreatePrescriptionUseCase");
const ListPrescriptionsUseCase_1 = require("../../../application/use-cases/ListPrescriptionsUseCase");
const DeletePrescriptionUseCase_1 = require("../../../application/use-cases/DeletePrescriptionUseCase");
const CreateTreatmentPlanUseCase_1 = require("../../../application/use-cases/CreateTreatmentPlanUseCase");
const ListTreatmentPlansUseCase_1 = require("../../../application/use-cases/ListTreatmentPlansUseCase");
const UpdateTreatmentPlanStatusUseCase_1 = require("../../../application/use-cases/UpdateTreatmentPlanStatusUseCase");
const DeleteTreatmentPlanUseCase_1 = require("../../../application/use-cases/DeleteTreatmentPlanUseCase");
const CreateAuditLogUseCase_1 = require("../../../application/use-cases/CreateAuditLogUseCase");
const ListAuditLogsUseCase_1 = require("../../../application/use-cases/ListAuditLogsUseCase");
// New use cases for enhanced endpoints
const GetPatientSummaryUseCase_1 = require("../../../application/use-cases/GetPatientSummaryUseCase");
const GetMedicalRecordHistoryUseCase_1 = require("../../../application/use-cases/GetMedicalRecordHistoryUseCase");
const SearchClinicalDataUseCase_1 = require("../../../application/use-cases/SearchClinicalDataUseCase");
const GetServiceMetricsUseCase_1 = require("../../../application/use-cases/GetServiceMetricsUseCase");
const ExportPatientDataUseCase_1 = require("../../../application/use-cases/ExportPatientDataUseCase");
const MedicalRecordController_1 = require("../controllers/MedicalRecordController");
const ClinicalNoteController_1 = require("../controllers/ClinicalNoteController");
const LabResultController_1 = require("../controllers/LabResultController");
const ImagingStudyController_1 = require("../controllers/ImagingStudyController");
const PrescriptionController_1 = require("../controllers/PrescriptionController");
const TreatmentPlanController_1 = require("../controllers/TreatmentPlanController");
const AuditLogController_1 = require("../controllers/AuditLogController");
const ClinicalSummaryController_1 = require("../controllers/ClinicalSummaryController");
const medical_record_routes_1 = require("../routes/medical-record.routes");
const clinical_note_routes_1 = require("../routes/clinical-note.routes");
const lab_result_routes_1 = require("../routes/lab-result.routes");
const imaging_study_routes_1 = require("../routes/imaging-study.routes");
const prescription_routes_1 = require("../routes/prescription.routes");
const treatment_plan_routes_1 = require("../routes/treatment-plan.routes");
const audit_log_routes_1 = require("../routes/audit-log.routes");
const clinical_summary_routes_1 = require("../routes/clinical-summary.routes");
const error_middleware_1 = require("../middlewares/error.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
// New repository import
const SupabaseClinicalEmrRepository_1 = require("../../../infrastructure/repositories/SupabaseClinicalEmrRepository");
const buildLogger = () => {
    const format = (message, meta) => meta && Object.keys(meta).length
        ? `${message} ${JSON.stringify(meta)}`
        : message;
    return {
        info: (message, meta) => console.log(`[clinical-emr] ${format(message, meta)}`),
        warn: (message, meta) => console.warn(`[clinical-emr] ${format(message, meta)}`),
        error: (message, meta) => console.error(`[clinical-emr] ${format(message, meta)}`),
        fatal: (message, meta) => console.error(`[clinical-emr][fatal] ${format(message, meta)}`),
        debug: (message, meta) => {
            if (env_1.env.nodeEnv === "development") {
                console.debug(`[clinical-emr] ${format(message, meta)}`);
            }
        },
    };
};
function createHttpServer() {
    const app = (0, express_1.default)();
    const logger = buildLogger();
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)());
    app.use(express_1.default.json({ limit: "1mb" }));
    app.use((0, morgan_1.default)(env_1.env.nodeEnv === "development" ? "dev" : "combined"));
    app.get("/health", (_req, res) => {
        res.json({
            status: "ok",
            service: "clinical-emr-service",
            timestamp: new Date().toISOString(),
        });
    });
    const medicalRecordRepo = new SupabaseMedicalRecordRepository_1.SupabaseMedicalRecordRepository();
    const clinicalNoteRepo = new SupabaseClinicalNoteRepository_1.SupabaseClinicalNoteRepository();
    const labResultRepo = new SupabaseLabResultRepository_1.SupabaseLabResultRepository();
    const imagingRepo = new SupabaseImagingStudyRepository_1.SupabaseImagingStudyRepository();
    const prescriptionRepo = new SupabasePrescriptionRepository_1.SupabasePrescriptionRepository();
    const treatmentPlanRepo = new SupabaseTreatmentPlanRepository_1.SupabaseTreatmentPlanRepository();
    const auditLogRepo = new SupabaseAuditLogRepository_1.SupabaseAuditLogRepository();
    const outboxRepository = new SupabaseOutboxRepository_1.SupabaseOutboxRepository(supabase_client_1.supabaseClient, logger);
    const integrationInboxRepository = new SupabaseIntegrationInboxRepository_1.SupabaseIntegrationInboxRepository(supabase_client_1.supabaseClient, logger);
    const patientSnapshotRepository = new SupabasePatientSnapshotRepository_1.SupabasePatientSnapshotRepository(supabase_client_1.supabaseClient, logger);
    const providerSnapshotRepository = new SupabaseProviderSnapshotRepository_1.SupabaseProviderSnapshotRepository(supabase_client_1.supabaseClient, logger);
    const integrationSyncService = new ClinicalIntegrationSyncService_1.ClinicalIntegrationSyncService(patientSnapshotRepository, providerSnapshotRepository, logger);
    const rabbitPublisher = new RabbitMQEventPublisher_1.RabbitMQEventPublisher({
        url: env_1.env.rabbitmqUrl,
        exchange: env_1.env.rabbitmqExchange,
        exchangeType: "topic",
        durable: true,
        autoDelete: false,
        serviceName: "clinical-emr-service",
    }, {
        enableRetry: true,
        maxRetries: 3,
        retryDelayMs: 1000,
        enableLogging: env_1.env.nodeEnv === "development",
    }, logger);
    const outboxWorker = new OutboxPublisherWorker_1.OutboxPublisherWorker(outboxRepository, logger, async (event) => rabbitPublisher.publish(event), {
        enabled: env_1.env.outbox.enabled,
        pollingIntervalMs: env_1.env.outbox.pollingIntervalMs,
        batchSize: env_1.env.outbox.batchSize,
    });
    let integrationConsumer = null;
    const startOutboxPipeline = async () => {
        try {
            await rabbitPublisher.connect();
        }
        catch (error) {
            logger.error("[ClinicalEMR] Failed to connect RabbitMQ", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            return;
        }
        try {
            await outboxWorker.start();
        }
        catch (error) {
            logger.error("[ClinicalEMR] Failed to start outbox worker", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };
    void startOutboxPipeline();
    if (env_1.env.integrationConsumer.enabled &&
        env_1.env.integrationConsumer.routingKeys.length) {
        integrationConsumer = new ClinicalIntegrationEventConsumer_1.ClinicalIntegrationEventConsumer({
            url: env_1.env.rabbitmqUrl,
            exchange: env_1.env.rabbitmqExchange,
            queueName: env_1.env.integrationConsumer.queueName,
            routingKeys: env_1.env.integrationConsumer.routingKeys,
            prefetch: env_1.env.integrationConsumer.prefetch,
            serviceName: "clinical-emr-service",
        }, logger, integrationInboxRepository, integrationSyncService);
        integrationConsumer
            .start()
            .catch((error) => logger.error("[ClinicalEMR] Failed to start integration consumer", {
            error: error instanceof Error ? error.message : "Unknown error",
        }));
    }
    else {
        logger.info("[ClinicalEMR] Integration consumer disabled", {
            enabled: env_1.env.integrationConsumer.enabled,
            routingKeys: env_1.env.integrationConsumer.routingKeys.length,
        });
    }
    // Initialize Appointment Event Consumer
    let appointmentConsumer;
    if (env_1.env.appointmentConsumer.enabled &&
        env_1.env.appointmentConsumer.routingKeys.length) {
        appointmentConsumer = new AppointmentEventConsumer_1.AppointmentEventConsumer({
            rabbitmqUrl: env_1.env.rabbitmqUrl,
            queueName: env_1.env.appointmentConsumer.queueName,
            exchangeName: env_1.env.rabbitmqExchange,
            routingKeys: env_1.env.appointmentConsumer.routingKeys,
            prefetchCount: env_1.env.appointmentConsumer.prefetch,
            retryAttempts: 3,
            retryDelayMs: 1000,
        }, logger, medicalRecordRepo, clinicalNoteRepo, patientSnapshotRepo, providerSnapshotRepo, integrationSyncService);
        appointmentConsumer
            .connect()
            .catch((error) => logger.error("[ClinicalEMR] Failed to start appointment consumer", {
            error: error instanceof Error ? error.message : "Unknown error",
        }));
    }
    else {
        logger.info("[ClinicalEMR] Appointment consumer disabled", {
            enabled: env_1.env.appointmentConsumer.enabled,
            routingKeys: env_1.env.appointmentConsumer.routingKeys.length,
        });
    }
    // Initialize Billing Event Consumer
    let billingConsumer;
    if (env_1.env.billingConsumer.enabled &&
        env_1.env.billingConsumer.routingKeys.length) {
        billingConsumer = new BillingEventConsumer_1.BillingEventConsumer({
            rabbitmqUrl: env_1.env.rabbitmqUrl,
            queueName: env_1.env.billingConsumer.queueName,
            exchangeName: env_1.env.rabbitmqExchange,
            routingKeys: env_1.env.billingConsumer.routingKeys,
            prefetchCount: env_1.env.billingConsumer.prefetch,
            retryAttempts: 3,
            retryDelayMs: 1000,
        }, logger, medicalRecordRepo, clinicalNoteRepo, patientSnapshotRepo);
        billingConsumer
            .connect()
            .catch((error) => logger.error("[ClinicalEMR] Failed to start billing consumer", {
            error: error instanceof Error ? error.message : "Unknown error",
        }));
    }
    else {
        logger.info("[ClinicalEMR] Billing consumer disabled", {
            enabled: env_1.env.billingConsumer.enabled,
            routingKeys: env_1.env.billingConsumer.routingKeys.length,
        });
    }
    const eventDispatcher = new ClinicalEventDispatcher_1.ClinicalEventDispatcher(outboxRepository, logger);
    const gracefulShutdown = async () => {
        await outboxWorker.stop().catch(() => undefined);
        await rabbitPublisher.disconnect().catch(() => undefined);
        if (integrationConsumer) {
            await integrationConsumer.stop().catch(() => undefined);
        }
        if (appointmentConsumer) {
            await appointmentConsumer.disconnect().catch(() => undefined);
        }
        if (billingConsumer) {
            await billingConsumer.disconnect().catch(() => undefined);
        }
    };
    process.once("SIGINT", gracefulShutdown);
    process.once("SIGTERM", gracefulShutdown);
    const auditLogUseCase = new CreateAuditLogUseCase_1.CreateAuditLogUseCase(auditLogRepo);
    const listMedicalRecordsUseCase = new ListMedicalRecordsUseCase_1.ListMedicalRecordsUseCase(medicalRecordRepo);
    const getMedicalRecordUseCase = new GetMedicalRecordUseCase_1.GetMedicalRecordUseCase(medicalRecordRepo);
    const medicalRecordController = new MedicalRecordController_1.MedicalRecordController(listMedicalRecordsUseCase, getMedicalRecordUseCase, new CreateMedicalRecordUseCase_1.CreateMedicalRecordUseCase(medicalRecordRepo), new UpdateMedicalRecordUseCase_1.UpdateMedicalRecordUseCase(medicalRecordRepo), auditLogUseCase, eventDispatcher);
    const clinicalNoteController = new ClinicalNoteController_1.ClinicalNoteController(new CreateClinicalNoteUseCase_1.CreateClinicalNoteUseCase(clinicalNoteRepo), new ListClinicalNotesUseCase_1.ListClinicalNotesUseCase(clinicalNoteRepo), new DeleteClinicalNoteUseCase_1.DeleteClinicalNoteUseCase(clinicalNoteRepo), auditLogUseCase, getMedicalRecordUseCase, eventDispatcher);
    const labResultController = new LabResultController_1.LabResultController(new CreateLabResultUseCase_1.CreateLabResultUseCase(labResultRepo), new ListLabResultsUseCase_1.ListLabResultsUseCase(labResultRepo), new DeleteLabResultUseCase_1.DeleteLabResultUseCase(labResultRepo), auditLogUseCase, getMedicalRecordUseCase, eventDispatcher);
    const imagingStudyController = new ImagingStudyController_1.ImagingStudyController(new CreateImagingStudyUseCase_1.CreateImagingStudyUseCase(imagingRepo), new ListImagingStudiesUseCase_1.ListImagingStudiesUseCase(imagingRepo), new DeleteImagingStudyUseCase_1.DeleteImagingStudyUseCase(imagingRepo), auditLogUseCase, getMedicalRecordUseCase, eventDispatcher);
    const prescriptionController = new PrescriptionController_1.PrescriptionController(new CreatePrescriptionUseCase_1.CreatePrescriptionUseCase(prescriptionRepo), new ListPrescriptionsUseCase_1.ListPrescriptionsUseCase(prescriptionRepo), auditLogUseCase, new DeletePrescriptionUseCase_1.DeletePrescriptionUseCase(prescriptionRepo), getMedicalRecordUseCase, eventDispatcher);
    const treatmentPlanController = new TreatmentPlanController_1.TreatmentPlanController(new CreateTreatmentPlanUseCase_1.CreateTreatmentPlanUseCase(treatmentPlanRepo), new ListTreatmentPlansUseCase_1.ListTreatmentPlansUseCase(treatmentPlanRepo), new UpdateTreatmentPlanStatusUseCase_1.UpdateTreatmentPlanStatusUseCase(treatmentPlanRepo), new DeleteTreatmentPlanUseCase_1.DeleteTreatmentPlanUseCase(treatmentPlanRepo), auditLogUseCase, getMedicalRecordUseCase, eventDispatcher);
    const auditLogController = new AuditLogController_1.AuditLogController(new ListAuditLogsUseCase_1.ListAuditLogsUseCase(auditLogRepo), auditLogUseCase, getMedicalRecordUseCase);
    // New clinical summary controller and repository
    const clinicalEmrRepository = new SupabaseClinicalEmrRepository_1.SupabaseClinicalEmrRepository();
    const clinicalSummaryController = new ClinicalSummaryController_1.ClinicalSummaryController(new GetPatientSummaryUseCase_1.GetPatientSummaryUseCase(clinicalEmrRepository), new GetMedicalRecordHistoryUseCase_1.GetMedicalRecordHistoryUseCase(clinicalEmrRepository), new SearchClinicalDataUseCase_1.SearchClinicalDataUseCase(clinicalEmrRepository), new GetServiceMetricsUseCase_1.GetServiceMetricsUseCase(clinicalEmrRepository), new ExportPatientDataUseCase_1.ExportPatientDataUseCase(clinicalEmrRepository), logger);
    app.use(auth_middleware_1.authenticationMiddleware);
    app.use("/api/v2/clinical-emr", (0, medical_record_routes_1.createMedicalRecordRouter)(medicalRecordController));
    app.use("/api/v2/clinical-emr/medical-records/:recordId/notes", (0, clinical_note_routes_1.createClinicalNoteRouter)(clinicalNoteController));
    app.use("/api/v2/clinical-emr/medical-records/:recordId/lab-results", (0, lab_result_routes_1.createLabResultRouter)(labResultController));
    app.use("/api/v2/clinical-emr/medical-records/:recordId/imaging-studies", (0, imaging_study_routes_1.createImagingStudyRouter)(imagingStudyController));
    app.use("/api/v2/clinical-emr/medical-records/:recordId/prescriptions", (0, prescription_routes_1.createPrescriptionRouter)(prescriptionController));
    app.use("/api/v2/clinical-emr/medical-records/:recordId/treatment-plans", (0, treatment_plan_routes_1.createTreatmentPlanRouter)(treatmentPlanController));
    app.use("/api/v2/clinical-emr/medical-records/:recordId/audit-logs", (0, audit_log_routes_1.createAuditLogRouter)(auditLogController));
    // New clinical summary routes
    app.use("/api/v2/clinical-emr", (0, clinical_summary_routes_1.createClinicalSummaryRouter)(clinicalSummaryController));
    app.use(error_middleware_1.errorMiddleware);
    return app;
}
