"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const SupabaseClientFactory_1 = require("./infrastructure/database/SupabaseClientFactory");
const SupabaseScheduleRepository_1 = require("./infrastructure/persistence/SupabaseScheduleRepository");
const SupabaseScheduleRunRepository_1 = require("./infrastructure/persistence/SupabaseScheduleRunRepository");
const use_cases_1 = require("./application/use-cases");
const ScheduleController_1 = require("./presentation/controllers/ScheduleController");
const scheduleRoutes_1 = require("./presentation/routes/scheduleRoutes");
const metricsRoutes_1 = require("./presentation/routes/metricsRoutes");
const rateLimitMiddleware_1 = require("./presentation/middleware/rateLimitMiddleware");
const metricsMiddleware_1 = require("./presentation/middleware/metricsMiddleware");
const loggingMiddleware_1 = require("./presentation/middleware/loggingMiddleware");
const Logger_1 = require("./infrastructure/observability/Logger");
const MetricsCollector_1 = require("./infrastructure/observability/MetricsCollector");
const swagger_config_1 = require("./infrastructure/swagger/swagger.config");
dotenv_1.default.config();
const logger = Logger_1.Logger.getInstance();
const metrics = MetricsCollector_1.MetricsCollector.getInstance();
const PORT = process.env.PORT || 3025;
async function bootstrap() {
    try {
        logger.info("Starting Scheduler API Server...");
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Missing Supabase configuration");
        }
        const supabase = SupabaseClientFactory_1.SupabaseClientFactory.create({
            url: supabaseUrl,
            serviceRoleKey: supabaseServiceKey,
            schema: "scheduler",
        });
        const scheduleRepo = new SupabaseScheduleRepository_1.SupabaseScheduleRepository(supabase);
        const runRepo = new SupabaseScheduleRunRepository_1.SupabaseScheduleRunRepository(supabase);
        const createScheduleUseCase = new use_cases_1.CreateScheduleUseCase(scheduleRepo);
        const cancelScheduleUseCase = new use_cases_1.CancelScheduleUseCase(scheduleRepo, runRepo);
        const getScheduleUseCase = new use_cases_1.GetScheduleUseCase(scheduleRepo, runRepo);
        const getScheduleRunsUseCase = new use_cases_1.GetScheduleRunsUseCase(runRepo);
        const runNowUseCase = new use_cases_1.RunNowUseCase(scheduleRepo, runRepo);
        const listSchedulesUseCase = new use_cases_1.ListSchedulesUseCase(scheduleRepo);
        const updateScheduleUseCase = new use_cases_1.UpdateScheduleUseCase(scheduleRepo);
        const deleteScheduleUseCase = new use_cases_1.DeleteScheduleUseCase(scheduleRepo, runRepo);
        const getRunUseCase = new use_cases_1.GetRunUseCase(runRepo);
        const retryRunUseCase = new use_cases_1.RetryRunUseCase(runRepo);
        const controller = new ScheduleController_1.ScheduleController(createScheduleUseCase, cancelScheduleUseCase, getScheduleUseCase, getScheduleRunsUseCase, runNowUseCase, listSchedulesUseCase, updateScheduleUseCase, deleteScheduleUseCase, getRunUseCase, retryRunUseCase);
        const app = (0, express_1.default)();
        // Security & CORS
        app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
                    imgSrc: ["'self'", "data:", "https:", "cdn.jsdelivr.net"],
                    fontSrc: ["'self'", "data:", "cdn.jsdelivr.net"],
                },
            },
        }));
        app.use((0, cors_1.default)());
        app.use(express_1.default.json());
        // Observability middleware (must be before routes)
        app.use(metricsMiddleware_1.metricsMiddleware);
        app.use(loggingMiddleware_1.loggingMiddleware);
        // Rate limiting
        app.use(rateLimitMiddleware_1.rateLimitMiddleware);
        // Routes
        const routes = (0, scheduleRoutes_1.createScheduleRoutes)(controller);
        app.use("/api/v1", routes);
        app.get("/health", (req, res) => controller.healthCheck(req, res));
        // Metrics endpoint (no auth required for Prometheus scraping)
        const metricsRoutes = (0, metricsRoutes_1.createMetricsRoutes)();
        app.use("/", metricsRoutes);
        // Swagger API Documentation
        app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_config_1.swaggerSpec, {
            explorer: true,
            customCss: ".swagger-ui .topbar { display: none }",
            customSiteTitle: "Scheduler Service API Documentation",
            swaggerOptions: {
                persistAuthorization: true,
                displayRequestDuration: true,
                filter: true,
                tryItOutEnabled: true,
            },
        }));
        // OpenAPI JSON spec
        app.get("/api-docs/json", (req, res) => {
            res.setHeader("Content-Type", "application/json");
            res.send(swagger_config_1.swaggerSpec);
        });
        logger.info("Swagger UI available at http://localhost:" + PORT + "/api-docs");
        // Error handler
        app.use((err, req, res, next) => {
            const correlationId = req.correlationId;
            logger.error("Unhandled error", err, { correlationId });
            // Increment error metrics
            metrics.apiRequestErrors.inc({
                method: req.method,
                route: req.route?.path || req.path,
                error_type: "unhandled_error",
            });
            res.status(500).json({
                success: false,
                error: "Internal server error",
                correlationId,
            });
        });
        const server = app.listen(PORT, () => {
            logger.info(`Scheduler API Server listening on port ${PORT}`);
            logger.info(`Health check: http://localhost:${PORT}/api/v1/health`);
            logger.info(`Metrics endpoint: http://localhost:${PORT}/metrics`);
        });
        process.on("SIGTERM", async () => {
            logger.info("SIGTERM received, shutting down gracefully...");
            server.close(async () => {
                await SupabaseClientFactory_1.SupabaseClientFactory.close();
                logger.info("Server closed");
                process.exit(0);
            });
        });
        process.on("SIGINT", async () => {
            logger.info("SIGINT received, shutting down gracefully...");
            server.close(async () => {
                await SupabaseClientFactory_1.SupabaseClientFactory.close();
                logger.info("Server closed");
                process.exit(0);
            });
        });
    }
    catch (error) {
        logger.error("Failed to start API server", error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=api.js.map