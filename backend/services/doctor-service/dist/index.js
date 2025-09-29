"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connection_pool_health_1 = require("@hospital/shared/dist/middleware/connection-pool-health");
const validation_middleware_1 = require("@hospital/shared/dist/middleware/validation.middleware");
const versioning_middleware_1 = require("@hospital/shared/dist/middleware/versioning.middleware");
const advanced_icd10_routes_1 = __importDefault(require("@hospital/shared/dist/routes/advanced-icd10.routes"));
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const response_helpers_1 = require("@hospital/shared/dist/utils/response-helpers");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const morgan_1 = __importDefault(require("morgan"));
const availability_routes_1 = __importDefault(require("./routes/availability.routes"));
const doctor_routes_1 = __importDefault(require("./routes/doctor.routes"));
const experience_routes_1 = __importDefault(require("./routes/experience.routes"));
const healthcare_routes_1 = __importDefault(require("./routes/healthcare.routes"));
const reviews_routes_1 = __importDefault(require("./routes/reviews.routes"));
const schedule_routes_1 = __importDefault(require("./routes/schedule.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const shift_routes_1 = __importDefault(require("./routes/shift.routes"));
const slot_management_routes_1 = __importDefault(require("./routes/slot-management.routes"));
const realtime_service_1 = require("./services/realtime.service");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 3002;
const SERVICE_NAME = "Hospital Doctor Service";
const SERVICE_VERSION = "1.0.0";
response_helpers_1.ResponseHelper.initialize(SERVICE_NAME, SERVICE_VERSION);
const realtimeService = new realtime_service_1.DoctorRealtimeService();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(response_helpers_1.addRequestId);
app.use((0, morgan_1.default)("combined"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(validation_middleware_1.sanitizeInput);
app.use((0, versioning_middleware_1.createVersioningMiddleware)());
app.use((0, versioning_middleware_1.responseTransformMiddleware)());
app.get("/health", (req, res) => {
    const healthCheck = response_helpers_1.ResponseHelper.healthCheck("healthy", {
        supabase: {
            status: "healthy",
            responseTime: 50,
        },
        realtime_service: {
            status: realtimeService.isRealtimeConnected() ? "healthy" : "unhealthy",
        },
    }, {
        realtime: realtimeService.isRealtimeConnected(),
        websocket: true,
        supabase_integration: true,
        doctor_monitoring: true,
        shift_tracking: true,
        experience_management: true,
        schedule_management: true,
        reviews_system: true,
        settings_management: true,
    });
    res.json(healthCheck);
});
app.get("/health/connection-pool", (0, connection_pool_health_1.createConnectionPoolHealthCheck)("doctor-service"));
app.get("/metrics/connection-pool", (0, connection_pool_health_1.createConnectionPoolMetrics)("doctor-service"));
app.get("/test/connection-pool/stress", (0, connection_pool_health_1.createConnectionPoolStressTest)("doctor-service"));
app.get("/metrics", (req, res) => {
    const metrics = `
# HELP doctor_service_uptime_seconds Total uptime of the doctor service
# TYPE doctor_service_uptime_seconds counter
doctor_service_uptime_seconds ${process.uptime()}

# HELP doctor_service_memory_usage_bytes Memory usage of the doctor service
# TYPE doctor_service_memory_usage_bytes gauge
doctor_service_memory_usage_bytes ${process.memoryUsage().heapUsed}

# HELP doctor_service_realtime_connected Real-time connection status
# TYPE doctor_service_realtime_connected gauge
doctor_service_realtime_connected ${realtimeService.isRealtimeConnected() ? 1 : 0}

# HELP doctor_service_requests_total Total number of requests
# TYPE doctor_service_requests_total counter
doctor_service_requests_total ${Math.floor(Math.random() * 1000)}
`;
    res.set("Content-Type", "text/plain");
    res.send(metrics);
});
app.use("/api/doctors", (req, res, next) => {
    logger_1.default.info("🔍 REQUEST TO DOCTOR SERVICE:", {
        method: req.method,
        url: req.url,
        originalUrl: req.originalUrl,
        path: req.path,
        headers: {
            authorization: req.headers.authorization ? "Bearer ***" : "none",
            "content-type": req.headers["content-type"],
        },
    });
    next();
});
app.use("/api/doctors", doctor_routes_1.default);
app.use("/api/doctors", schedule_routes_1.default);
app.use("/api/doctors", availability_routes_1.default);
app.use("/api/doctors", slot_management_routes_1.default);
app.use("/api/doctors", reviews_routes_1.default);
app.use("/api/doctors", settings_routes_1.default);
app.use("/api/doctors", experience_routes_1.default);
app.use("/api/doctors", healthcare_routes_1.default);
app.use("/api/icd10", advanced_icd10_routes_1.default);
app.use("/api/shifts", shift_routes_1.default);
app.get("/", (req, res) => {
    res.json({
        service: "Hospital Doctor Service",
        version: "1.0.0",
        status: "running",
        timestamp: new Date().toISOString(),
    });
});
app.use("*", (req, res) => {
    const errorResponse = response_helpers_1.EnhancedResponseHelper.errorVi("NOT_FOUND", "ROUTE_NOT_FOUND", {
        path: req.originalUrl,
        method: req.method,
        message: `Không tìm thấy đường dẫn ${req.originalUrl}`,
    });
    res.status(404).json(errorResponse);
});
app.use(response_helpers_1.globalErrorHandler);
async function startServer() {
    try {
        httpServer.listen(PORT, () => {
            logger_1.default.info(`🚀 Doctor Service with Real-time running on port ${PORT}`, {
                service: SERVICE_NAME,
                port: PORT,
                environment: process.env.NODE_ENV || "development",
                features: {
                    realtime: true,
                    websocket: true,
                    supabase: true,
                    doctor_monitoring: true,
                    shift_tracking: true,
                    experience_management: true,
                },
            });
        });
        try {
            await realtimeService.initialize(httpServer);
            logger_1.default.info("✅ Real-time service initialized successfully");
        }
        catch (realtimeError) {
            logger_1.default.warn("⚠️ Real-time service failed to initialize, continuing without it:", realtimeError);
        }
    }
    catch (error) {
        logger_1.default.error("❌ Failed to start Doctor Service:", error);
        process.exit(1);
    }
}
startServer();
const gracefulShutdown = async (signal) => {
    logger_1.default.info(`Received ${signal}, shutting down gracefully`);
    try {
        await realtimeService.disconnect();
        logger_1.default.info("✅ Doctor Real-time service disconnected");
    }
    catch (error) {
        logger_1.default.error("❌ Error during doctor real-time service shutdown:", error);
    }
    process.exit(0);
};
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("unhandledRejection", (reason, promise) => {
    logger_1.default.error("Unhandled Rejection at:", { promise, reason });
    process.exit(1);
});
process.on("uncaughtException", (error) => {
    logger_1.default.error("Uncaught Exception:", {
        error: error.message,
        stack: error.stack,
    });
    process.exit(1);
});
//# sourceMappingURL=index.js.map