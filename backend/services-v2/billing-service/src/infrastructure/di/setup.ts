/**
 * Dependency Injection Setup - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Billing Service DI Container Configuration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Dependency Injection
 */

import {
  OptimizedSupabaseClient,
  OptimizedSupabaseClientConfig,
} from "../../../../shared/infrastructure/database/optimized-supabase-client";
import {
  DIContainer,
  ServiceLifetime,
} from "../../../../shared/infrastructure/di/container";
import { ILogger } from "../../../../shared/infrastructure/logging/logger.interface";
import { IAuditService } from "../../../../shared/application/services/audit.service.interface";
import { ConsoleLogger } from "../../../../shared/infrastructure/logging/console-logger";
import { AuditService } from "../../../../shared/infrastructure/services/audit.service";

// Application Layer
import { BillingApplicationService } from "../../application/services/BillingApplicationService";
import { CreateInvoiceUseCase } from "../../application/use-cases/CreateInvoiceUseCase";
import { ProcessPaymentUseCase } from "../../application/use-cases/ProcessPaymentUseCase";
import { RefundPaymentUseCase } from "../../application/use-cases/RefundPaymentUseCase";
import { GetBillingHistoryUseCase } from "../../application/use-cases/GetBillingHistoryUseCase";
import { GetInvoiceUseCase } from "../../application/use-cases/GetInvoiceUseCase";
import { BillingCommandHandlers } from "../../application/handlers/BillingCommandHandlers";
import { BillingQueryHandlers } from "../../application/handlers/BillingQueryHandlers";
import { PayOSIntegrationService } from "../../application/services/PayOSIntegrationService";

// Infrastructure Layer
import { SupabaseBillingRepository } from "../persistence/SupabaseBillingRepository";
import { PayOSGatewayService } from "../external/PayOSGatewayService";
import { SupabaseEventBus } from "../messaging/SupabaseEventBus";
import { BillingDomainEventHandler } from "../events/BillingDomainEventHandler";
import { BillingEventHandler } from "../events/BillingEventHandler";

// Service Tokens
export const ServiceTokens = {
  // Infrastructure
  SUPABASE_CLIENT: "SupabaseClient",
  LOGGER: "Logger",
  AUDIT_SERVICE: "AuditService",
  EVENT_BUS: "EventBus",

  // Repositories
  BILLING_REPOSITORY: "BillingRepository",

  // External Services
  PAYOS_GATEWAY_SERVICE: "PayOSGatewayService",
  PAYOS_INTEGRATION_SERVICE: "PayOSIntegrationService",

  // Use Cases
  CREATE_INVOICE_USE_CASE: "CreateInvoiceUseCase",
  PROCESS_PAYMENT_USE_CASE: "ProcessPaymentUseCase",
  REFUND_PAYMENT_USE_CASE: "RefundPaymentUseCase",
  GET_BILLING_HISTORY_USE_CASE: "GetBillingHistoryUseCase",
  GET_INVOICE_USE_CASE: "GetInvoiceUseCase",
  GET_PATIENT_OUTSTANDING_BALANCE_USE_CASE: "GetPatientOutstandingBalanceUseCase",
  DOWNLOAD_INVOICE_USE_CASE: "DownloadInvoiceUseCase",

  // Handlers
  BILLING_COMMAND_HANDLERS: "BillingCommandHandlers",
  BILLING_QUERY_HANDLERS: "BillingQueryHandlers",

  // Event Handlers
  BILLING_DOMAIN_EVENT_HANDLER: "BillingDomainEventHandler",
  BILLING_EVENT_HANDLER: "BillingEventHandler",

  // Application Services
  BILLING_APPLICATION_SERVICE: "BillingApplicationService",

  // Controllers
  BILLING_CONTROLLER: "BillingController",
} as const;

export function setupDependencies(container: DIContainer): void {
  // Register infrastructure services
  container.register(
    ServiceTokens.LOGGER,
    () => new ConsoleLogger('billing-service'),
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
        serviceName: "billing-service",
        schemaName: "billing_schema",
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
    ServiceTokens.BILLING_REPOSITORY,
    (container) => {
      const supabaseClient = container.resolve(ServiceTokens.SUPABASE_CLIENT);
      const logger = container.resolve(ServiceTokens.LOGGER);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);

      return new SupabaseBillingRepository({
        supabase: supabaseClient,
        logger,
        auditService,
        schema: 'billing_schema',
        tableName: 'invoices'
      });
    },
    ServiceLifetime.SCOPED
  );

  // Register external services
  container.register(
    ServiceTokens.PAYOS_INTEGRATION_SERVICE,
    (container) => {
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new PayOSIntegrationService(
        process.env.PAYOS_API_URL || 'https://api-merchant.payos.vn',
        process.env.PAYOS_CLIENT_ID || '',
        process.env.PAYOS_API_KEY || '',
        process.env.PAYOS_CHECKSUM_KEY || ''
      );
    },
    ServiceLifetime.SINGLETON
  );

  container.register(
    ServiceTokens.PAYOS_GATEWAY_SERVICE,
    (container) => {
      const logger = container.resolve(ServiceTokens.LOGGER);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);

      return new PayOSGatewayService({
        payosConfig: {
          apiUrl: process.env.PAYOS_API_URL || 'https://api-merchant.payos.vn',
          clientId: process.env.PAYOS_CLIENT_ID || '',
          apiKey: process.env.PAYOS_API_KEY || '',
          checksumKey: process.env.PAYOS_CHECKSUM_KEY || '',
          environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production',
          webhookUrl: process.env.PAYOS_WEBHOOK_URL || '',
          returnUrl: process.env.PAYOS_RETURN_URL || '',
          cancelUrl: process.env.PAYOS_CANCEL_URL || ''
        },
        logger,
        auditService
      });
    },
    ServiceLifetime.SCOPED
  );

  // Register use cases
  container.register(
    ServiceTokens.CREATE_INVOICE_USE_CASE,
    (container) => {
      const repository = container.resolve(ServiceTokens.BILLING_REPOSITORY);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new CreateInvoiceUseCase(repository, eventBus, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.register(
    ServiceTokens.PROCESS_PAYMENT_USE_CASE,
    (container) => {
      const repository = container.resolve(ServiceTokens.BILLING_REPOSITORY);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new ProcessPaymentUseCase(repository, eventBus, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.register(
    ServiceTokens.REFUND_PAYMENT_USE_CASE,
    (container) => {
      const repository = container.resolve(ServiceTokens.BILLING_REPOSITORY);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new RefundPaymentUseCase(repository, eventBus, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.register(
    ServiceTokens.GET_BILLING_HISTORY_USE_CASE,
    (container) => {
      const repository = container.resolve(ServiceTokens.BILLING_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new GetBillingHistoryUseCase(repository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.register(
    ServiceTokens.GET_INVOICE_USE_CASE,
    (container) => {
      const repository = container.resolve(ServiceTokens.BILLING_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new GetInvoiceUseCase(repository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.register(
    ServiceTokens.GET_PATIENT_OUTSTANDING_BALANCE_USE_CASE,
    (container) => {
      const { GetPatientOutstandingBalanceUseCase } = require('../../application/use-cases/GetPatientOutstandingBalanceUseCase');
      const repository = container.resolve(ServiceTokens.BILLING_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new GetPatientOutstandingBalanceUseCase(repository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  container.register(
    ServiceTokens.DOWNLOAD_INVOICE_USE_CASE,
    (container) => {
      const { DownloadInvoiceUseCase } = require('../../application/use-cases/DownloadInvoiceUseCase');
      const repository = container.resolve(ServiceTokens.BILLING_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new DownloadInvoiceUseCase(repository, logger);
    },
    ServiceLifetime.TRANSIENT
  );

  // Register handlers
  container.register(
    ServiceTokens.BILLING_COMMAND_HANDLERS,
    (container) => {
      const createUseCase = container.resolve(ServiceTokens.CREATE_INVOICE_USE_CASE);
      const processPaymentUseCase = container.resolve(ServiceTokens.PROCESS_PAYMENT_USE_CASE);
      const refundUseCase = container.resolve(ServiceTokens.REFUND_PAYMENT_USE_CASE);
      const repository = container.resolve(ServiceTokens.BILLING_REPOSITORY);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new BillingCommandHandlers(
        createUseCase,
        processPaymentUseCase,
        refundUseCase,
        repository,
        eventBus,
        logger
      );
    },
    ServiceLifetime.SCOPED
  );

  container.register(
    ServiceTokens.BILLING_QUERY_HANDLERS,
    (container) => {
      const getBillingHistoryUseCase = container.resolve(ServiceTokens.GET_BILLING_HISTORY_USE_CASE);
      const repository = container.resolve(ServiceTokens.BILLING_REPOSITORY);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new BillingQueryHandlers(
        getBillingHistoryUseCase,
        repository,
        logger
      );
    },
    ServiceLifetime.SCOPED
  );

  // Register event handlers
  container.register(
    ServiceTokens.BILLING_DOMAIN_EVENT_HANDLER,
    (container) => {
      const logger = container.resolve(ServiceTokens.LOGGER);
      const auditService = container.resolve(ServiceTokens.AUDIT_SERVICE);
      const eventBus = container.resolve(ServiceTokens.EVENT_BUS);

      return new BillingDomainEventHandler({
        logger,
        auditService,
        eventBus
      });
    },
    ServiceLifetime.SCOPED
  );

  container.register(
    ServiceTokens.BILLING_EVENT_HANDLER,
    (container) => {
      const generateInvoiceUseCase = container.resolve('GenerateInvoiceUseCase'); // Legacy use case
      const processPaymentUseCase = container.resolve(ServiceTokens.PROCESS_PAYMENT_USE_CASE);
      const validateInsuranceUseCase = container.resolve('ValidateInsuranceUseCase'); // Legacy use case
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new BillingEventHandler(
        generateInvoiceUseCase,
        processPaymentUseCase,
        validateInsuranceUseCase,
        logger
      );
    },
    ServiceLifetime.SCOPED
  );

  // Register application services
  container.register(
    ServiceTokens.BILLING_APPLICATION_SERVICE,
    (container) => {
      const createUseCase = container.resolve(ServiceTokens.CREATE_INVOICE_USE_CASE);
      const processPaymentUseCase = container.resolve(ServiceTokens.PROCESS_PAYMENT_USE_CASE);
      const refundUseCase = container.resolve(ServiceTokens.REFUND_PAYMENT_USE_CASE);
      const getBillingHistoryUseCase = container.resolve(ServiceTokens.GET_BILLING_HISTORY_USE_CASE);
      const commandHandlers = container.resolve(ServiceTokens.BILLING_COMMAND_HANDLERS);
      const queryHandlers = container.resolve(ServiceTokens.BILLING_QUERY_HANDLERS);
      const payosService = container.resolve(ServiceTokens.PAYOS_INTEGRATION_SERVICE);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new BillingApplicationService({
        createInvoiceUseCase: createUseCase,
        processPaymentUseCase,
        refundPaymentUseCase: refundUseCase,
        getBillingHistoryUseCase,
        commandHandlers,
        queryHandlers,
        payosService,
        logger
      });
    },
    ServiceLifetime.SCOPED
  );

  // Register controllers
  container.register(
    ServiceTokens.BILLING_CONTROLLER,
    (container) => {
      const { BillingController } = require('../../presentation/controllers/BillingController');
      const createInvoiceUseCase = container.resolve(ServiceTokens.CREATE_INVOICE_USE_CASE);
      const processPaymentUseCase = container.resolve(ServiceTokens.PROCESS_PAYMENT_USE_CASE);
      const refundPaymentUseCase = container.resolve(ServiceTokens.REFUND_PAYMENT_USE_CASE);
      const getInvoiceUseCase = container.resolve(ServiceTokens.GET_INVOICE_USE_CASE);
      const getBillingHistoryUseCase = container.resolve(ServiceTokens.GET_BILLING_HISTORY_USE_CASE);
      const getPatientOutstandingBalanceUseCase = container.resolve(ServiceTokens.GET_PATIENT_OUTSTANDING_BALANCE_USE_CASE);
      const downloadInvoiceUseCase = container.resolve(ServiceTokens.DOWNLOAD_INVOICE_USE_CASE);
      const logger = container.resolve(ServiceTokens.LOGGER);

      return new BillingController({
        createInvoiceUseCase,
        processPaymentUseCase,
        refundPaymentUseCase,
        getInvoiceUseCase,
        getBillingHistoryUseCase,
        getPatientOutstandingBalanceUseCase,
        downloadInvoiceUseCase,
        logger
      });
    },
    ServiceLifetime.SCOPED
  );
}
