"use strict";
/**
 * Identity Service - Main Application (Refactored)
 * Production-ready service with modular bootstrap architecture
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Production-Ready, HIPAA-Compliant
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = bootstrap;
// Load environment variables first
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_config_1 = require("./infrastructure/swagger/swagger.config");
// Bootstrap modules
const bootstrap_1 = require("./bootstrap");
// Routes
const routes_1 = require("./presentation/routes");
// Monitoring
const PrometheusMetrics_1 = require("./infrastructure/monitoring/PrometheusMetrics");
/**
 * Bootstrap application
 * Orchestrates service initialization using modular bootstrap architecture
 */
async function bootstrap() {
    // Step 1: Load configuration
    const config = (0, bootstrap_1.loadConfig)();
    // Step 2: Create logger
    const logger = (0, bootstrap_1.createLogger)(config);
    logger.info('Starting Identity Service...', {
        version: '2.0.0',
        nodeEnv: config.nodeEnv,
        port: config.port
    });
    try {
        // Step 3: Validate configuration (fail-fast)
        logger.info('Validating configuration...');
        const validationMode = config.nodeEnv === 'production'
            ? bootstrap_1.ValidationMode.STRICT
            : bootstrap_1.ValidationMode.DEVELOPMENT;
        (0, bootstrap_1.validateConfig)(logger, validationMode);
        logger.info('Configuration validated successfully', { mode: validationMode });
        // Step 4: Build dependency container
        logger.info('Building dependency container...');
        const container = await (0, bootstrap_1.buildContainer)(config, logger);
        logger.info('Dependency container built successfully');
        // Step 5: Build Express application
        logger.info('Building Express application...');
        const app = (0, bootstrap_1.buildExpressApp)(config, logger);
        logger.info('Express application built successfully');
        // Step 6: Register API routes
        logger.info('Registering API routes...');
        const routeDependencies = container.getRouteDependencies();
        (0, routes_1.registerRoutes)(app, routeDependencies);
        logger.info('API routes registered successfully');
        // Step 7: Register protected endpoints (metrics & docs)
        const metricsAuth = (0, bootstrap_1.createMetricsAuth)(config, logger);
        // Prometheus metrics endpoint (protected)
        app.get('/metrics', metricsAuth, async (_req, res) => {
            try {
                res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
                const metrics = await PrometheusMetrics_1.prometheusMetrics.getMetrics();
                res.send(metrics);
            }
            catch (error) {
                logger.error('Failed to generate metrics', { error });
                res.status(500).send('Failed to generate metrics');
            }
        });
        logger.info('Prometheus metrics endpoint registered at /metrics (protected)');
        // Swagger API Documentation
        // Accessible at: http://localhost:3021/api-docs
        app.use('/api-docs', swagger_ui_express_1.default.serve);
        app.get('/api-docs', swagger_ui_express_1.default.setup(swagger_config_1.swaggerSpec, {
            customSiteTitle: 'Identity Service API',
            customCss: '.swagger-ui .topbar { display: none }',
            swaggerOptions: {
                persistAuthorization: true,
                displayRequestDuration: true,
                filter: true,
                tryItOutEnabled: true
            }
        }));
        // OpenAPI JSON spec
        app.get('/api-docs/json', (_req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(swagger_config_1.swaggerSpec);
        });
        logger.info('Swagger UI available at http://localhost:' + config.port + '/api-docs');
        // Step 8: Register error handlers (MUST be last)
        logger.info('Registering error handlers...');
        (0, bootstrap_1.registerErrorHandlers)(app, logger);
        // Step 9: Start HTTP server
        logger.info('Starting HTTP server...');
        const server = await (0, bootstrap_1.startServer)(app, config.port, logger);
        logger.info(`Identity Service started successfully on port ${config.port}`);
        // Step 10: Start event consumers
        logger.info('Starting event consumers...');
        await container.startEventConsumers();
        logger.info('Event consumers started successfully');
        // Step 11: Setup graceful shutdown
        logger.info('Setting up graceful shutdown...');
        const cleanup = (0, bootstrap_1.createCleanupFunction)([
            {
                name: 'Event Consumers',
                cleanup: async () => {
                    await container.stopEventConsumers();
                }
            },
            {
                name: 'Dependency Container',
                cleanup: async () => {
                    await container.cleanup();
                }
            }
        ], logger);
        (0, bootstrap_1.setupGracefulShutdown)(server, cleanup, logger);
        logger.info('Graceful shutdown configured');
        logger.info('Identity Service is ready to accept requests', {
            port: config.port,
            environment: config.nodeEnv,
            healthCheck: `http://localhost:${config.port}/health`,
            apiDocs: `http://localhost:${config.port}/api-docs (protected)`,
            metrics: `http://localhost:${config.port}/metrics (protected)`
        });
    }
    catch (error) {
        logger.error('Failed to start Identity Service', { error });
        throw error;
    }
}
exports.default = bootstrap;
if (require.main === module) {
    bootstrap().catch((error) => {
        console.error('Fatal error during bootstrap:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=main.js.map