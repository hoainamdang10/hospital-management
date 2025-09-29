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
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { testConnection } from "./config/database.config";
import departmentRoutes from "./routes/department.routes";
import roomRoutes from "./routes/room.routes";
import specialtyRoutes from "./routes/specialty.routes";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;
const SERVICE_NAME = "Hospital Department Service";
const SERVICE_VERSION = "1.0.0";

// Initialize ResponseHelper with service information
ResponseHelper.initialize(SERVICE_NAME, SERVICE_VERSION);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// Add request ID to all responses
app.use(addRequestId);

// General middleware
app.use(compression());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Phase 2 Middleware - API Optimization
app.use(sanitizeInput); // Sanitize input data
app.use(createVersioningMiddleware()); // API versioning
app.use(responseTransformMiddleware());

// Metrics middleware and endpoint
app.use(metricsMiddleware("department-service"));
app.get("/metrics", getMetricsHandler); // Response transformation based on version

// Health check endpoint with standardized format
app.get("/health", async (req, res) => {
  try {
    const dbConnected = await testConnection();
    const status = dbConnected ? "healthy" : "unhealthy";
    const statusCode = dbConnected ? 200 : 503;

    const healthCheck = ResponseHelper.healthCheck(
      status,
      {
        database: {
          status: dbConnected ? "healthy" : "unhealthy",
          responseTime: 50,
        },
      },
      {
        department_management: true,
        specialty_management: true,
        room_management: true,
        hierarchy_support: true,
        statistics: true,
      }
    );

    res.status(statusCode).json(healthCheck);
  } catch (error: any) {
    logger.error("Health check error:", error);
    const errorHealthCheck = ResponseHelper.healthCheck("unhealthy", {
      database: {
        status: "unhealthy",
        error: error.message,
      },
    });
    res.status(503).json(errorHealthCheck);
  }
});

// API Routes
app.use("/api/departments", departmentRoutes);
app.use("/api/specialties", specialtyRoutes);
app.use("/api/rooms", roomRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "Hospital Department Service",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      departments: "/api/departments",
      specialties: "/api/specialties",
      rooms: "/api/rooms",
    },
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    service: "Hospital Department Service",
    timestamp: new Date().toISOString(),
  });
});

// Global error handling middleware with Vietnamese messages
app.use(globalErrorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error("Failed to connect to database. Exiting...");
      process.exit(1);
    }

    app.listen(PORT, () => {
      logger.info(`🏥 Department Service started successfully`, {
        port: PORT,
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
      });
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

// Start the server
startServer();

export default app;
