"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const morgan_1 = __importDefault(require("morgan"));
const appointment_routes_1 = __importDefault(require("./routes/appointment.routes"));
const checkin_routes_1 = __importDefault(require("./routes/checkin.routes"));
const healthcare_routes_1 = __importDefault(require("./routes/healthcare.routes"));
const queue_routes_1 = __importDefault(require("./routes/queue.routes"));
const receptionist_routes_1 = __importDefault(require("./routes/receptionist.routes"));
const realtime_service_1 = require("./services/realtime.service");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 3004;
const SERVICE_NAME = "appointment-service";
const realtimeService = new realtime_service_1.AppointmentRealtimeService();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)("combined"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get("/health", (req, res) => {
    res.json({
        service: "Hospital Appointment Service",
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "2.0.0",
        features: {
            realtime: realtimeService.isRealtimeConnected(),
            websocket: true,
            supabase_integration: true,
        },
    });
});
app.use("/api/appointments", appointment_routes_1.default);
app.use("/api/appointments", healthcare_routes_1.default);
app.use("/api/receptionists", receptionist_routes_1.default);
app.use("/api/checkin", checkin_routes_1.default);
app.use("/api/queue", queue_routes_1.default);
app.get("/appointments", (req, res) => {
    res.json({
        message: "Appointment service is running - use /api/appointments for API endpoints",
        timestamp: new Date().toISOString(),
    });
});
app.get("/", (req, res) => {
    res.json({
        service: "Hospital Appointment Service",
        version: "1.0.0",
        status: "running",
        timestamp: new Date().toISOString(),
    });
});
app.use("*", (req, res) => {
    res.status(404).json({
        error: "Route not found",
        path: req.originalUrl,
        method: req.method,
    });
});
app.use((err, req, res, next) => {
    logger_1.default.error("Unhandled error:", { error: err.message, stack: err.stack });
    const language = req.headers["accept-language"]?.includes("en")
        ? "en"
        : "vi";
    const errorResponse = {
        success: false,
        error: language === "vi" ? "Lỗi hệ thống nội bộ" : "Internal server error",
        message: process.env.NODE_ENV === "development"
            ? err.message
            : language === "vi"
                ? "Đã xảy ra lỗi, vui lòng thử lại"
                : "Something went wrong",
        timestamp: new Date().toISOString(),
        service: "appointment-service",
    };
    res.status(500).json(errorResponse);
});
async function startServer() {
    try {
        httpServer.listen(PORT, () => {
            logger_1.default.info(`🚀 Appointment Service with Real-time running on port ${PORT}`, {
                service: SERVICE_NAME,
                port: PORT,
                environment: process.env.NODE_ENV || "development",
                features: {
                    realtime: true,
                    websocket: true,
                    supabase: true,
                },
            });
        });
        await realtimeService.initialize(httpServer);
    }
    catch (error) {
        logger_1.default.error("❌ Failed to start Appointment Service:", error);
        process.exit(1);
    }
}
startServer();
const gracefulShutdown = async (signal) => {
    logger_1.default.info(`Received ${signal}, shutting down gracefully`);
    try {
        await realtimeService.disconnect();
        logger_1.default.info("✅ Real-time service disconnected");
    }
    catch (error) {
        logger_1.default.error("❌ Error during real-time service shutdown:", error);
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