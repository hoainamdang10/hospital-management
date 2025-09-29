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
} from "../../../shared/infrastructure/database/optimized-supabase-client";
import {
  DIContainer,
  ServiceLifetime,
} from "../../../shared/infrastructure/di/container";
import { ILogger } from "../../../shared/infrastructure/logging/logger.interface";
import { IAuditService } from "../../../shared/application/services/audit.service.interface";
import { ConsoleLogger } from "../../../shared/infrastructure/logging/console-logger";
import { AuditService } from "../../../shared/infrastructure/services/audit.service";

// Application Layer
import { ClinicalEMRApplicationService } from "../../application/services/ClinicalEMRApplicationService";
import { CreateMedicalRecordUseCase } from "../../application/use-cases/CreateMedicalRecordUseCase";
import { UpdateMedicalRecordUseCase } from "../../application/use-cases/UpdateMedicalRecordUseCase";
import { GetMedicalRecordUseCase } from "../../application/use-cases/GetMedicalRecordUseCase";
import { SearchMedicalRecordsUseCase } from "../../application/use-cases/SearchMedicalRecordsUseCase";
import { GenerateMedicalReportUseCase } from "../../application/use-cases/GenerateMedicalReportUseCase";
import { ExportToFHIRUseCase } from "../../application/use-cases/ExportToFHIRUseCase";

// Infrastructure Layer
import { SupabaseMedicalRecordRepository } from "../persistence/SupabaseMedicalRecordRepository";
import { FHIRExportService } from "../external/FHIRExportService";
import { SupabaseEventBus } from "../messaging/SupabaseEventBus";
import { MedicalRecordDomainEventHandler } from "../events/MedicalRecordDomainEventHandler";
import { ClinicalEMREventHandler } from "../events/ClinicalEMREventHandler";

// Service Tokens
export const ServiceTokens = {
  // Infrastructure
  SUPABASE_CLIENT: "SupabaseClient",
  LOGGER: "Logger",
  AUDIT_SERVICE: "AuditService",
  EVENT_BUS: "EventBus",

  // Repositories
  MEDICAL_RECORD_REPOSITORY: "MedicalRecordRepository",

  // External Services
  FHIR_EXPORT_SERVICE: "FHIRExportService",

  // Use Cases
  CREATE_MEDICAL_RECORD_USE_CASE: "CreateMedicalRecordUseCase",
  UPDATE_MEDICAL_RECORD_USE_CASE: "UpdateMedicalRecordUseCase",
  GET_MEDICAL_RECORD_USE_CASE: "GetMedicalRecordUseCase",
  SEARCH_MEDICAL_RECORDS_USE_CASE: "SearchMedicalRecordsUseCase",
  GENERATE_MEDICAL_REPORT_USE_CASE: "GenerateMedicalReportUseCase",
  EXPORT_TO_FHIR_USE_CASE: "ExportToFHIRUseCase",

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
    () => new ConsoleLogger('clinical-emr-service'),
    ServiceLifetime.SINGLETON
  );

  container.register(
    ServiceTokens.AUDIT_SERVICE,
    (container) => {
      const logger = container.resolve(ServiceTokens.LOGGER);
      return new AuditService({ logger });
    },
    ServiceLifetime.SINGLETON
  );

  // Register Supabase client
  container.register(
    ServiceTokens.SUPABASE_CLIENT,
    () => {
      const config: OptimizedSupabaseClientConfig = {
        supabaseUrl: process.env.SUPABASE_URL || "",
        supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        serviceName: "clinical-emr-service",
        schemaName: "clinical_schema",
        enableOptimizations: true,
      };
      return new OptimizedSupabaseClient(config);
    },
    ServiceLifetime.SINGLETON
  );

  // Register event bus
  container.register(
    ServiceTokens.EVENT_BUS,
    (container) => {
      const supabaseClient = container.resolve(ServiceTokens.SUPABASE_CLIENT);
      const logger = container.resolve(ServiceTokens.LOGGER);
      return new SupabaseEventBus({ supabase: supabaseClient, logger });
    },
    ServiceLifetime.SCOPED
  );

  // Register repositories
  container.register(
    ServiceTokens.MEDICAL_RECORD_REPOSITORY,
    (container) => {
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
    },
    ServiceLifetime.SCOPED
  );

  // Register external services
  container.register(
    ServiceTokens.FHIR_EXPORT_SERVICE,
    (container) => {
      const logger = container.resolve(ServiceTokens.LOGGER);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);

      return new FHIRExportService({
        logger,
        auditService,
        fhirVersion: '4.0.1',
        validateByDefault: true,
        includeVietnameseExtensions: true
      });
    },
    ServiceLifetime.SCOPED
  );

  // Register use cases
  container.register(
    ServiceTokens.CREATE_MEDICAL_RECORD_USE_CASE,
    (container) => {
      const repository = container.resolve(ServiceTokens.MEDICAL_RECORD_REPOSITORY);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new CreateMedicalRecordUseCase(repository, eventBus, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.register(
    ServiceTokens.UPDATE_MEDICAL_RECORD_USE_CASE,
    (container) => {
      const repository = container.resolve(ServiceTokens.MEDICAL_RECORD_REPOSITORY);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new UpdateMedicalRecordUseCase(repository, eventBus, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.register(
    ServiceTokens.GET_MEDICAL_RECORD_USE_CASE,
    (container) => {
      const repository = container.resolve(ServiceTokens.MEDICAL_RECORD_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new GetMedicalRecordUseCase(repository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.register(
    ServiceTokens.SEARCH_MEDICAL_RECORDS_USE_CASE,
    (container) => {
      const repository = container.resolve(ServiceTokens.MEDICAL_RECORD_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new SearchMedicalRecordsUseCase(repository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.register(
    ServiceTokens.GENERATE_MEDICAL_REPORT_USE_CASE,
    (container) => {
      const repository = container.resolve(ServiceTokens.MEDICAL_RECORD_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new GenerateMedicalReportUseCase(repository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.register(
    ServiceTokens.EXPORT_TO_FHIR_USE_CASE,
    (container) => {
      const repository = container.resolve(ServiceTokens.MEDICAL_RECORD_REPOSITORY);
      const fhirService = container.resolve(ServiceTokens.FHIR_EXPORT_SERVICE);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new ExportToFHIRUseCase(repository, fhirService, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  // Register event handlers
  container.register(
    ServiceTokens.MEDICAL_RECORD_DOMAIN_EVENT_HANDLER,
    (container) => {
      const logger = container.resolve(ServiceTokens.LOGGER);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);

      return new MedicalRecordDomainEventHandler({
        logger,
        auditService,
        eventBus
      });
    },
    ServiceLifetime.SCOPED
  );

  container.register(
    ServiceTokens.CLINICAL_EMR_EVENT_HANDLER,
    (container) => {
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
    },
    ServiceLifetime.SCOPED
  );

  // Register application services
  container.register(
    ServiceTokens.CLINICAL_EMR_APPLICATION_SERVICE,
    (container) => {
      const createUseCase = container.resolve(ServiceTokens.CREATE_MEDICAL_RECORD_USE_CASE);
      const updateUseCase = container.resolve(ServiceTokens.UPDATE_MEDICAL_RECORD_USE_CASE);
      const getUseCase = container.resolve(ServiceTokens.GET_MEDICAL_RECORD_USE_CASE);
      const searchUseCase = container.resolve(ServiceTokens.SEARCH_MEDICAL_RECORDS_USE_CASE);
      const generateReportUseCase = container.resolve(ServiceTokens.GENERATE_MEDICAL_REPORT_USE_CASE);
      const exportFhirUseCase = container.resolve(ServiceTokens.EXPORT_TO_FHIR_USE_CASE);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new ClinicalEMRApplicationService(
        createUseCase,
        updateUseCase,
        getUseCase,
        searchUseCase,
        generateReportUseCase,
        exportFhirUseCase,
        logger
      );
    },
    ServiceLifetime.SCOPED
  );
}
