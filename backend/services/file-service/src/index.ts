import { getMetricsHandler, metricsMiddleware } from "@hospital/shared";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { config } from "./config/config";
import { errorHandler } from "./middleware/error.middleware";
import { documentsRoutes } from "./routes/documents.routes";
import { healthRoutes } from "./routes/health.routes";
import { logger } from "./utils/logger";

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Metrics middleware and endpoint
app.use(metricsMiddleware("file-service"));
app.get("/metrics", getMetricsHandler);

// Health check
app.use("/health", healthRoutes);

// API routes
app.use("/api/documents", documentsRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    error: "NOT_FOUND",
  });
});

const PORT = config.port || 3107;

app.listen(PORT, () => {
  logger.info(`🚀 File Service running on port ${PORT}`);
  logger.info(`📁 Environment: ${config.nodeEnv}`);
  logger.info(`🔒 File upload limit: ${config.fileUpload.maxSize} bytes`);
});

export default app;
