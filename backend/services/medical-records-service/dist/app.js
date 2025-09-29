"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("@hospital/shared");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const hipaa_compliance_middleware_1 = require("./middleware/hipaa-compliance.middleware");
const medical_record_routes_1 = __importDefault(require("./routes/medical-record.routes"));
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);
// Body parsing middleware
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Logging middleware
app.use((0, morgan_1.default)("combined", {
    stream: {
        write: (message) => shared_1.logger.info(message.trim()),
    },
}));
// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Medical Records Service API",
            version: "1.0.0",
            description: "API for managing medical records, lab results, and vital signs",
        },
        servers: [
            {
                url: process.env.NODE_ENV === "production"
                    ? "https://api.hospital.com/medical-records"
                    : "http://localhost:3006",
                description: process.env.NODE_ENV === "production"
                    ? "Production server"
                    : "Development server",
            },
        ],
        components: {
            schemas: {
                MedicalRecord: {
                    type: "object",
                    properties: {
                        record_id: { type: "string" },
                        patient_id: { type: "string" },
                        doctor_id: { type: "string" },
                        appointment_id: { type: "string" },
                        visit_date: { type: "string", format: "date-time" },
                        chief_complaint: { type: "string" },
                        present_illness: { type: "string" },
                        past_medical_history: { type: "string" },
                        physical_examination: { type: "string" },
                        vital_signs: { type: "object" },
                        diagnosis: { type: "string" },
                        treatment_plan: { type: "string" },
                        medications: { type: "string" },
                        follow_up_instructions: { type: "string" },
                        notes: { type: "string" },
                        status: { type: "string", enum: ["active", "archived", "deleted"] },
                        created_at: { type: "string", format: "date-time" },
                        updated_at: { type: "string", format: "date-time" },
                        created_by: { type: "string" },
                        updated_by: { type: "string" },
                    },
                },
                LabResult: {
                    type: "object",
                    properties: {
                        result_id: { type: "string" },
                        record_id: { type: "string" },
                        test_name: { type: "string" },
                        test_type: { type: "string" },
                        result_value: { type: "string" },
                        reference_range: { type: "string" },
                        unit: { type: "string" },
                        status: {
                            type: "string",
                            enum: ["pending", "completed", "cancelled"],
                        },
                        test_date: { type: "string", format: "date-time" },
                        result_date: { type: "string", format: "date-time" },
                        lab_technician: { type: "string" },
                        notes: { type: "string" },
                    },
                },
                VitalSigns: {
                    type: "object",
                    properties: {
                        vital_id: { type: "string" },
                        record_id: { type: "string" },
                        temperature: { type: "number" },
                        blood_pressure_systolic: { type: "integer" },
                        blood_pressure_diastolic: { type: "integer" },
                        heart_rate: { type: "integer" },
                        respiratory_rate: { type: "integer" },
                        oxygen_saturation: { type: "number" },
                        weight: { type: "number" },
                        height: { type: "number" },
                        bmi: { type: "number" },
                        recorded_at: { type: "string", format: "date-time" },
                        recorded_by: { type: "string" },
                        notes: { type: "string" },
                    },
                },
            },
        },
    },
    apis: ["./src/routes/*.ts"],
};
const specs = (0, swagger_jsdoc_1.default)(swaggerOptions);
app.use("/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs));
// Health check endpoint with real-time status
app.get("/health", (req, res) => {
    res.json({
        service: "Hospital Medical Records Service",
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "2.0.0",
        features: {
            realtime: true,
            websocket: true,
            supabase_integration: true,
            medical_records_monitoring: true,
            vital_signs_tracking: true,
            lab_results_tracking: true,
            health_alerts: true,
        },
    });
});
// Audit logging & PHI masking
app.use(hipaa_compliance_middleware_1.hipaaMiddleware.auditAccess);
app.use(hipaa_compliance_middleware_1.hipaaMiddleware.maskSensitiveData);
// API routes
app.use("/api/medical-records", medical_record_routes_1.default);
// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});
// Vietnamese Error handling middleware
app.use((error, req, res, next) => {
    shared_1.logger.error("Unhandled error", {
        error: error.message,
        stack: error.stack,
    });
    // Extract language preference
    const language = req.headers["accept-language"]?.includes("en")
        ? "en"
        : "vi";
    const errorResponse = {
        success: false,
        error: language === "vi" ? "Lỗi hệ thống nội bộ" : "Internal server error",
        message: process.env.NODE_ENV === "development"
            ? error.message
            : language === "vi"
                ? "Đã xảy ra lỗi, vui lòng thử lại"
                : "Something went wrong",
        timestamp: new Date().toISOString(),
        service: "medical-records-service",
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    };
    res.status(error.status || 500).json(errorResponse);
});
exports.default = app;
//# sourceMappingURL=app.js.map