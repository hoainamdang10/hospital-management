/**
 * HTTP Optimization Service
 * Implements HTTP/2, connection pooling, and compression for better performance
 */

import logger from "@hospital/shared/dist/utils/logger";
import compression from "compression";
import { Express } from "express";
import http, { Agent as HttpAgent } from "http";
import http2 from "http2";
import { Agent as HttpsAgent } from "https";
import {
  httpOptimization,
  performanceConfig,
} from "../config/performance.config";

export class HttpOptimizationService {
  private httpAgent: HttpAgent = new HttpAgent({ keepAlive: true });
  private httpsAgent: HttpsAgent = new HttpsAgent({ keepAlive: true });
  private http2Sessions: Map<string, any> = new Map();

  constructor() {
    this.initializeAgents();
  }

  /**
   * Initialize HTTP agents with connection pooling
   */
  private initializeAgents(): void {
    // HTTP Agent with keep-alive and connection pooling
    this.httpAgent = new HttpAgent({
      keepAlive: true,
      keepAliveMsecs: 30000,
      maxSockets: performanceConfig.connectionPool.maxConnections,
      maxFreeSockets: 10,
      timeout: performanceConfig.connectionPool.timeout,
    });

    // HTTPS Agent with keep-alive and connection pooling
    this.httpsAgent = new HttpsAgent({
      keepAlive: true,
      keepAliveMsecs: 30000,
      maxSockets: performanceConfig.connectionPool.maxConnections,
      maxFreeSockets: 10,
      timeout: performanceConfig.connectionPool.timeout,
      rejectUnauthorized: process.env.NODE_ENV === "production",
    });

    logger.info(
      "🚀 HTTP Optimization Service initialized with connection pooling"
    );
  }

  /**
   * Setup compression middleware
   */
  setupCompression(app: Express): void {
    if (!performanceConfig.http.compression) {
      return;
    }

    app.use(
      compression({
        level: httpOptimization.compression.level,
        threshold: httpOptimization.compression.threshold,
        filter: httpOptimization.compression.filter,
      })
    );

    logger.info("📦 Compression middleware enabled");
  }

  /**
   * Create HTTP/2 server
   */
  createHttp2Server(app: Express): http2.Http2SecureServer | http.Server {
    if (
      !performanceConfig.http.http2 ||
      process.env.NODE_ENV !== "production"
    ) {
      // Use regular HTTP server for development
      return http.createServer(app);
    }

    try {
      // In production, use HTTP/2 with SSL
      const server = http2.createSecureServer(
        {
          // SSL certificates would be loaded here
          // cert: fs.readFileSync('path/to/cert.pem'),
          // key: fs.readFileSync('path/to/key.pem'),
        },
        app as any
      );

      logger.info("🚀 HTTP/2 server created");
      return server;
    } catch (error) {
      logger.warn(
        "⚠️ Failed to create HTTP/2 server, falling back to HTTP/1.1:",
        error
      );
      return http.createServer(app);
    }
  }

  /**
   * Get optimized HTTP agent
   */
  getHttpAgent(): HttpAgent {
    return this.httpAgent;
  }

  /**
   * Get optimized HTTPS agent
   */
  getHttpsAgent(): HttpsAgent {
    return this.httpsAgent;
  }

  /**
   * Create HTTP/2 session for service communication
   */
  async createHttp2Session(url: string): Promise<any> {
    if (this.http2Sessions.has(url)) {
      return this.http2Sessions.get(url);
    }

    try {
      const session = http2.connect(url);
      this.http2Sessions.set(url, session);

      // Handle session events
      session.on("error", (error: Error) => {
        logger.error(`HTTP/2 session error for ${url}:`, error);
        this.http2Sessions.delete(url);
      });

      session.on("close", () => {
        logger.debug(`HTTP/2 session closed for ${url}`);
        this.http2Sessions.delete(url);
      });

      logger.info(`🔗 HTTP/2 session created for ${url}`);
      return session;
    } catch (error) {
      logger.error(`Failed to create HTTP/2 session for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Optimized fetch with connection reuse
   */
  async optimizedFetch(url: string, options: any = {}): Promise<Response> {
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
    } catch (error) {
      logger.error(`Optimized fetch failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Setup request optimization middleware
   */
  setupRequestOptimization(app: Express): void {
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

    logger.info("⚡ Request optimization middleware enabled");
  }

  /**
   * Monitor connection pool health
   */
  getConnectionPoolStats(): any {
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
  cleanup(): void {
    // Close HTTP/2 sessions
    this.http2Sessions.forEach((session, url) => {
      try {
        session.close();
        logger.debug(`Closed HTTP/2 session for ${url}`);
      } catch (error) {
        logger.error(`Error closing HTTP/2 session for ${url}:`, error);
      }
    });
    this.http2Sessions.clear();

    // Destroy HTTP agents
    this.httpAgent.destroy();
    this.httpsAgent.destroy();

    logger.info("🧹 HTTP Optimization Service cleaned up");
  }

  /**
   * Performance monitoring
   */
  startPerformanceMonitoring(): void {
    setInterval(() => {
      const stats = this.getConnectionPoolStats();

      logger.debug("📊 Connection Pool Stats:", {
        httpSockets: stats.http.sockets,
        httpFreeSockets: stats.http.freeSockets,
        httpsPendingRequests: stats.https.requests,
        http2Sessions: stats.http2Sessions,
      });

      // Alert if connection pool is getting full
      const totalConnections = stats.http.sockets + stats.https.sockets;
      const maxConnections = performanceConfig.connectionPool.maxConnections;

      if (totalConnections > maxConnections * 0.8) {
        logger.warn("⚠️ Connection pool usage high:", {
          current: totalConnections,
          max: maxConnections,
          usage: `${((totalConnections / maxConnections) * 100).toFixed(1)}%`,
        });
      }
    }, 60000); // Check every minute

    logger.info("📈 Performance monitoring started");
  }
}

// Singleton instance
export const httpOptimizationService = new HttpOptimizationService();

/**
 * Express middleware factory for HTTP optimization
 */
export function createHttpOptimizationMiddleware() {
  return (req: any, res: any, next: any) => {
    // Add optimization headers
    res.setHeader("X-Powered-By", "Hospital-GraphQL-Gateway");
    res.setHeader("X-Response-Time-Start", Date.now());

    // Track response time
    const originalSend = res.send;
    res.send = function (data: any) {
      const responseTime = Date.now() - res.getHeader("X-Response-Time-Start");
      res.setHeader("X-Response-Time", `${responseTime}ms`);

      // Log slow responses
      if (responseTime > 1000) {
        logger.warn("🐌 Slow response detected:", {
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
