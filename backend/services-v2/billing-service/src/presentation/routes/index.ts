/**
 * Routes Setup - Presentation Layer
 * Central routing configuration for Billing Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API Standards
 */

import { Express, Router } from "express";
import { DIContainer } from "../../../../shared/infrastructure/di/container";
import { BillingController } from "../controllers/BillingController";
import { ServiceTokens } from "../../infrastructure/di/setup";
import { createBillingRoutes } from "./billingRoutes";
import {
  corsMiddleware,
  requestLoggingMiddleware,
  errorHandler,
  auditMiddleware
} from "../middleware";

/**
 * Setup all application routes
 */
export function setupRoutes(app: Express, container: DIContainer): void {
  // Apply global middleware
  app.use(corsMiddleware);
  app.use(requestLoggingMiddleware);
  app.use(auditMiddleware);

  // API v1 Router
  const apiV1Router = Router();

  // Health check endpoint (public)
  apiV1Router.get("/health", (req, res) => {
    res.json({
      service: "billing-service",
      status: "healthy",
      version: "2.0.0",
      timestamp: new Date().toISOString(),
      port: process.env.PORT || 3029,
      environment: process.env.NODE_ENV || "development",
      features: [
        "Invoices",
        "Payments",
        "Insurance Claims",
        "PayOS Integration",
        "BHYT/BHTN Support",
        "Vietnamese Tax Compliance",
      ],
      patterns: [
        "Clean Architecture",
        "DDD",
        "CQRS",
        "Event-Driven",
        "Outbox Pattern",
        "Saga Pattern",
      ],
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: "MB",
      },
    });
  });

  // API info endpoint (public)
  apiV1Router.get("/info", (req, res) => {
    res.json({
      service: "billing-service",
      version: "2.0.0",
      description:
        "Billing and Payment Management Service for Hospital Management System",
      apiVersion: "v1",
      documentation: "/api/v1/docs",
      endpoints: {
        invoices: "/api/v1/invoices",
        payments: "/api/v1/payments",
        insuranceClaims: "/api/v1/insurance-claims",
        payos: "/api/v1/payos",
        reports: "/api/v1/reports",
        statistics: "/api/v1/statistics",
        health: "/api/v1/health",
      },
      features: {
        invoiceManagement: {
          create: true,
          update: true,
          delete: true,
          search: true,
          pdf: true,
          templates: true,
        },
        paymentProcessing: {
          cash: true,
          card: true,
          bankTransfer: true,
          payos: true,
          insuranceDirect: true,
        },
        insuranceClaims: {
          bhyt: true,
          bhtn: true,
          private: true,
          automation: true,
        },
        reporting: {
          revenue: true,
          outstanding: true,
          claims: true,
          trends: true,
          tax: true,
        },
      },
    });
  });

  // Ready check endpoint (public)
  apiV1Router.get("/ready", async (req, res) => {
    try {
      // Check if dependencies are ready
      const isReady = container.isInitialized();

      if (isReady) {
        res.status(200).json({
          status: "ready",
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(503).json({
          status: "not ready",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      res.status(503).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Get BillingController from DI container
  const billingController =
    container.resolve<BillingController>(ServiceTokens.BILLING_CONTROLLER);

  // Setup billing routes
  const billingRoutes = createBillingRoutes(billingController);
  apiV1Router.use("/", billingRoutes);

  // Mount API v1 router
  app.use("/api/v1", apiV1Router);

  // Root redirect to API info
  app.get("/", (req, res) => {
    res.redirect("/api/v1/info");
  });

  // API documentation redirect
  app.get("/docs", (req, res) => {
    res.redirect("/api/v1/docs");
  });

  // 404 handler for unknown routes
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: "Not Found",
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
      service: "billing-service",
      availableEndpoints: {
        health: "/api/v1/health",
        info: "/api/v1/info",
        docs: "/api/v1/docs",
        invoices: "/api/v1/invoices",
        payments: "/api/v1/payments",
        insuranceClaims: "/api/v1/insurance-claims",
      },
    });
  });

  // Global error handler (must be last)
  app.use(errorHandler);
}

/**
 * Setup routes with custom configuration
 */
export function setupRoutesWithConfig(
  app: Express,
  container: DIContainer,
  config?: {
    basePath?: string;
    enableDocs?: boolean;
    enableMetrics?: boolean;
    enableSwagger?: boolean;
  },
): void {
  const basePath = config?.basePath || "/api/v1";

  // Apply global middleware
  app.use(corsMiddleware);
  app.use(requestLoggingMiddleware);
  app.use(auditMiddleware);

  // API Router
  const apiRouter = Router();

  // Health check
  apiRouter.get("/health", (req, res) => {
    res.json({
      service: "billing-service",
      status: "healthy",
      version: "2.0.0",
      timestamp: new Date().toISOString(),
    });
  });

  // Get controller from container
  const billingController =
    container.resolve<BillingController>(ServiceTokens.BILLING_CONTROLLER);

  // Setup billing routes
  const billingRoutes = createBillingRoutes(billingController);
  apiRouter.use("/", billingRoutes);

  // Mount API router
  app.use(basePath, apiRouter);

  // Error handler
  app.use(errorHandler);
}

/**
 * Export default setup function
 */
export default setupRoutes;
