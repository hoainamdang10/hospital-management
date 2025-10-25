"use strict";
/**
 * Clinical/EMR Service - Hospital Management System
 * Clean Architecture + DDD + CQRS + Event-Driven Implementation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @port 3027
 * @schema clinical_schema
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const container_1 = require("@shared/infrastructure/di/container");
const setup_1 = require("./infrastructure/di/setup");
const routes_1 = require("./presentation/routes");
const logger_1 = require("./infrastructure/logging/logger");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3027;
// Create DI container
const container = new container_1.DIContainer({
    enableHealthcareCompliance: true,
    enableHealthChecks: true,
    enableMetrics: true
});
// Setup dependencies
(0, setup_1.setupDependencies)(container);
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Setup routes
(0, routes_1.setupRoutes)(app, container);
// Health check
app.get('/health', async (req, res) => {
    try {
        const healthStatus = await container.getServiceHealth();
        res.json({
            service: 'clinical-emr-service',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            port: PORT,
            features: ["Medical Records", "Encounters", "Diagnoses", "Prescriptions"],
            patterns: ["Medical Workflow", "FHIR Compliance", "Audit Trail"],
            services: healthStatus
        });
    }
    catch (error) {
        res.status(503).json({
            service: 'clinical-emr-service',
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Error handling
app.use((error, req, res, next) => {
    logger_1.logger.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});
// Start server
app.listen(PORT, () => {
    logger_1.logger.info(`🏥 Clinical EMR Service started on port ${PORT}`);
    logger_1.logger.info('📋 Features: Medical Records, Encounters, Diagnoses, Prescriptions');
    logger_1.logger.info('🎯 Patterns: Medical Workflow, FHIR Compliance, Audit Trail');
});
exports.default = app;
//# sourceMappingURL=index.js.map