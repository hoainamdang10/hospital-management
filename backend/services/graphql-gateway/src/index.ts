import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { createServer } from "http";
import morgan from "morgan";

// Import shared utilities
import logger from "@hospital/shared/dist/utils/logger";
import { EnhancedResponseHelper } from "@hospital/shared/dist/utils/response-helpers";
// import { addRequestId } from '@hospital/shared/dist/middleware/request-id'; // Not available

// Import GraphQL context
import { createContext } from "./context";

// Load environment variables
dotenv.config();

const PORT = process.env.GRAPHQL_PORT || 3200;
const SERVICE_NAME = "Hospital GraphQL Gateway";
const SERVICE_VERSION = "1.0.0";

/**
 * GraphQL Gateway Server for Hospital Management System
 * Provides unified GraphQL API over existing REST microservices
 */
async function startServer() {
  try {
    // Create Express app
    const app = express();

    // Create HTTP server first
    const httpServer = createServer(app);

    // Initialize ResponseHelper
    EnhancedResponseHelper.initialize(SERVICE_NAME, SERVICE_VERSION);

    // Security middleware
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"],
          },
        },
        crossOriginEmbedderPolicy: false,
      })
    );

    app.use(
      cors({
        origin: process.env.CORS_ORIGIN || [
          "http://localhost:3000",
          "http://localhost:3100",
        ],
        credentials: true,
      })
    );

    // General middleware
    // app.use(addRequestId); // Not available
    app.use(morgan("combined"));
    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Import the fixed schema and resolvers
    const { typeDefs } = await import("./schema/index.js");
    const { resolvers } = await import("./resolvers/index.js");

    // Create Apollo Server with full schema
    const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        // Custom error formatting plugin
        {
          async requestDidStart() {
            return {
              async didEncounterErrors(requestContext: any) {
                // Log GraphQL errors
                requestContext.errors?.forEach((error: any) => {
                  logger.error("GraphQL Error:", {
                    message: error.message,
                    path: error.path,
                    source: error.source?.body,
                    positions: error.positions,
                  });
                });
              },
              async willSendResponse(requestContext: any) {
                // Add error handling
                if (requestContext.response.errors) {
                  logger.error(
                    "GraphQL Response Errors:",
                    requestContext.response.errors
                  );
                }
              },
            };
          },
        },
      ],
      introspection: process.env.NODE_ENV !== "production",
    });

    // Start Apollo Server
    await apolloServer.start();

    // Apply Apollo GraphQL middleware with v4 syntax
    app.use(
      "/graphql",
      cors<cors.CorsRequest>(),
      express.json(),
      expressMiddleware(apolloServer, {
        context: async ({ req, res }: { req: any; res: any }) => {
          return await createContext({ req, res });
        },
      })
    );

    // HTTP server already created above

    // Health check endpoint
    app.get("/health", async (req, res) => {
      try {
        res.json({
          status: "healthy",
          service: "GraphQL Gateway",
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          graphql: {
            endpoint: "/graphql",
            introspection: process.env.NODE_ENV !== "production",
          },
        });
      } catch (error: any) {
        logger.error("Health check error:", error);
        res.status(503).json({
          status: "unhealthy",
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }

      // Prometheus metrics endpoint
      app.get("/metrics", async (_req, res) => {
        try {
          const { register } = await import("prom-client");
          res.set("Content-Type", register.contentType);
          res.end(await register.metrics());
        } catch (error: any) {
          logger.error("Metrics endpoint error:", error);
          res.status(500).json({ error: "Failed to collect metrics" });
        }
      });
    });

    // GraphQL Playground redirect
    app.get("/", (req, res) => {
      if (process.env.NODE_ENV !== "production") {
        res.redirect("/graphql");
      } else {
        res.json({
          service: SERVICE_NAME,
          version: SERVICE_VERSION,
          graphql: "/graphql",
          health: "/health",
        });
      }
    });

    // 404 handler
    app.use("*", (req, res) => {
      res.status(404).json({
        error: "NOT_FOUND",
        message: `Không tìm thấy đường dẫn ${req.originalUrl}`,
        path: req.originalUrl,
        method: req.method,
      });
    });

    // Start server
    httpServer.listen(PORT, () => {
      logger.info(`🚀 GraphQL Gateway Server ready!`);
      logger.info(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
      logger.info(`🎮 GraphQL Playground: http://localhost:${PORT}/graphql`);
      logger.info(`🔌 WebSocket subscriptions: ws://localhost:${PORT}/graphql`);
      logger.info(`❤️ Health check: http://localhost:${PORT}/health`);
      logger.info(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`🇻🇳 Vietnamese support: Enabled`);
    });

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      logger.info("SIGTERM received, shutting down gracefully");
      await apolloServer.stop();
      httpServer.close(() => {
        logger.info("GraphQL Gateway Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error("Failed to start GraphQL Gateway Server:", error);
    process.exit(1);
  }
}

/**
 * Check health of a microservice
 */
async function checkServiceHealth(
  url: string
): Promise<{ status: string; responseTime?: number }> {
  try {
    const axios = require("axios");
    const startTime = Date.now();
    const response = await axios.get(url, { timeout: 5000 });
    const responseTime = Date.now() - startTime;

    return {
      status: response.status === 200 ? "healthy" : "unhealthy",
      responseTime,
    };
  } catch (error) {
    return {
      status: "unhealthy",
    };
  }
}

/**
 * Translate GraphQL errors to Vietnamese
 */
function translateErrorToVietnamese(message: string): string {
  const translations: Record<string, string> = {
    "Cannot query field": "Không thể truy vấn trường",
    "Field is required": "Trường là bắt buộc",
    "Invalid input": "Dữ liệu đầu vào không hợp lệ",
    Unauthorized: "Yêu cầu xác thực",
    Forbidden: "Không có quyền truy cập",
    "Not found": "Không tìm thấy",
    "Internal server error": "Lỗi hệ thống",
    "Rate limit exceeded": "Vượt quá giới hạn yêu cầu",
    "Query too complex": "Truy vấn quá phức tạp",
    "Validation error": "Lỗi xác thực dữ liệu",
  };

  for (const [english, vietnamese] of Object.entries(translations)) {
    if (message.toLowerCase().includes(english.toLowerCase())) {
      return message.replace(new RegExp(english, "gi"), vietnamese);
    }
  }

  return message;
}

// Start the server
if (require.main === module) {
  startServer();
}

export default startServer;
