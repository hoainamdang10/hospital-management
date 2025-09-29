import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

import { sanitizeInput } from "@hospital/shared/dist/middleware/validation.middleware";
import {
  createVersioningMiddleware,
  responseTransformMiddleware,
} from "@hospital/shared/dist/middleware/versioning.middleware";
import {
  getMetricsHandler,
  metricsMiddleware,
} from "@hospital/shared/dist/monitoring/metrics";
import logger from "@hospital/shared/dist/utils/logger";
import {
  ResponseHelper,
  addRequestId,
  globalErrorHandler,
} from "@hospital/shared/dist/utils/response-helpers";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { createServer } from "http";
import morgan from "morgan";
import { testDatabaseConnection } from "./config/database.config";
import appointmentRoutes from "./routes/appointment.routes";
import checkinRoutes from "./routes/checkin.routes";
import patientRoutes from "./routes/patient.routes";
import receptionistRoutes from "./routes/receptionist.routes";
import reportsRoutes from "./routes/reports.routes";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3006;
const SERVICE_NAME = "Hospital Receptionist Service";
const SERVICE_VERSION = "1.0.0";

// Initialize ResponseHelper with service information
ResponseHelper.initialize(SERVICE_NAME, SERVICE_VERSION);

// Middleware
app.use(helmet());
app.use(cors());
app.use(addRequestId); // Add request ID to all responses
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));

// Request sanitization
app.use(sanitizeInput);

// API versioning middleware
app.use(
  createVersioningMiddleware({
    defaultVersion: "1.0",
    supportedVersions: ["1.0"],
  })
);

// Response transformation middleware
app.use(responseTransformMiddleware());

// Metrics middleware and endpoint
app.use(metricsMiddleware("receptionist-service"));
app.get("/metrics", getMetricsHandler);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use("/api/receptionists", receptionistRoutes);
app.use("/api/checkin", checkinRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/reports", reportsRoutes);

// Root endpoint
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

// 404 handler
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

// Global error handler
app.use(globalErrorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      logger.warn(
        "⚠️ Database not available. Starting Receptionist Service in degraded mode"
      );
      // continue to start server; /health can reflect degraded status if desired
    }

    httpServer.listen(PORT, () => {
      logger.info(
        `🚀 ${SERVICE_NAME} v${SERVICE_VERSION} started successfully`,
        {
          port: PORT,
          environment: process.env.NODE_ENV || "development",
          timestamp: new Date().toISOString(),
        }
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  httpServer.close(() => {
    logger.info("Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  httpServer.close(() => {
    logger.info("Process terminated");
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

startServer();
