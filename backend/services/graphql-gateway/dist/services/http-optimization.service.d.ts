/**
 * HTTP Optimization Service
 * Implements HTTP/2, connection pooling, and compression for better performance
 */
import { Express } from "express";
import http, { Agent as HttpAgent } from "http";
import http2 from "http2";
import { Agent as HttpsAgent } from "https";
export declare class HttpOptimizationService {
    private httpAgent;
    private httpsAgent;
    private http2Sessions;
    constructor();
    /**
     * Initialize HTTP agents with connection pooling
     */
    private initializeAgents;
    /**
     * Setup compression middleware
     */
    setupCompression(app: Express): void;
    /**
     * Create HTTP/2 server
     */
    createHttp2Server(app: Express): http2.Http2SecureServer | http.Server;
    /**
     * Get optimized HTTP agent
     */
    getHttpAgent(): HttpAgent;
    /**
     * Get optimized HTTPS agent
     */
    getHttpsAgent(): HttpsAgent;
    /**
     * Create HTTP/2 session for service communication
     */
    createHttp2Session(url: string): Promise<any>;
    /**
     * Optimized fetch with connection reuse
     */
    optimizedFetch(url: string, options?: any): Promise<Response>;
    /**
     * Setup request optimization middleware
     */
    setupRequestOptimization(app: Express): void;
    /**
     * Monitor connection pool health
     */
    getConnectionPoolStats(): any;
    /**
     * Cleanup resources
     */
    cleanup(): void;
    /**
     * Performance monitoring
     */
    startPerformanceMonitoring(): void;
}
export declare const httpOptimizationService: HttpOptimizationService;
/**
 * Express middleware factory for HTTP optimization
 */
export declare function createHttpOptimizationMiddleware(): (req: any, res: any, next: any) => void;
//# sourceMappingURL=http-optimization.service.d.ts.map