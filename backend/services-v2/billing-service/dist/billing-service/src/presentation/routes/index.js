"use strict";
/**
 * Routes Setup - Presentation Layer
 * Central routing configuration for Billing Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
exports.setupRoutesWithConfig = setupRoutesWithConfig;
const express_1 = require("express");
const setup_1 = require("../../infrastructure/di/setup");
const billingRoutes_1 = require("./billingRoutes");
const middleware_1 = require("../middleware");
/**
 * Setup all application routes
 */
function setupRoutes(app, container) {
    // Apply global middleware
    app.use(middleware_1.corsMiddleware);
    app.use(middleware_1.requestLoggingMiddleware);
    app.use(middleware_1.auditMiddleware);
    // API v1 Router
    const apiV1Router = (0, express_1.Router)();
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
                "Revenue Reports"
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
            description: "Billing and Payment Management Service for Hospital Management System",
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
                    finalize: true,
                    cancel: true,
                    search: true,
                },
                paymentProcessing: {
                    cash: true,
                    card: true,
                    bankTransfer: true,
                    payos: true,
                    insuranceDirect: true,
                    refund: true,
                },
                insuranceClaims: {
                    bhyt: true,
                    bhtn: true,
                    autoApprove: true,
                },
                reporting: {
                    revenue: true,
                    billingHistory: true,
                    patientSummary: true,
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
            }
            else {
                res.status(503).json({
                    status: "not ready",
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            res.status(503).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            });
        }
    });
    // Get controllers from DI container
    const billingController = container.resolve(setup_1.ServiceTokens.BILLING_CONTROLLER);
    // Setup billing routes
    const billingRoutes = (0, billingRoutes_1.createBillingRoutes)(billingController);
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
    app.use(middleware_1.errorHandler);
}
/**
 * Setup routes with custom configuration
 */
function setupRoutesWithConfig(app, container, config) {
    const basePath = config?.basePath || "/api/v1";
    // Apply global middleware
    app.use(middleware_1.corsMiddleware);
    app.use(middleware_1.requestLoggingMiddleware);
    app.use(middleware_1.auditMiddleware);
    // API Router
    const apiRouter = (0, express_1.Router)();
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
    const billingController = container.resolve(setup_1.ServiceTokens.BILLING_CONTROLLER);
    // Setup billing routes
    const billingRoutes = (0, billingRoutes_1.createBillingRoutes)(billingController);
    apiRouter.use("/", billingRoutes);
    // Mount API router
    app.use(basePath, apiRouter);
    // Error handler
    app.use(middleware_1.errorHandler);
}
/**
 * Export default setup function
 */
exports.default = setupRoutes;
//# sourceMappingURL=index.js.map