import { logger } from "@hospital/shared";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { hipaaMiddleware } from "./middleware/hipaa-compliance.middleware";
import medicalRecordRoutes from "./routes/medical-record.routes";

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
app.use(
  morgan("combined", {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Medical Records Service API",
      version: "1.0.0",
      description:
        "API for managing medical records, lab results, and vital signs",
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://api.hospital.com/medical-records"
            : "http://localhost:3006",
        description:
          process.env.NODE_ENV === "production"
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

const specs = swaggerJsdoc(swaggerOptions);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));

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
app.use(hipaaMiddleware.auditAccess);
app.use(hipaaMiddleware.maskSensitiveData);

// API routes
app.use("/api/medical-records", medicalRecordRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Vietnamese Error handling middleware
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logger.error("Unhandled error", {
      error: error.message,
      stack: error.stack,
    });

    // Extract language preference
    const language = req.headers["accept-language"]?.includes("en")
      ? "en"
      : "vi";

    const errorResponse = {
      success: false,
      error:
        language === "vi" ? "Lỗi hệ thống nội bộ" : "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : language === "vi"
            ? "Đã xảy ra lỗi, vui lòng thử lại"
            : "Something went wrong",
      timestamp: new Date().toISOString(),
      service: "medical-records-service",
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    };

    res.status(error.status || 500).json(errorResponse);
  }
);

export default app;
