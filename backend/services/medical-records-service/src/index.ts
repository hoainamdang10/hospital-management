import dotenv from "dotenv";
import path from "path";

// Load environment variables FIRST - check multiple locations
const envPath = path.resolve(__dirname, "../../../.env");
dotenv.config({ path: envPath });
dotenv.config(); // Also try default location

// Add basic error handling for imports
let logger: any;
let app: any;
let MedicalRecordRealtimeService: any;

try {
  const shared = require("@hospital/shared");
  logger = shared.logger;
  console.log("✅ Successfully imported @hospital/shared");
} catch (error) {
  console.error("❌ Failed to import @hospital/shared:", error);
  process.exit(1);
}

try {
  app = require("./app").default;
  console.log("✅ Successfully imported app");
} catch (error) {
  console.error("❌ Failed to import app:", error);
  process.exit(1);
}

try {
  const realtimeModule = require("./services/realtime.service");
  MedicalRecordRealtimeService = realtimeModule.MedicalRecordRealtimeService;
  console.log("✅ Successfully imported realtime service");
} catch (error) {
  console.warn(
    "⚠️ Failed to import realtime service, continuing without it:",
    error
  );
  MedicalRecordRealtimeService = null;
}

import { createServer } from "http";

const httpServer = createServer(app);
const PORT = process.env.PORT || 3007;
const SERVICE_NAME = "medical-records-service";

// Initialize real-time service (only if available)
let realtimeService: any = null;
if (MedicalRecordRealtimeService) {
  try {
    realtimeService = new MedicalRecordRealtimeService();
    console.log("✅ Real-time service initialized");
  } catch (error) {
    console.warn("⚠️ Failed to initialize real-time service:", error);
  }
}

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    // Disconnect realtime service (if available)
    if (realtimeService && realtimeService.disconnect) {
      await realtimeService.disconnect();
      logger.info("Real-time service disconnected");
    }
  } catch (error) {
    logger.error("Error disconnecting real-time service:", error);
  }

  httpServer.close(() => {
    logger.info("HTTP server closed.");
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 30000);
};

// Initialize real-time service and start server
async function startServer() {
  try {
    // Start HTTP server first
    httpServer.listen(PORT, () => {
      logger.info(`🚀 ${SERVICE_NAME} with Real-time running on port ${PORT}`, {
        service: SERVICE_NAME,
        port: PORT,
        environment: process.env.NODE_ENV || "development",
        features: {
          realtime: true,
          websocket: true,
          supabase: true,
          medical_records_monitoring: true,
          vital_signs_tracking: true,
          lab_results_tracking: true,
        },
      });

      logger.info(`Health check available at: http://localhost:${PORT}/health`);
      logger.info(
        `API documentation available at: http://localhost:${PORT}/docs`
      );
    });

    // Initialize real-time service with HTTP server (if available)
    if (realtimeService) {
      try {
        await realtimeService.initialize(httpServer);
        logger.info("✅ Real-time service initialized successfully");
      } catch (realtimeError) {
        logger.warn(
          "⚠️ Real-time service failed to initialize, continuing without it:",
          realtimeError
        );
      }
    } else {
      logger.info("ℹ️ Real-time service not available, running in basic mode");
    }
  } catch (error) {
    logger.error("❌ Failed to start Medical Records Service:", error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", { promise, reason });
  gracefulShutdown("UNHANDLED_REJECTION");
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", {
    error: error.message,
    stack: error.stack,
  });
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

// Handle termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default httpServer;
