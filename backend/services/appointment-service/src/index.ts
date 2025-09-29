import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

import logger from "@hospital/shared/dist/utils/logger";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { createServer } from "http";
import morgan from "morgan";
import appointmentRoutes from "./routes/appointment.routes";
import checkinRoutes from "./routes/checkin.routes";
import healthcareRoutes from "./routes/healthcare.routes";
import queueRoutes from "./routes/queue.routes";
import receptionistRoutes from "./routes/receptionist.routes";
import { AppointmentRealtimeService } from "./services/realtime.service";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3004;
const SERVICE_NAME = "appointment-service";

// Initialize real-time service
const realtimeService = new AppointmentRealtimeService();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint with real-time status
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

// Routes
app.use("/api/appointments", appointmentRoutes);
app.use("/api/appointments", healthcareRoutes); // Mount healthcare routes (FHIR & Diagnosis)

// Receptionist functionality routes (Phase 2B Integration)
app.use("/api/receptionists", receptionistRoutes);
app.use("/api/checkin", checkinRoutes);
app.use("/api/queue", queueRoutes);

// Legacy endpoint for backward compatibility
app.get("/appointments", (req, res) => {
  res.json({
    message:
      "Appointment service is running - use /api/appointments for API endpoints",
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "Hospital Appointment Service",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Vietnamese Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logger.error("Unhandled error:", { error: err.message, stack: err.stack });

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
          ? err.message
          : language === "vi"
            ? "Đã xảy ra lỗi, vui lòng thử lại"
            : "Something went wrong",
      timestamp: new Date().toISOString(),
      service: "appointment-service",
    };

    res.status(500).json(errorResponse);
  }
);

// Initialize real-time service and start server
async function startServer() {
  try {
    // Start HTTP server first
    httpServer.listen(PORT, () => {
      logger.info(
        `🚀 Appointment Service with Real-time running on port ${PORT}`,
        {
          service: SERVICE_NAME,
          port: PORT,
          environment: process.env.NODE_ENV || "development",
          features: {
            realtime: true,
            websocket: true,
            supabase: true,
          },
        }
      );
    });

    // Initialize real-time service with HTTP server
    await realtimeService.initialize(httpServer);
  } catch (error) {
    logger.error("❌ Failed to start Appointment Service:", error);
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
    logger.info("✅ Real-time service disconnected");
  } catch (error) {
    logger.error("❌ Error during real-time service shutdown:", error);
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
