/**
 * corsMiddleware - Presentation Layer
 * CORS (Cross-Origin Resource Sharing) middleware for billing service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance CORS Security, Healthcare Data Protection, API Standards
 */
import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
/**
 * CORS configuration for different environments
 */
declare const getCorsOptions: () => {
    origin: string[];
    credentials: boolean;
    optionsSuccessStatus: number;
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
};
/**
 * Dynamic CORS origin validation
 */
declare const dynamicOrigin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
/**
 * Main CORS middleware
 */
export declare const corsMiddleware: (req: cors.CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void;
/**
 * Preflight CORS middleware for complex requests
 */
export declare const preflightCors: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Webhook CORS middleware (more permissive for external services)
 */
export declare const webhookCors: (req: cors.CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void;
/**
 * API Gateway CORS middleware (for internal service communication)
 */
export declare const internalCors: (req: cors.CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void;
/**
 * Security headers middleware (works with CORS)
 */
export declare const securityHeaders: (req: Request, res: Response, next: NextFunction) => void;
/**
 * CORS error handler
 */
export declare const corsErrorHandler: (err: any, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Development CORS middleware (very permissive)
 */
export declare const developmentCors: (req: cors.CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void;
export { getCorsOptions, dynamicOrigin, preflightCors, webhookCors, internalCors, securityHeaders, corsErrorHandler, developmentCors };
//# sourceMappingURL=corsMiddleware.d.ts.map