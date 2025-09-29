import express from "express";
import { config } from "../config/config";
import { supabaseAdmin } from "../utils/supabase";

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *       503:
 *         description: Service is unhealthy
 */
// Liveness
router.get("/", async (_req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: "File Service is running",
    timestamp: new Date().toISOString(),
    service: "file-service",
    version: "1.0.0",
    environment: config.nodeEnv,
    checks: {
      database: false,
      storage: false,
    },
  };

  try {
    // Check database connection
    const { data, error } = await supabaseAdmin
      .from("documents")
      .select("count")
      .limit(1);

    healthCheck.checks.database = !error;

    // Check storage connection
    const { data: buckets, error: storageError } =
      await supabaseAdmin.storage.listBuckets();
    healthCheck.checks.storage =
      !storageError &&
      buckets?.some((b) => b.name === config.supabase.storageBucket);

    const isHealthy = Object.values(healthCheck.checks).every(
      (check) => check === true
    );

    // readiness result
    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      data: healthCheck,
    });
  } catch (error) {
    healthCheck.checks.database = false;
    healthCheck.checks.storage = false;

    res.status(503).json({
      success: false,
      data: healthCheck,
      error: error instanceof Error ? error.message : "Health check failed",
    });
  }
});

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check with metrics
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed health information
 */
// Readiness (detailed)
router.get("/detailed", async (_req, res) => {
  const memoryUsage = process.memoryUsage();

  const detailedHealth = {
    service: "file-service",
    version: "1.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,

    system: {
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
      },
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version,
    },

    configuration: {
      maxFileSize: config.fileUpload.maxSize,
      maxFiles: config.fileUpload.maxFiles,
      allowedTypes: config.fileUpload.allowedTypes.length,
      documentTypes: config.fileUpload.documentTypes.length,
      storageBucket: config.supabase.storageBucket,
      virusScanEnabled: config.security.virusScanEnabled,
    },

    checks: {
      database: false,
      storage: false,
      configuration: true,
    },
  };

  try {
    // Database health check
    const dbStart = Date.now();
    const { error: dbError } = await supabaseAdmin
      .from("documents")
      .select("count")
      .limit(1);

    detailedHealth.checks.database = !dbError;

    // Storage health check
    const storageStart = Date.now();
    const { data: buckets, error: storageError } =
      await supabaseAdmin.storage.listBuckets();

    detailedHealth.checks.storage =
      !storageError &&
      buckets?.some((b) => b.name === config.supabase.storageBucket);

    const isHealthy = Object.values(detailedHealth.checks).every(
      (check) => check === true
    );

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      data: detailedHealth,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      data: detailedHealth,
      error:
        error instanceof Error ? error.message : "Detailed health check failed",
    });
  }
});

export { router as healthRoutes };
