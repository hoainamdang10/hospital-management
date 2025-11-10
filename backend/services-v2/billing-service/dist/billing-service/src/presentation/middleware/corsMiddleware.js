"use strict";
/**
 * corsMiddleware - Presentation Layer
 * CORS (Cross-Origin Resource Sharing) middleware for billing service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance CORS Security, Healthcare Data Protection, API Standards
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamicOrigin = exports.getCorsOptions = exports.developmentCors = exports.corsErrorHandler = exports.securityHeaders = exports.internalCors = exports.webhookCors = exports.preflightCors = exports.corsMiddleware = void 0;
const cors_1 = __importDefault(require("cors"));
/**
 * CORS configuration for different environments
 */
const getCorsOptions = () => {
    const environment = process.env.NODE_ENV || 'development';
    const baseOptions = {
        credentials: true, // Allow cookies and authorization headers
        optionsSuccessStatus: 200, // Support legacy browsers
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization',
            'X-API-Key',
            'X-Correlation-ID',
            'X-Request-ID',
            'X-User-Agent',
            'X-Forwarded-For',
            'X-Real-IP'
        ],
        exposedHeaders: [
            'X-Total-Count',
            'X-Page-Count',
            'X-Current-Page',
            'X-Per-Page',
            'X-RateLimit-Limit',
            'X-RateLimit-Remaining',
            'X-RateLimit-Reset',
            'X-Response-Time'
        ]
    };
    switch (environment) {
        case 'production':
            return {
                ...baseOptions,
                origin: [
                    'https://hospital.yourdomain.com',
                    'https://admin.hospital.yourdomain.com',
                    'https://api.hospital.yourdomain.com',
                    // Add your production domains here
                ]
            };
        case 'staging':
            return {
                ...baseOptions,
                origin: [
                    'https://staging.hospital.yourdomain.com',
                    'https://staging-admin.hospital.yourdomain.com',
                    'https://staging-api.hospital.yourdomain.com',
                    // Add your staging domains here
                ]
            };
        case 'development':
        default:
            return {
                ...baseOptions,
                origin: [
                    'http://localhost:3000', // Frontend development server
                    'http://localhost:3001', // Admin panel
                    'http://localhost:3100', // API Gateway
                    'http://localhost:3200', // GraphQL Gateway
                    'http://127.0.0.1:3000',
                    'http://127.0.0.1:3001',
                    'http://127.0.0.1:3100',
                    'http://127.0.0.1:3200',
                    // Add other development URLs as needed
                ]
            };
    }
};
exports.getCorsOptions = getCorsOptions;
/**
 * Dynamic CORS origin validation
 */
const dynamicOrigin = (origin, callback) => {
    const corsOptions = getCorsOptions();
    const allowedOrigins = corsOptions.origin;
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
        return callback(null, true);
    }
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
        return callback(null, true);
    }
    // For development, allow localhost with any port
    if (process.env.NODE_ENV === 'development') {
        const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
        if (localhostRegex.test(origin)) {
            return callback(null, true);
        }
    }
    // Log blocked origin for security monitoring
    console.warn(`CORS: Blocked origin ${origin}`);
    const error = new Error(`CORS: Origin ${origin} not allowed`);
    callback(error, false);
};
exports.dynamicOrigin = dynamicOrigin;
/**
 * Main CORS middleware
 */
exports.corsMiddleware = (0, cors_1.default)({
    ...getCorsOptions(),
    origin: dynamicOrigin
});
/**
 * Preflight CORS middleware for complex requests
 */
const preflightCors = (req, res, next) => {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        const corsOptions = getCorsOptions();
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
        res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', '86400'); // 24 hours
        return res.status(200).end();
    }
    next();
};
exports.preflightCors = preflightCors;
/**
 * Webhook CORS middleware (more permissive for external services)
 */
exports.webhookCors = (0, cors_1.default)({
    origin: true, // Allow all origins for webhooks
    credentials: false, // No credentials needed for webhooks
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'X-Signature',
        'X-PayOS-Signature',
        'X-BHYT-Signature',
        'X-BHTN-Signature',
        'User-Agent',
        'X-Forwarded-For'
    ]
});
/**
 * API Gateway CORS middleware (for internal service communication)
 */
exports.internalCors = (0, cors_1.default)({
    origin: [
        'http://localhost:3100', // API Gateway
        'http://localhost:3200', // GraphQL Gateway
        'http://api-gateway:3100', // Docker internal
        'http://graphql-gateway:3200', // Docker internal
        // Add internal service URLs
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-API-Key',
        'X-Service-Name',
        'X-Correlation-ID',
        'X-Request-ID'
    ]
});
/**
 * Security headers middleware (works with CORS)
 */
const securityHeaders = (req, res, next) => {
    // Security headers for healthcare data protection
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    // HIPAA compliance headers
    res.setHeader('X-Healthcare-Data', 'protected');
    res.setHeader('X-Data-Classification', 'confidential');
    // Cache control for sensitive data
    if (req.path.includes('/patients/') || req.path.includes('/invoices/')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
};
exports.securityHeaders = securityHeaders;
/**
 * CORS error handler
 */
const corsErrorHandler = (err, req, res, next) => {
    if (err && err.message && err.message.includes('CORS')) {
        return res.status(403).json({
            success: false,
            error: {
                code: 'CORS_ERROR',
                message: 'Yêu cầu từ nguồn không được phép',
                details: {
                    origin: req.headers.origin,
                    method: req.method,
                    path: req.path
                }
            }
        });
    }
    next(err);
};
exports.corsErrorHandler = corsErrorHandler;
/**
 * Development CORS middleware (very permissive)
 */
exports.developmentCors = (0, cors_1.default)({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: '*',
    exposedHeaders: '*'
});
//# sourceMappingURL=corsMiddleware.js.map