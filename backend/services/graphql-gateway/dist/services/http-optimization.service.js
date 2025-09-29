"use strict";
/**
 * HTTP Optimization Service
 * Implements HTTP/2, connection pooling, and compression for better performance
 */
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
exports.httpOptimizationService = exports.HttpOptimizationService = void 0;
exports.createHttpOptimizationMiddleware = createHttpOptimizationMiddleware;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const compression_1 = __importDefault(require("compression"));
const http_1 = __importStar(require("http"));
const http2_1 = __importDefault(require("http2"));
const https_1 = require("https");
const performance_config_1 = require("../config/performance.config");
class HttpOptimizationService {
    constructor() {
        this.httpAgent = new http_1.Agent({ keepAlive: true });
        this.httpsAgent = new https_1.Agent({ keepAlive: true });
        this.http2Sessions = new Map();
        this.initializeAgents();
    }
    /**
     * Initialize HTTP agents with connection pooling
     */
    initializeAgents() {
        // HTTP Agent with keep-alive and connection pooling
        this.httpAgent = new http_1.Agent({
            keepAlive: true,
            keepAliveMsecs: 30000,
            maxSockets: performance_config_1.performanceConfig.connectionPool.maxConnections,
            maxFreeSockets: 10,
            timeout: performance_config_1.performanceConfig.connectionPool.timeout,
        });
        // HTTPS Agent with keep-alive and connection pooling
        this.httpsAgent = new https_1.Agent({
            keepAlive: true,
            keepAliveMsecs: 30000,
            maxSockets: performance_config_1.performanceConfig.connectionPool.maxConnections,
            maxFreeSockets: 10,
            timeout: performance_config_1.performanceConfig.connectionPool.timeout,
            rejectUnauthorized: process.env.NODE_ENV === "production",
        });
        logger_1.default.info("🚀 HTTP Optimization Service initialized with connection pooling");
    }
    /**
     * Setup compression middleware
     */
    setupCompression(app) {
        if (!performance_config_1.performanceConfig.http.compression) {
            return;
        }
        app.use((0, compression_1.default)({
            level: performance_config_1.httpOptimization.compression.level,
            threshold: performance_config_1.httpOptimization.compression.threshold,
            filter: performance_config_1.httpOptimization.compression.filter,
        }));
        logger_1.default.info("📦 Compression middleware enabled");
    }
    /**
     * Create HTTP/2 server
     */
    createHttp2Server(app) {
        if (!performance_config_1.performanceConfig.http.http2 ||
            process.env.NODE_ENV !== "production") {
            // Use regular HTTP server for development
            return http_1.default.createServer(app);
        }
        try {
            // In production, use HTTP/2 with SSL
            const server = http2_1.default.createSecureServer({
            // SSL certificates would be loaded here
            // cert: fs.readFileSync('path/to/cert.pem'),
            // key: fs.readFileSync('path/to/key.pem'),
            }, app);
            logger_1.default.info("🚀 HTTP/2 server created");
            return server;
        }
        catch (error) {
            logger_1.default.warn("⚠️ Failed to create HTTP/2 server, falling back to HTTP/1.1:", error);
            return http_1.default.createServer(app);
        }
    }
    /**
     * Get optimized HTTP agent
     */
    getHttpAgent() {
        return this.httpAgent;
    }
    /**
     * Get optimized HTTPS agent
     */
    getHttpsAgent() {
        return this.httpsAgent;
    }
    /**
     * Create HTTP/2 session for service communication
     */
    async createHttp2Session(url) {
        if (this.http2Sessions.has(url)) {
            return this.http2Sessions.get(url);
        }
        try {
            const session = http2_1.default.connect(url);
            this.http2Sessions.set(url, session);
            // Handle session events
            session.on("error", (error) => {
                logger_1.default.error(`HTTP/2 session error for ${url}:`, error);
                this.http2Sessions.delete(url);
            });
            session.on("close", () => {
                logger_1.default.debug(`HTTP/2 session closed for ${url}`);
                this.http2Sessions.delete(url);
            });
            logger_1.default.info(`🔗 HTTP/2 session created for ${url}`);
            return session;
        }
        catch (error) {
            logger_1.default.error(`Failed to create HTTP/2 session for ${url}:`, error);
            throw error;
        }
    }
    /**
     * Optimized fetch with connection reuse
     */
    async optimizedFetch(url, options = {}) {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === "https:";
        // Use appropriate agent for connection pooling
        const agent = isHttps ? this.httpsAgent : this.httpAgent;
        const fetchOptions = {
            ...options,
            agent,
            headers: {
                Connection: "keep-alive",
                "Keep-Alive": "timeout=30, max=100",
                ...options.headers,
            },
        };
        try {
            const response = await fetch(url, fetchOptions);
            return response;
        }
        catch (error) {
            logger_1.default.error(`Optimized fetch failed for ${url}:`, error);
            throw error;
        }
    }
    /**
     * Setup request optimization middleware
     */
    setupRequestOptimization(app) {
        // Request size limits
        app.use((req, res, next) => {
            // Set response headers for optimization
            res.setHeader("Connection", "keep-alive");
            res.setHeader("Keep-Alive", "timeout=30, max=100");
            // Enable HTTP/2 server push hints (if supported)
            if (req.httpVersion === "2.0") {
                res.setHeader("Link", "</graphql>; rel=preload; as=fetch");
            }
            next();
        });
        logger_1.default.info("⚡ Request optimization middleware enabled");
    }
    /**
     * Monitor connection pool health
     */
    getConnectionPoolStats() {
        return {
            http: {
                sockets: Object.keys(this.httpAgent.sockets).length,
                freeSockets: Object.keys(this.httpAgent.freeSockets).length,
                requests: Object.keys(this.httpAgent.requests).length,
            },
            https: {
                sockets: Object.keys(this.httpsAgent.sockets).length,
                freeSockets: Object.keys(this.httpsAgent.freeSockets).length,
                requests: Object.keys(this.httpsAgent.requests).length,
            },
            http2Sessions: this.http2Sessions.size,
        };
    }
    /**
     * Cleanup resources
     */
    cleanup() {
        // Close HTTP/2 sessions
        this.http2Sessions.forEach((session, url) => {
            try {
                session.close();
                logger_1.default.debug(`Closed HTTP/2 session for ${url}`);
            }
            catch (error) {
                logger_1.default.error(`Error closing HTTP/2 session for ${url}:`, error);
            }
        });
        this.http2Sessions.clear();
        // Destroy HTTP agents
        this.httpAgent.destroy();
        this.httpsAgent.destroy();
        logger_1.default.info("🧹 HTTP Optimization Service cleaned up");
    }
    /**
     * Performance monitoring
     */
    startPerformanceMonitoring() {
        setInterval(() => {
            const stats = this.getConnectionPoolStats();
            logger_1.default.debug("📊 Connection Pool Stats:", {
                httpSockets: stats.http.sockets,
                httpFreeSockets: stats.http.freeSockets,
                httpsPendingRequests: stats.https.requests,
                http2Sessions: stats.http2Sessions,
            });
            // Alert if connection pool is getting full
            const totalConnections = stats.http.sockets + stats.https.sockets;
            const maxConnections = performance_config_1.performanceConfig.connectionPool.maxConnections;
            if (totalConnections > maxConnections * 0.8) {
                logger_1.default.warn("⚠️ Connection pool usage high:", {
                    current: totalConnections,
                    max: maxConnections,
                    usage: `${((totalConnections / maxConnections) * 100).toFixed(1)}%`,
                });
            }
        }, 60000); // Check every minute
        logger_1.default.info("📈 Performance monitoring started");
    }
}
exports.HttpOptimizationService = HttpOptimizationService;
// Singleton instance
exports.httpOptimizationService = new HttpOptimizationService();
/**
 * Express middleware factory for HTTP optimization
 */
function createHttpOptimizationMiddleware() {
    return (req, res, next) => {
        // Add optimization headers
        res.setHeader("X-Powered-By", "Hospital-GraphQL-Gateway");
        res.setHeader("X-Response-Time-Start", Date.now());
        // Track response time
        const originalSend = res.send;
        res.send = function (data) {
            const responseTime = Date.now() - res.getHeader("X-Response-Time-Start");
            res.setHeader("X-Response-Time", `${responseTime}ms`);
            // Log slow responses
            if (responseTime > 1000) {
                logger_1.default.warn("🐌 Slow response detected:", {
                    url: req.url,
                    method: req.method,
                    responseTime: `${responseTime}ms`,
                    userAgent: req.get("User-Agent"),
                });
            }
            return originalSend.call(this, data);
        };
        next();
    };
}
//# sourceMappingURL=http-optimization.service.js.map