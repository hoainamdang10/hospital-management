"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const shared_1 = require("@hospital/shared");
const validation_middleware_1 = require("@hospital/shared/dist/middleware/validation.middleware");
const versioning_middleware_1 = require("@hospital/shared/dist/middleware/versioning.middleware");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const response_helpers_1 = require("@hospital/shared/dist/utils/response-helpers");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const supabase_1 = require("./config/supabase");
const swagger_1 = require("./config/swagger");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const patient_registration_routes_1 = __importDefault(require("./routes/patient-registration.routes"));
const session_routes_1 = __importDefault(require("./routes/session.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const department_routes_1 = __importDefault(require("./modules/admin/routes/department.routes"));
const orchestration_routes_1 = __importDefault(require("./modules/admin/routes/orchestration.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const SERVICE_NAME = "Hospital Auth Service";
const SERVICE_VERSION = "1.0.0";
response_helpers_1.ResponseHelper.initialize(SERVICE_NAME, SERVICE_VERSION);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-user-id",
        "x-user-role",
    ],
}));
app.use(response_helpers_1.addRequestId);
app.use((0, morgan_1.default)("combined"));
app.use((0, shared_1.metricsMiddleware)("auth-service"));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.use(validation_middleware_1.sanitizeInput);
app.use((0, versioning_middleware_1.createVersioningMiddleware)());
app.use((0, versioning_middleware_1.responseTransformMiddleware)());
(0, swagger_1.setupSwagger)(app);
app.get("/health", async (req, res) => {
    try {
        const supabaseConnected = await (0, supabase_1.testSupabaseConnection)();
        const status = supabaseConnected ? "healthy" : "unhealthy";
        const statusCode = supabaseConnected ? 200 : 503;
        const healthCheck = response_helpers_1.ResponseHelper.healthCheck(status, {
            supabase: {
                status: supabaseConnected ? "healthy" : "unhealthy",
                responseTime: 50,
            },
        }, {
            authentication: true,
            user_management: true,
            session_management: true,
            oauth_providers: true,
            password_reset: true,
            email_verification: true,
        });
        res.status(statusCode).json(healthCheck);
    }
    catch (error) {
        logger_1.default.error("Health check error:", error);
        const errorHealthCheck = response_helpers_1.ResponseHelper.healthCheck("unhealthy", {
            supabase: {
                status: "unhealthy",
                error: error.message,
            },
        });
        res.status(503).json(errorHealthCheck);
    }
});
app.get("/metrics", shared_1.getMetricsHandler);
try {
    app.use("/api/auth", auth_routes_1.default);
    app.use("/api/auth", patient_registration_routes_1.default);
    app.use("/api/users", user_routes_1.default);
    app.use("/api/sessions", session_routes_1.default);
    app.use("/api/admin/departments", department_routes_1.default);
    app.use("/api/admin/orchestrate", orchestration_routes_1.default);
    app.use("/api/departments", department_routes_1.default);
    logger_1.default.info("✅ Routes loaded successfully");
}
catch (error) {
    logger_1.default.error("❌ Failed to load routes:", {
        error: error.message,
        stack: error.stack,
    });
}
app.get("/", (req, res) => {
    res.json({
        service: "Hospital Auth Service",
        version: "1.0.0",
        status: "running",
        timestamp: new Date().toISOString(),
        description: "Authentication microservice using Supabase Auth",
        endpoints: {
            health: "/health",
            docs: "/docs",
            auth: "/api/auth",
            mfa: "/api/auth/mfa",
            users: "/api/users",
            sessions: "/api/sessions",
            admin_departments: "/api/admin/departments",
            admin_orchestration: "/api/admin/orchestrate",
            departments: "/api/departments",
        },
    });
});
app.use("*", (req, res) => {
    res.status(404).json({
        error: "Route not found",
        path: req.originalUrl,
        method: req.method,
        service: SERVICE_NAME,
        availableRoutes: [
            "/api/auth",
            "/api/auth/mfa",
            "/api/users",
            "/api/sessions",
            "/health",
            "/docs",
        ],
    });
});
app.use(response_helpers_1.globalErrorHandler);
const startServer = async () => {
    try {
        logger_1.default.info("🔄 Starting server initialization...");
        await (0, supabase_1.initializeSupabase)();
        logger_1.default.info("🔄 Starting Express server...");
        const server = app.listen(PORT, () => {
            logger_1.default.info(`🚀 ${SERVICE_NAME} started successfully on port ${PORT}`, {
                service: SERVICE_NAME,
                port: PORT,
                environment: process.env.NODE_ENV || "development",
                timestamp: new Date().toISOString(),
                supabaseConnected: true,
            });
        });
        server.on("error", (error) => {
            logger_1.default.error("❌ Server error:", {
                error: error.message,
                code: error.code,
                stack: error.stack,
            });
            process.exit(1);
        });
    }
    catch (error) {
        logger_1.default.error("❌ Failed to start server:", {
            error: error.message,
            stack: error.stack,
        });
        process.exit(1);
    }
};
startServer();
process.on("SIGTERM", () => {
    logger_1.default.info("SIGTERM received, shutting down gracefully");
    process.exit(0);
});
process.on("SIGINT", () => {
    logger_1.default.info("SIGINT received, shutting down gracefully");
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=index.js.map