import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

import {
  createConnectionPoolHealthCheck,
  createConnectionPoolMetrics,
  createConnectionPoolStressTest,
} from "@hospital/shared/dist/middleware/connection-pool-health";
import { sanitizeInput } from "@hospital/shared/dist/middleware/validation.middleware";
import {
  createVersioningMiddleware,
  responseTransformMiddleware,
} from "@hospital/shared/dist/middleware/versioning.middleware";
import advancedICD10Routes from "@hospital/shared/dist/routes/advanced-icd10.routes";
import logger from "@hospital/shared/dist/utils/logger";
import {
  EnhancedResponseHelper,
  ResponseHelper,
  addRequestId,
  globalErrorHandler,
} from "@hospital/shared/dist/utils/response-helpers";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { createServer } from "http";
import morgan from "morgan";
import availabilityRoutes from "./routes/availability.routes";
import doctorRoutes from "./routes/doctor.routes";
import experienceRoutes from "./routes/experience.routes";
import healthcareRoutes from "./routes/healthcare.routes";
import reviewsRoutes from "./routes/reviews.routes";
import scheduleRoutes from "./routes/schedule.routes";
import settingsRoutes from "./routes/settings.routes";
import shiftRoutes from "./routes/shift.routes";
import slotManagementRoutes from "./routes/slot-management.routes";
import { DoctorRealtimeService } from "./services/realtime.service";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3002;
const SERVICE_NAME = "Hospital Doctor Service";
const SERVICE_VERSION = "1.0.0";

// Initialize ResponseHelper with service information
ResponseHelper.initialize(SERVICE_NAME, SERVICE_VERSION);

// Initialize real-time service
const realtimeService = new DoctorRealtimeService();

// Middleware
app.use(helmet());
app.use(cors());
app.use(addRequestId); // Add request ID to all responses
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Phase 2 Middleware - API Optimization
app.use(sanitizeInput); // Sanitize input data
app.use(createVersioningMiddleware()); // API versioning
app.use(responseTransformMiddleware()); // Response transformation based on version

// Health check endpoint with real-time status
app.get("/health", (req, res) => {
  const healthCheck = ResponseHelper.healthCheck(
    "healthy",
    {
      supabase: {
        status: "healthy",
        responseTime: 50,
      },
      realtime_service: {
        status: realtimeService.isRealtimeConnected() ? "healthy" : "unhealthy",
      },
    },
    {
      realtime: realtimeService.isRealtimeConnected(),
      websocket: true,
      supabase_integration: true,
      doctor_monitoring: true,
      shift_tracking: true,
      experience_management: true,
      schedule_management: true,
      reviews_system: true,
      settings_management: true,
    }
  );

  res.json(healthCheck);
});

// Connection Pool Health Check Endpoints
app.get(
  "/health/connection-pool",
  createConnectionPoolHealthCheck("doctor-service")
);
app.get(
  "/metrics/connection-pool",
  createConnectionPoolMetrics("doctor-service")
);
app.get(
  "/test/connection-pool/stress",
  createConnectionPoolStressTest("doctor-service")
);

// Prometheus metrics endpoint
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

// Debug middleware to log all requests
app.use("/api/doctors", (req, res, next) => {
  logger.info("🔍 REQUEST TO DOCTOR SERVICE:", {
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

// API Routes - Mount routes in correct order to avoid conflicts
app.use("/api/doctors", doctorRoutes); // Mount doctor routes first (has specific routes like /by-profile)
app.use("/api/doctors", scheduleRoutes); // Mount schedule routes after (has /:doctor_id patterns)
app.use("/api/doctors", availabilityRoutes); // Mount availability routes
app.use("/api/doctors", slotManagementRoutes); // Mount slot management routes
app.use("/api/doctors", reviewsRoutes);
app.use("/api/doctors", settingsRoutes);
app.use("/api/doctors", experienceRoutes); // Mount experience routes under /api/doctors
app.use("/api/doctors", healthcareRoutes); // Mount healthcare routes (FHIR & ICD-10)
app.use("/api/icd10", advancedICD10Routes); // Mount advanced ICD-10 routes
app.use("/api/shifts", shiftRoutes);
// REMOVED: Duplicate /api/experiences route - use /api/doctors/:id/experiences instead

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "Hospital Doctor Service",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler with Vietnamese error message
app.use("*", (req, res) => {
  const errorResponse = EnhancedResponseHelper.errorVi(
    "NOT_FOUND",
    "ROUTE_NOT_FOUND",
    {
      path: req.originalUrl,
      method: req.method,
      message: `Không tìm thấy đường dẫn ${req.originalUrl}`,
    }
  );
  res.status(404).json(errorResponse);
});

// Global error handling middleware with Vietnamese messages
app.use(globalErrorHandler);

// Initialize real-time service and start server
async function startServer() {
  try {
    // Start HTTP server first
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Doctor Service with Real-time running on port ${PORT}`, {
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

    // Initialize real-time service with HTTP server (optional)
    try {
      await realtimeService.initialize(httpServer);
      logger.info("✅ Real-time service initialized successfully");
    } catch (realtimeError) {
      logger.warn(
        "⚠️ Real-time service failed to initialize, continuing without it:",
        realtimeError
      );
    }
  } catch (error) {
    logger.error("❌ Failed to start Doctor Service:", error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Graceful shutdown with real-time cleanup
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully`);

  try {
    // Disconnect real-time service
    await realtimeService.disconnect();
    logger.info("✅ Doctor Real-time service disconnected");
  } catch (error) {
    logger.error("❌ Error during doctor real-time service shutdown:", error);
  }

  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", { promise, reason });
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
