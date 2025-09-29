import { getMetricsHandler, metricsMiddleware } from "@hospital/shared";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { authMiddleware } from "./middleware/auth.middleware";
import { errorHandler } from "./middleware/error.middleware";
import { paymentRoutes } from "./routes/payment.routes";
import { payosRoutes } from "./routes/payos.routes";
import { webhookRoutes } from "./routes/webhook.routes";
import { logger } from "./utils/logger";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3008;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});
app.use("/api/", limiter);

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Compression
app.use(compression());

// Logging
app.use(
  morgan("combined", {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// Body parsing middleware (capture raw body for webhook signature validation)
app.use(
  express.json({
    limit: "10mb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Metrics middleware and endpoint
app.use(metricsMiddleware("payment-service"));
app.get("/metrics", getMetricsHandler);

// Liveness endpoint (no auth required)
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "Hospital Payment Service",
    timestamp: new Date().toISOString(),
  });
});

// Readiness endpoint (checks dependencies)
app.get("/readiness", async (_req: Request, res: Response) => {
  let payosReady = false;
  let dbReady = false;

  try {
    // Initialize PayOS client (no external call)
    const credsOk = !!(
      process.env.PAYOS_CLIENT_ID &&
      process.env.PAYOS_API_KEY &&
      process.env.PAYOS_CHECKSUM_KEY
    );
    payosReady = credsOk;
  } catch (e) {
    payosReady = false;
  }

  try {
    // Minimal Supabase check via repository initialization and lightweight query if possible
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const supabase = createClient(url, key);
      const { error } = await supabase.from("payments").select("id").limit(1);
      dbReady = !error;
    }
  } catch (_e) {
    dbReady = false;
  }

  const ready = payosReady && dbReady;
  res.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "not_ready",
    dependencies: { payos: payosReady, database: dbReady },
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/payments/payos", authMiddleware, payosRoutes);
app.use("/api/payments", authMiddleware, paymentRoutes);

// Webhook routes (no auth required for external webhooks)
app.use("/api/webhooks", webhookRoutes);

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.originalUrl,
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`Payment Service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(
    `PayOS Environment: ${process.env.PAYOS_ENVIRONMENT || "sandbox"}`
  );
});

export default app;
