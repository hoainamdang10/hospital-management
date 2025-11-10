"use strict";
/**
 * Billing Service - Hospital Management System
 * Clean Architecture + DDD + CQRS + Event-Driven Implementation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @port 3029
 * @schema billing_schema
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const supabase_js_1 = require("@supabase/supabase-js");
const container_1 = require("../../shared/infrastructure/di/container");
const setup_1 = require("./infrastructure/di/setup");
const routes_1 = require("./presentation/routes");
const healthRoutes_1 = require("./presentation/routes/healthRoutes");
const logger_1 = require("./infrastructure/logging/logger");
const PrometheusMetrics_1 = require("./infrastructure/monitoring/PrometheusMetrics");
const swagger_config_1 = require("./infrastructure/swagger/swagger.config");
const SupabaseOutboxRepository_1 = require("./infrastructure/outbox/SupabaseOutboxRepository");
const OutboxPublisherWorker_1 = require("./infrastructure/outbox/OutboxPublisherWorker");
const RabbitMQPublisher_1 = require("./infrastructure/messaging/RabbitMQPublisher");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3029;
// Create DI container
const container = new container_1.DIContainer({
    enableHealthcareCompliance: true,
    enableHealthChecks: true,
    enableMetrics: true
});
// Setup dependencies
(0, setup_1.setupDependencies)(container);
// =====================================================
// OUTBOX PATTERN SETUP
// =====================================================
// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'billing_schema' },
});
// Initialize Outbox Repository
const outboxRepository = new SupabaseOutboxRepository_1.SupabaseOutboxRepository(supabaseClient, logger_1.logger);
// Initialize RabbitMQ Publisher
const rabbitmqPublisher = new RabbitMQPublisher_1.RabbitMQPublisher({
    url: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673',
    exchangeName: process.env.RABBITMQ_EXCHANGE || 'hospital.events',
    routingKeyPrefix: 'billing',
}, logger_1.logger);
// Initialize Outbox Worker
const outboxWorker = new OutboxPublisherWorker_1.OutboxPublisherWorker(outboxRepository, supabaseClient, logger_1.logger, (event) => rabbitmqPublisher.publish(event), {
    enabled: process.env.OUTBOX_WORKER_ENABLED !== 'false',
    pollingIntervalMs: parseInt(process.env.OUTBOX_POLLING_INTERVAL || '5000'),
    batchSize: parseInt(process.env.OUTBOX_BATCH_SIZE || '50'),
});
// Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:", "cdn.jsdelivr.net"],
            fontSrc: ["'self'", "data:", "cdn.jsdelivr.net"]
        }
    }
}));
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health & Metrics routes
const healthRoutes = (0, healthRoutes_1.createHealthRoutes)(container);
app.use('/', healthRoutes);
// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
        const metrics = await PrometheusMetrics_1.prometheusMetrics.getMetrics();
        res.send(metrics);
    }
    catch (error) {
        logger_1.logger.error('Failed to generate Prometheus metrics', { error });
        res.status(500).send('Failed to generate metrics');
    }
});
logger_1.logger.info('Prometheus metrics endpoint registered at /metrics');
// Swagger API Documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_config_1.swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Billing Service API Documentation',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true
    }
}));
// OpenAPI JSON spec
app.get('/api-docs/json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swagger_config_1.swaggerSpec);
});
logger_1.logger.info('Swagger UI available at http://localhost:' + PORT + '/api-docs');
// Setup routes
(0, routes_1.setupRoutes)(app, container);
// Error handling
app.use((error, req, res, next) => {
    logger_1.logger.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});
// Start server
const serviceName = 'Billing Service';
const features = ["Invoices", "Payments", "Insurance Claims", "PayOS Integration"];
const patterns = ["Strategy", "Outbox", "Payment Gateway"];
const server = app.listen(PORT, async () => {
    logger_1.logger.info(`🏥 ${serviceName} started on port ${PORT}`);
    logger_1.logger.info(`📋 Features: ${features.join(', ')}`);
    logger_1.logger.info(`🎯 Patterns: ${patterns.join(', ')}`);
    // Start Outbox Worker
    try {
        await rabbitmqPublisher.connect();
        await outboxWorker.start();
        logger_1.logger.info('✅ Outbox Worker started successfully');
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to start Outbox Worker', { error });
    }
});
// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================
const gracefulShutdown = async (signal) => {
    logger_1.logger.info(`${signal} received. Starting graceful shutdown...`);
    // Stop accepting new requests
    server.close(async () => {
        logger_1.logger.info('HTTP server closed');
        try {
            // Stop Outbox Worker
            await outboxWorker.stop();
            logger_1.logger.info('Outbox Worker stopped');
            // Disconnect RabbitMQ
            await rabbitmqPublisher.disconnect();
            logger_1.logger.info('RabbitMQ disconnected');
            logger_1.logger.info('✅ Graceful shutdown completed');
            process.exit(0);
        }
        catch (error) {
            logger_1.logger.error('Error during shutdown', { error });
            process.exit(1);
        }
    });
    // Force shutdown after 30 seconds
    setTimeout(() => {
        logger_1.logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
};
// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Handle uncaught errors
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception', { error });
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection', { reason, promise });
    gracefulShutdown('UNHANDLED_REJECTION');
});
exports.default = app;
//# sourceMappingURL=index.js.map