"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const drainHttpServer_1 = require("@apollo/server/plugin/drainHttpServer");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const morgan_1 = __importDefault(require("morgan"));
// Import shared utilities
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const response_helpers_1 = require("@hospital/shared/dist/utils/response-helpers");
// import { addRequestId } from '@hospital/shared/dist/middleware/request-id'; // Not available
// Import GraphQL context
const context_1 = require("./context");
// Load environment variables
dotenv_1.default.config();
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
        const app = (0, express_1.default)();
        // Create HTTP server first
        const httpServer = (0, http_1.createServer)(app);
        // Initialize ResponseHelper
        response_helpers_1.EnhancedResponseHelper.initialize(SERVICE_NAME, SERVICE_VERSION);
        // Security middleware
        app.use((0, helmet_1.default)({
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
        }));
        app.use((0, cors_1.default)({
            origin: process.env.CORS_ORIGIN || [
                "http://localhost:3000",
                "http://localhost:3100",
            ],
            credentials: true,
        }));
        // General middleware
        // app.use(addRequestId); // Not available
        app.use((0, morgan_1.default)("combined"));
        app.use(express_1.default.json({ limit: "10mb" }));
        app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
        // Import the fixed schema and resolvers
        const { typeDefs } = await Promise.resolve().then(() => __importStar(require("./schema/index.js")));
        const { resolvers } = await Promise.resolve().then(() => __importStar(require("./resolvers/index.js")));
        // Create Apollo Server with full schema
        const apolloServer = new server_1.ApolloServer({
            typeDefs,
            resolvers,
            plugins: [
                (0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer }),
                // Custom error formatting plugin
                {
                    async requestDidStart() {
                        return {
                            async didEncounterErrors(requestContext) {
                                // Log GraphQL errors
                                requestContext.errors?.forEach((error) => {
                                    logger_1.default.error("GraphQL Error:", {
                                        message: error.message,
                                        path: error.path,
                                        source: error.source?.body,
                                        positions: error.positions,
                                    });
                                });
                            },
                            async willSendResponse(requestContext) {
                                // Add error handling
                                if (requestContext.response.errors) {
                                    logger_1.default.error("GraphQL Response Errors:", requestContext.response.errors);
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
        app.use("/graphql", (0, cors_1.default)(), express_1.default.json(), (0, express4_1.expressMiddleware)(apolloServer, {
            context: async ({ req, res }) => {
                return await (0, context_1.createContext)({ req, res });
            },
        }));
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
            }
            catch (error) {
                logger_1.default.error("Health check error:", error);
                res.status(503).json({
                    status: "unhealthy",
                    error: error.message,
                    timestamp: new Date().toISOString(),
                });
            }
            // Prometheus metrics endpoint
            app.get("/metrics", async (_req, res) => {
                try {
                    const { register } = await Promise.resolve().then(() => __importStar(require("prom-client")));
                    res.set("Content-Type", register.contentType);
                    res.end(await register.metrics());
                }
                catch (error) {
                    logger_1.default.error("Metrics endpoint error:", error);
                    res.status(500).json({ error: "Failed to collect metrics" });
                }
            });
        });
        // GraphQL Playground redirect
        app.get("/", (req, res) => {
            if (process.env.NODE_ENV !== "production") {
                res.redirect("/graphql");
            }
            else {
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
            logger_1.default.info(`🚀 GraphQL Gateway Server ready!`);
            logger_1.default.info(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
            logger_1.default.info(`🎮 GraphQL Playground: http://localhost:${PORT}/graphql`);
            logger_1.default.info(`🔌 WebSocket subscriptions: ws://localhost:${PORT}/graphql`);
            logger_1.default.info(`❤️ Health check: http://localhost:${PORT}/health`);
            logger_1.default.info(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
            logger_1.default.info(`🇻🇳 Vietnamese support: Enabled`);
        });
        // Graceful shutdown
        process.on("SIGTERM", async () => {
            logger_1.default.info("SIGTERM received, shutting down gracefully");
            await apolloServer.stop();
            httpServer.close(() => {
                logger_1.default.info("GraphQL Gateway Server closed");
                process.exit(0);
            });
        });
    }
    catch (error) {
        logger_1.default.error("Failed to start GraphQL Gateway Server:", error);
        process.exit(1);
    }
}
/**
 * Check health of a microservice
 */
async function checkServiceHealth(url) {
    try {
        const axios = require("axios");
        const startTime = Date.now();
        const response = await axios.get(url, { timeout: 5000 });
        const responseTime = Date.now() - startTime;
        return {
            status: response.status === 200 ? "healthy" : "unhealthy",
            responseTime,
        };
    }
    catch (error) {
        return {
            status: "unhealthy",
        };
    }
}
/**
 * Translate GraphQL errors to Vietnamese
 */
function translateErrorToVietnamese(message) {
    const translations = {
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
exports.default = startServer;
//# sourceMappingURL=index.js.map