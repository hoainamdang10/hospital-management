/**
 * Application Builder
 * Constructs Express application with middleware and configuration
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { ILogger } from '../application/services/ILogger';
import { AppConfig } from './config';
import { createRequestIdMiddleware } from '../presentation/middleware/RequestIdMiddleware';
import { createMetricsAuthMiddleware } from '../presentation/middleware/MetricsAuthMiddleware';

/**
 * Application Builder
 * Configures Express app with all necessary middleware
 */
export class AppBuilder {
  private app: Application;

  constructor(
    private config: AppConfig,
    private logger: ILogger
  ) {
    this.app = express();
  }

  /**
   * Build and configure Express application
   */
  public build(): Application {
    this.setupBasicMiddleware();
    this.setupSecurityMiddleware();
    this.setupRequestLogging();
    
    return this.app;
  }

  /**
   * Setup basic middleware (body parsing, compression)
   */
  private setupBasicMiddleware(): void {
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Compression
    this.app.use(compression());
    
    this.logger.info('Basic middleware configured');
  }

  /**
   * Setup security middleware (CORS, Helmet, Rate Limiting)
   */
  private setupSecurityMiddleware(): void {
    // CORS
    this.app.use(cors({
      origin: this.config.allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id']
    }));

    // Helmet for security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:']
        }
      }
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);

    this.logger.info('Security middleware configured', {
      allowedOrigins: this.config.allowedOrigins,
      rateLimitWindow: '15 minutes',
      rateLimitMax: 100
    });
  }

  /**
   * Setup request logging and tracing
   */
  private setupRequestLogging(): void {
    // Request ID middleware
    this.app.use(createRequestIdMiddleware(this.logger));
    
    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        const logger = req.logger || this.logger;
        
        logger.info('HTTP Request', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.headers['user-agent']
        });
      });
      
      next();
    });

    this.logger.info('Request logging configured');
  }

  /**
   * Get metrics auth middleware
   */
  public getMetricsAuthMiddleware() {
    return createMetricsAuthMiddleware({
      enabled: this.config.metricsAuthEnabled,
      authToken: this.config.metricsAuthToken,
      allowedIPs: ['127.0.0.1', '::1', '::ffff:127.0.0.1'] // localhost
    }, this.logger);
  }

  /**
   * Get the Express application instance
   */
  public getApp(): Application {
    return this.app;
  }
}

