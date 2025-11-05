/**
 * Dependency Injection Setup - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Clinical EMR Service DI Container Configuration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Dependency Injection
 */

import {
  OptimizedSupabaseClient,
  OptimizedSupabaseClientConfig,
} from "@shared/infrastructure/database/optimized-supabase-client";
import {
  DIContainer,
  ServiceLifetime,
} from "@shared/infrastructure/di/container";
import { ILogger } from "@shared/infrastructure/logging/logger.interface";
import { IAuditService } from "@shared/application/services/audit.service.interface";
import { ConsoleLogger } from "@shared/infrastructure/logging/console-logger";
import { AuditService } from "@shared/infrastructure/services/audit.service";

// Application Layer - Services
import { ClinicalEMRApplicationService } from "../../application/services/ClinicalEMRApplicationService";
import { ITokenVerifier } from "../../application/services/ITokenVerifier";
import { IAuditLogService } from "../../application/services/IAuditLogService";
import { CreateMedicalRecordUseCase } from "../../application/use-cases/CreateMedicalRecordUseCase";
import { UpdateMedicalRecordUseCase } from "../../application/use-cases/UpdateMedicalRecordUseCase";
import { GetMedicalRecordUseCase } from "../../application/use-cases/GetMedicalRecordUseCase";
import { SearchMedicalRecordsUseCase } from "../../application/use-cases/SearchMedicalRecordsUseCase";
import { GenerateMedicalReportUseCase } from "../../application/use-cases/GenerateMedicalReportUseCase";
import { ExportToFHIRUseCase } from "../../application/use-cases/ExportToFHIRUseCase";
import { GetAuditLogsUseCase } from "../../application/use-cases/GetAuditLogsUseCase";
import { BulkExportFHIRUseCase } from "../../application/use-cases/BulkExportFHIRUseCase";

// Infrastructure Layer
import { SupabaseMedicalRecordRepository } from "../persistence/SupabaseMedicalRecordRepository";
import { FHIRExportService } from "../external/FHIRExportService";
import { SupabaseTokenVerifier } from "../services/SupabaseTokenVerifier";
import { SupabaseAuditLogService } from "../audit/SupabaseAuditLogService";
// import { SupabaseEventBus } from "../messaging/SupabaseEventBus"; // TODO: Implement SupabaseEventBus
import { MedicalRecordDomainEventHandler } from "../events/MedicalRecordDomainEventHandler";
import { ClinicalEMREventHandler } from "../events/ClinicalEMREventHandler";
import { SupabaseOutboxRepository } from "../outbox/SupabaseOutboxRepository";
import { OutboxMedicalRecordRepository } from "../outbox/OutboxMedicalRecordRepository";
import { OutboxPublisherWorker } from "../outbox/OutboxPublisherWorker";
import { FHIRExportServiceAdapter } from "../services/FHIRExportServiceAdapter";
import { AuditLogServiceAdapter } from "../services/AuditLogServiceAdapter";

// Middleware
import { AuthenticationMiddleware } from "../../presentation/middleware/AuthenticationMiddleware";

// Service Tokens
export const ServiceTokens = {
  // Infrastructure
  SUPABASE_CLIENT: "SupabaseClient",
  LOGGER: "Logger",
  AUDIT_SERVICE: "AuditService",
  AUDIT_LOG_SERVICE: "AuditLogService",
  TOKEN_VERIFIER: "TokenVerifier",
  EVENT_BUS: "EventBus",
  
  // Middleware
  AUTHENTICATION_MIDDLEWARE: "AuthenticationMiddleware",

  // Repositories
  MEDICAL_RECORD_REPOSITORY: "MedicalRecordRepository",

  // External Services
  FHIR_EXPORT_SERVICE: "FHIRExportService",
  FHIR_EXPORT_SERVICE_ADAPTER: "FHIRExportServiceAdapter",
  AUDIT_LOG_SERVICE_ADAPTER: "AuditLogServiceAdapter",

  // Outbox Pattern
  OUTBOX_REPOSITORY: "OutboxRepository",
  BASE_MEDICAL_RECORD_REPOSITORY: "BaseMedicalRecordRepository",
  OUTBOX_PUBLISHER_WORKER: "OutboxPublisherWorker",

  // Use Cases
  CREATE_MEDICAL_RECORD_USE_CASE: "CreateMedicalRecordUseCase",
  UPDATE_MEDICAL_RECORD_USE_CASE: "UpdateMedicalRecordUseCase",
  GET_MEDICAL_RECORD_USE_CASE: "GetMedicalRecordUseCase",
  GET_PATIENT_MEDICAL_RECORDS_USE_CASE: "GetPatientMedicalRecordsUseCase",
  SEARCH_MEDICAL_RECORDS_USE_CASE: "SearchMedicalRecordsUseCase",
  GENERATE_MEDICAL_REPORT_USE_CASE: "GenerateMedicalReportUseCase",
  EXPORT_TO_FHIR_USE_CASE: "ExportToFHIRUseCase",
  GET_AUDIT_LOGS_USE_CASE: "GetAuditLogsUseCase",
  BULK_EXPORT_FHIR_USE_CASE: "BulkExportFHIRUseCase",

  // Command Handlers
  ADD_DIAGNOSIS_COMMAND_HANDLER: "AddDiagnosisCommandHandler",
  ADD_MEDICATION_COMMAND_HANDLER: "AddMedicationCommandHandler",

  // Query Handlers
  GET_MEDICAL_RECORD_DETAILS_QUERY_HANDLER: "GetMedicalRecordDetailsQueryHandler",

  // Event Handlers
  MEDICAL_RECORD_DOMAIN_EVENT_HANDLER: "MedicalRecordDomainEventHandler",
  CLINICAL_EMR_EVENT_HANDLER: "ClinicalEMREventHandler",

  // Application Services
  CLINICAL_EMR_APPLICATION_SERVICE: "ClinicalEMRApplicationService",
} as const;

export function setupDependencies(container: DIContainer): void {
  // Register infrastructure services
  container.register(
    ServiceTokens.LOGGER,
    (() => new ConsoleLogger('clinical-emr-service')) as any,
    ServiceLifetime.SINGLETON
  );

  container.register(
    ServiceTokens.AUDIT_SERVICE,
    (() => new AuditService()) as any,
    ServiceLifetime.SINGLETON
  );

  // Register Supabase client
  container.register(
    ServiceTokens.SUPABASE_CLIENT,
    (() => {
      const config: OptimizedSupabaseClientConfig = {
        supabaseUrl: process.env.SUPABASE_URL || "",
        supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        serviceName: "clinical-emr-service",
        schemaName: "clinical_schema",
        enableOptimizations: true,
      };
      return new OptimizedSupabaseClient(config);
    }) as any,
    ServiceLifetime.SINGLETON
  );

  // Register TokenVerifier
  container.register(
    ServiceTokens.TOKEN_VERIFIER,
    ((container: any) => {
      const logger = container.resolve(ServiceTokens.LOGGER);
      return new SupabaseTokenVerifier(logger);
    }) as any,
    ServiceLifetime.SINGLETON
  );

  // Register AuditLogService
  container.register(
    ServiceTokens.AUDIT_LOG_SERVICE,
    ((container: any) => {
      const supabaseClient = container.resolve(ServiceTokens.SUPABASE_CLIENT);
      const logger = container.resolve(ServiceTokens.LOGGER);
      return new SupabaseAuditLogService(supabaseClient, logger);
    }) as any,
    ServiceLifetime.SINGLETON
  );

  // Register AuthenticationMiddleware
  container.register(
    ServiceTokens.AUTHENTICATION_MIDDLEWARE,
    ((container: any) => {
      const tokenVerifier = container.resolve(ServiceTokens.TOKEN_VERIFIER);
      const auditLogService = container.resolve(ServiceTokens.AUDIT_LOG_SERVICE);
      const logger = container.resolve(ServiceTokens.LOGGER);
      return new AuthenticationMiddleware(tokenVerifier, auditLogService, logger);
    }) as any,
    ServiceLifetime.SINGLETON
  );

  // Register event bus
  container.register(
    ServiceTokens.EVENT_BUS,
    ((container: any) => {
      // TODO: Implement SupabaseEventBus
      return {
        publish: async () => {},
        publishBatch: async () => {}
      } as any;
    }) as any,
    ServiceLifetime.SCOPED
  );

  // Register Outbox Repository
  container.register(
    ServiceTokens.OUTBOX_REPOSITORY,
    ((container: any) => {
      const supabaseClient = container.resolve(ServiceTokens.SUPABASE_CLIENT);
      const logger = container.resolve(ServiceTokens.LOGGER);
      return new SupabaseOutboxRepository(supabaseClient, logger);
    }) as any,
    ServiceLifetime.SINGLETON
  );

  // Register Base Medical Record Repository (without outbox)
  container.register(
    ServiceTokens.BASE_MEDICAL_RECORD_REPOSITORY,
    ((container: any) => {
      const supabaseClient = container.resolve(ServiceTokens.SUPABASE_CLIENT);
      const logger = container.resolve(ServiceTokens.LOGGER);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);

      return new SupabaseMedicalRecordRepository({
        supabase: supabaseClient,
        logger,
        auditService,
        schema: 'clinical_schema',
        tableName: 'medical_records'
      });
    }) as any,
    ServiceLifetime.SCOPED
  );

  // Register Medical Record Repository with Outbox Pattern (PRODUCTION)
  container.register(
    ServiceTokens.MEDICAL_RECORD_REPOSITORY,
    ((container: any) => {
      const baseRepository = container.resolve(ServiceTokens.BASE_MEDICAL_RECORD_REPOSITORY);
      const outboxRepository = container.resolve(ServiceTokens.OUTBOX_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new OutboxMedicalRecordRepository(baseRepository, outboxRepository, logger);
    }) as any,
    ServiceLifetime.SCOPED
  );

  // Register Outbox Publisher Worker
  container.register(
    ServiceTokens.OUTBOX_PUBLISHER_WORKER,
    ((container: any) => {
      const outboxRepository = container.resolve(ServiceTokens.OUTBOX_REPOSITORY);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);
      const supabaseClient = container.resolve(ServiceTokens.SUPABASE_CLIENT);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new OutboxPublisherWorker(
        outboxRepository,
        eventBus,
        supabaseClient,
        logger,
        {
          pollingIntervalMs: parseInt(process.env.OUTBOX_POLLING_INTERVAL || '1000'),
          batchSize: parseInt(process.env.OUTBOX_BATCH_SIZE || '50'),
          enabled: process.env.OUTBOX_WORKER_ENABLED !== 'false',
        }
      );
    }) as any,
    ServiceLifetime.SINGLETON
  );

  // Register external services
  container.register(
    ServiceTokens.FHIR_EXPORT_SERVICE,
    ((container: any) => {
      const logger = container.resolve(ServiceTokens.LOGGER);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);

      return new FHIRExportService({
        logger,
        auditService,
        fhirVersion: '4.0.1',
        validateByDefault: true,
        includeVietnameseExtensions: true
      });
    }) as any,
    ServiceLifetime.SCOPED
  );

  // Register use cases
  container.register(
    ServiceTokens.CREATE_MEDICAL_RECORD_USE_CASE,
    ((container: any) => {
      const repository = container.resolve(ServiceTokens.MEDICAL_RECORD_REPOSITORY);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);

      return new CreateMedicalRecordUseCase(repository, eventBus);
    }) as any,
    ServiceLifetime.TRANSIENT
  );

  container.register(
    ServiceTokens.UPDATE_MEDICAL_RECORD_USE_CASE,
    ((container: any) => {
      const repository = container.resolve(ServiceTokens.MEDICAL_RECORD_REPOSITORY);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);

      return new UpdateMedicalRecordUseCase(repository, eventBus);
    }) as any,
    ServiceLifetime.TRANSIENT
  );

  container.register(
    ServiceTokens.GET_MEDICAL_RECORD_USE_CASE,
    ((container: any) => {
      const repository = container.resolve(ServiceTokens.MEDICAL_RECORD_REPOSITORY);

      return new GetMedicalRecordUseCase(repository);
    }) as any,
    ServiceLifetime.TRANSIENT
  );

  container.register(
    ServiceTokens.SEARCH_MEDICAL_RECORDS_USE_CASE,
    ((container: any) => {
      const repository = container.resolve(ServiceTokens.MEDICAL_RECORD_REPOSITORY);

      return new SearchMedicalRecordsUseCase(repository);
    }) as any,
    ServiceLifetime.TRANSIENT
  );

  container.register(
    ServiceTokens.GENERATE_MEDICAL_REPORT_USE_CASE,
    ((container: any) => {
      const repository = container.resolve(ServiceTokens.MEDICAL_RECORD_REPOSITORY);

      return new GenerateMedicalReportUseCase(repository);
    }) as any,
    ServiceLifetime.TRANSIENT
  );

  container.register(
    ServiceTokens.EXPORT_TO_FHIR_USE_CASE,
    ((container: any) => {
      const repository = container.resolve(ServiceTokens.MEDICAL_RECORD_REPOSITORY);

      return new ExportToFHIRUseCase(repository);
    }) as any,
    ServiceLifetime.TRANSIENT
  );

  // Register event handlers
  container.register(
    ServiceTokens.MEDICAL_RECORD_DOMAIN_EVENT_HANDLER,
    ((container: any) => {
      const logger = container.resolve(ServiceTokens.LOGGER);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);

      return new MedicalRecordDomainEventHandler({
        logger,
        auditService,
        eventBus
      });
    }) as any,
    ServiceLifetime.SCOPED
  );

  container.register(
    ServiceTokens.CLINICAL_EMR_EVENT_HANDLER,
    ((container: any) => {
      const createUseCase = container.resolve(ServiceTokens.CREATE_MEDICAL_RECORD_USE_CASE);
      const updateUseCase = container.resolve(ServiceTokens.UPDATE_MEDICAL_RECORD_USE_CASE);
      const generateReportUseCase = container.resolve(ServiceTokens.GENERATE_MEDICAL_REPORT_USE_CASE);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new ClinicalEMREventHandler(
        createUseCase,
        updateUseCase,
        generateReportUseCase,
        logger
      );
    }) as any,
    ServiceLifetime.SCOPED
  );

  // Register FHIR Export Service Adapter
  container.register(
    ServiceTokens.FHIR_EXPORT_SERVICE_ADAPTER,
    ((container: any) => {
      const fhirExportService = container.resolve(ServiceTokens.FHIR_EXPORT_SERVICE);
      return new FHIRExportServiceAdapter(fhirExportService);
    }) as any,
    ServiceLifetime.SINGLETON
  );

  // Register Audit Log Service Adapter
  container.register(
    ServiceTokens.AUDIT_LOG_SERVICE_ADAPTER,
    ((container: any) => {
      const auditLogService = container.resolve(ServiceTokens.AUDIT_LOG_SERVICE);
      return new AuditLogServiceAdapter(auditLogService);
    }) as any,
    ServiceLifetime.SINGLETON
  );

  // Register GetAuditLogsUseCase
  container.register(
    ServiceTokens.GET_AUDIT_LOGS_USE_CASE,
    ((container: any) => {
      const auditLogServiceAdapter = container.resolve(ServiceTokens.AUDIT_LOG_SERVICE_ADAPTER);
      return new GetAuditLogsUseCase(auditLogServiceAdapter);
    }) as any,
    ServiceLifetime.SCOPED
  );

  // Register BulkExportFHIRUseCase
  container.register(
    ServiceTokens.BULK_EXPORT_FHIR_USE_CASE,
    ((container: any) => {
      const medicalRecordRepository = container.resolve(ServiceTokens.MEDICAL_RECORD_REPOSITORY);
      const fhirExportServiceAdapter = container.resolve(ServiceTokens.FHIR_EXPORT_SERVICE_ADAPTER);
      return new BulkExportFHIRUseCase(medicalRecordRepository, fhirExportServiceAdapter);
    }) as any,
    ServiceLifetime.SCOPED
  );

  // Register application services
  container.register(
    ServiceTokens.CLINICAL_EMR_APPLICATION_SERVICE,
    ((container: any) => {
      // Use Cases
      const createUseCase = container.resolve(ServiceTokens.CREATE_MEDICAL_RECORD_USE_CASE);
      const updateUseCase = container.resolve(ServiceTokens.UPDATE_MEDICAL_RECORD_USE_CASE);
      const getUseCase = container.resolve(ServiceTokens.GET_MEDICAL_RECORD_USE_CASE);
      const getPatientRecordsUseCase = container.resolve(ServiceTokens.GET_PATIENT_MEDICAL_RECORDS_USE_CASE || 'GetPatientMedicalRecordsUseCase');
      const generateReportUseCase = container.resolve(ServiceTokens.GENERATE_MEDICAL_REPORT_USE_CASE);
      const searchUseCase = container.resolve(ServiceTokens.SEARCH_MEDICAL_RECORDS_USE_CASE);

      // Command Handlers
      const addDiagnosisHandler = container.resolve(ServiceTokens.ADD_DIAGNOSIS_COMMAND_HANDLER || 'AddDiagnosisCommandHandler');
      const addMedicationHandler = container.resolve(ServiceTokens.ADD_MEDICATION_COMMAND_HANDLER || 'AddMedicationCommandHandler');

      // Query Handlers
      const getDetailsQueryHandler = container.resolve(ServiceTokens.GET_MEDICAL_RECORD_DETAILS_QUERY_HANDLER || 'GetMedicalRecordDetailsQueryHandler');

      return new ClinicalEMRApplicationService(
        createUseCase,
        updateUseCase,
        getUseCase,
        getPatientRecordsUseCase,
        generateReportUseCase,
        searchUseCase,
        addDiagnosisHandler,
        addMedicationHandler,
        getDetailsQueryHandler
      );
    }) as any,
    ServiceLifetime.SCOPED
  );
}
