"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const validation_middleware_1 = require("@hospital/shared/dist/middleware/validation.middleware");
const versioning_middleware_1 = require("@hospital/shared/dist/middleware/versioning.middleware");
const metrics_1 = require("@hospital/shared/dist/monitoring/metrics");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const response_helpers_1 = require("@hospital/shared/dist/utils/response-helpers");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const morgan_1 = __importDefault(require("morgan"));
const database_config_1 = require("./config/database.config");
const appointment_routes_1 = __importDefault(require("./routes/appointment.routes"));
const checkin_routes_1 = __importDefault(require("./routes/checkin.routes"));
const patient_routes_1 = __importDefault(require("./routes/patient.routes"));
const receptionist_routes_1 = __importDefault(require("./routes/receptionist.routes"));
const reports_routes_1 = __importDefault(require("./routes/reports.routes"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 3006;
const SERVICE_NAME = "Hospital Receptionist Service";
const SERVICE_VERSION = "1.0.0";
response_helpers_1.ResponseHelper.initialize(SERVICE_NAME, SERVICE_VERSION);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(response_helpers_1.addRequestId);
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)("combined"));
app.use(validation_middleware_1.sanitizeInput);
app.use((0, versioning_middleware_1.createVersioningMiddleware)({
    defaultVersion: "1.0",
    supportedVersions: ["1.0"],
}));
app.use((0, versioning_middleware_1.responseTransformMiddleware)());
app.use((0, metrics_1.metricsMiddleware)("receptionist-service"));
app.get("/metrics", metrics_1.getMetricsHandler);
app.get("/health", (req, res) => {
    res.json({
        service: SERVICE_NAME,
        version: SERVICE_VERSION,
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
app.use("/api/receptionists", receptionist_routes_1.default);
app.use("/api/checkin", checkin_routes_1.default);
app.use("/api/appointments", appointment_routes_1.default);
app.use("/api/patients", patient_routes_1.default);
app.use("/api/reports", reports_routes_1.default);
app.get("/", (req, res) => {
    res.json({
        service: SERVICE_NAME,
        version: SERVICE_VERSION,
        status: "running",
        timestamp: new Date().toISOString(),
        endpoints: {
            health: "/health",
            receptionists: "/api/receptionists",
            checkin: "/api/checkin",
            appointments: "/api/appointments",
            patients: "/api/patients",
            reports: "/api/reports",
        },
    });
});
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: "Endpoint not found",
            path: req.originalUrl,
            method: req.method,
        },
    });
});
app.use(response_helpers_1.globalErrorHandler);
const startServer = async () => {
    try {
        const dbConnected = await (0, database_config_1.testDatabaseConnection)();
        if (!dbConnected) {
            logger_1.default.warn("⚠️ Database not available. Starting Receptionist Service in degraded mode");
        }
        httpServer.listen(PORT, () => {
            logger_1.default.info(`🚀 ${SERVICE_NAME} v${SERVICE_VERSION} started successfully`, {
                port: PORT,
                environment: process.env.NODE_ENV || "development",
                timestamp: new Date().toISOString(),
            });
        });
    }
    catch (error) {
        logger_1.default.error("Failed to start server:", error);
        process.exit(1);
    }
};
process.on("SIGTERM", () => {
    logger_1.default.info("SIGTERM received. Shutting down gracefully...");
    httpServer.close(() => {
        logger_1.default.info("Process terminated");
        process.exit(0);
    });
});
process.on("SIGINT", () => {
    logger_1.default.info("SIGINT received. Shutting down gracefully...");
    httpServer.close(() => {
        logger_1.default.info("Process terminated");
        process.exit(0);
    });
});
process.on("uncaughtException", (error) => {
    logger_1.default.error("Uncaught Exception:", error);
    process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
    logger_1.default.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
});
startServer();
//# sourceMappingURL=index.js.map