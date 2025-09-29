/**
 * Scheduling Service Application - V2 Clean Architecture
 * Hospital Management System - Scheduling Microservice
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { DIContainer } from '../shared/infrastructure/di/container';
import { setupDependencies } from './infrastructure/di/setup';
import { createSchedulingRoutes } from './presentation/routes/schedulingRoutes';
import { 
  errorHandlingMiddleware, 
  notFoundHandler, 
  handleValidationError,
  requestTimeoutHandler 
} from './presentation/middleware/ErrorHandlingMiddleware';
import { sanitizeRequest } from './presentation/middleware/ValidationMiddleware';

/**
 * Scheduling Service Application
 */
export class SchedulingServiceApp {
  private app: express.Application;
  private container: DIContainer;
  private server: any;

  constructor() {
    this.app = express();
    this.container = new DIContainer();
  }

  /**
   * Initialize the application
   */
  public async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Scheduling Service...');

      // Setup dependency injection
      await this.setupDependencyInjection();

      // Setup middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Setup error handling
      this.setupErrorHandling();

      console.log('✅ Scheduling Service initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Scheduling Service:', error);
      throw error;
    }
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    const port = process.env.SCHEDULING_SERVICE_PORT || 3004;
    
    try {
      this.server = this.app.listen(port, () => {
        console.log(`🏥 Scheduling Service running on port ${port}`);
        console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Health check: http://localhost:${port}/api/v1/scheduling/health`);
        console.log(`📊 Metrics: http://localhost:${port}/api/v1/scheduling/metrics`);
        console.log(`📋 Features: Appointments, Slots, Availability, Queue Management`);
        console.log(`🎯 Patterns: Command, Event-Driven, Workflow`);
      });

      // Handle graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('❌ Failed to start Scheduling Service:', error);
      throw error;
    }
  }

  /**
   * Stop the server
   */
  public async stop(): Promise<void> {
    if (this.server) {
      console.log('🛑 Stopping Scheduling Service...');
      
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('✅ Scheduling Service stopped');
          resolve(undefined);
        });
      });
    }
  }

  /**
   * Setup dependency injection
   */
  private async setupDependencyInjection(): Promise<void> {
    console.log('📦 Setting up dependency injection...');
    setupDependencies(this.container);
    console.log('✅ Dependency injection setup complete');
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    console.log('🔧 Setting up middleware...');

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Compression
    this.app.use(compression());

    // Request logging
    this.app.use(morgan('combined'));

    // Request parsing
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    // Request timeout
    this.app.use(requestTimeoutHandler(30000)); // 30 seconds

    // Request sanitization
    this.app.use(sanitizeRequest);

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });

    console.log('✅ Middleware setup complete');
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    console.log('🛣️ Setting up routes...');

    // API routes
    this.app.use('/api/v1/scheduling', createSchedulingRoutes(this.container));

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'Scheduling Service',
        version: '2.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        port: process.env.SCHEDULING_SERVICE_PORT || 3004,
        features: ["Appointments", "Slots", "Availability", "Queue Management"],
        patterns: ["Command", "Event-Driven", "Workflow"],
        endpoints: {
          health: '/api/v1/scheduling/health',
          metrics: '/api/v1/scheduling/metrics',
          appointments: '/api/v1/scheduling/appointments',
          availability: '/api/v1/scheduling/availability'
        }
      });
    });

    console.log('✅ Routes setup complete');
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    console.log('🚨 Setting up error handling...');

    // Validation error handler
    this.app.use(handleValidationError);

    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandlingMiddleware);

    console.log('✅ Error handling setup complete');
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      console.log(`📡 Received ${signal}, starting graceful shutdown...`);
      
      try {
        await this.stop();
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  /**
   * Get Express app instance
   */
  public getApp(): express.Application {
    return this.app;
  }

  /**
   * Get DI container instance
   */
  public getContainer(): DIContainer {
    return this.container;
  }
}

/**
 * Start the application
 */
export async function startSchedulingService(): Promise<SchedulingServiceApp> {
  const app = new SchedulingServiceApp();
  
  try {
    await app.initialize();
    await app.start();
    return app;
  } catch (error) {
    console.error('💥 Failed to start Scheduling Service:', error);
    throw error;
  }
}

// Start the application if this file is run directly
if (require.main === module) {
  startSchedulingService().catch((error) => {
    console.error('💥 Application startup failed:', error);
    process.exit(1);
  });
}
