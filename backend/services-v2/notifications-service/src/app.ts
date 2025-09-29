/**
 * app.ts - Notifications Service Application
 * Main Express application setup with all middleware and routes
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Vietnamese Healthcare Standards, HIPAA Compliance
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer, Server as HTTPServer } from 'http';

// Middleware imports
import { authMiddleware } from './presentation/middleware/authMiddleware';
import { validationMiddleware } from './presentation/middleware/validationMiddleware';
import { rateLimitMiddleware, healthcareRateLimitMiddleware, ipRateLimitMiddleware } from './presentation/middleware/rateLimitMiddleware';
import { loggingMiddleware, auditLoggingMiddleware, errorLoggingMiddleware } from './presentation/middleware/loggingMiddleware';

// Routes imports
import notificationRoutes from './presentation/routes/notificationRoutes';

// Infrastructure imports
import { SupabaseNotificationRepository } from './infrastructure/persistence/SupabaseNotificationRepository';
import { MultiChannelDeliveryService } from './infrastructure/delivery/MultiChannelDeliveryService';
import { VietnameseTemplateService } from './infrastructure/templates/VietnameseTemplateService';
import { RealTimeNotificationService } from './infrastructure/realtime/RealTimeNotificationService';
import { EventBusIntegration } from './infrastructure/events/EventBusIntegration';
import { NotificationEventHandlers } from './infrastructure/events/NotificationEventHandlers';

// Application services imports
import { NotificationApplicationService } from './application/services/NotificationApplicationService';
import { NotificationCommandHandlers } from './application/handlers/NotificationCommandHandlers';
import { NotificationQueryHandlers } from './application/handlers/NotificationQueryHandlers';

// Use cases imports
import { SendNotificationUseCase } from './application/use-cases/SendNotificationUseCase';
import { ScheduleNotificationUseCase } from './application/use-cases/ScheduleNotificationUseCase';
import { ProcessNotificationQueueUseCase } from './application/use-cases/ProcessNotificationQueueUseCase';

export class NotificationServiceApp {
  private app: Application;
  private server: HTTPServer;
  private realTimeService: RealTimeNotificationService;
  private eventBusIntegration: EventBusIntegration;

  // Dependencies
  private notificationRepository: SupabaseNotificationRepository;
  private deliveryService: MultiChannelDeliveryService;
  private templateService: VietnameseTemplateService;
  private applicationService: NotificationApplicationService;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    
    this.initializeDependencies();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.initializeRealTimeService();
    this.initializeEventBus();
  }

  /**
   * Initialize all dependencies
   */
  private initializeDependencies(): void {
    console.log('🏗️ Initializing dependencies...');

    // Infrastructure layer
    this.notificationRepository = new SupabaseNotificationRepository();
    this.deliveryService = new MultiChannelDeliveryService();
    this.templateService = new VietnameseTemplateService();

    // Use cases
    const sendNotificationUseCase = new SendNotificationUseCase(
      this.notificationRepository,
      this.deliveryService,
      this.templateService
    );

    const scheduleNotificationUseCase = new ScheduleNotificationUseCase(
      this.notificationRepository,
      this.templateService
    );

    const processQueueUseCase = new ProcessNotificationQueueUseCase(
      this.notificationRepository,
      this.deliveryService
    );

    // Command and Query handlers
    const commandHandlers = new NotificationCommandHandlers(
      sendNotificationUseCase,
      scheduleNotificationUseCase,
      processQueueUseCase
    );

    const queryHandlers = new NotificationQueryHandlers(
      this.notificationRepository
    );

    // Application service
    this.applicationService = new NotificationApplicationService(
      commandHandlers,
      queryHandlers
    );

    console.log('✅ Dependencies initialized');
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    console.log('🛡️ Setting up middleware...');

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
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', 1);

    // Request logging
    this.app.use(loggingMiddleware);

    // IP-based rate limiting (applied first)
    this.app.use(ipRateLimitMiddleware);

    // General rate limiting
    this.app.use(rateLimitMiddleware);

    console.log('✅ Middleware setup completed');
  }

  /**
   * Setup application routes
   */
  private setupRoutes(): void {
    console.log('🛣️ Setting up routes...');

    // Health check endpoint (no authentication required)
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        service: 'notifications-service',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        realTimeConnections: this.realTimeService?.getConnectionStats() || null,
        eventBusStatus: this.eventBusIntegration?.getStatus() || null
      });
    });

    // API documentation endpoint
    this.app.get('/api-docs', (req: Request, res: Response) => {
      res.json({
        service: 'Notifications Service',
        version: '2.0.0',
        description: 'Vietnamese Healthcare Notification Service with multi-channel delivery',
        endpoints: {
          'POST /api/v1/notifications/send': 'Send immediate notification',
          'POST /api/v1/notifications/schedule': 'Schedule notification for future delivery',
          'POST /api/v1/notifications/bulk': 'Send bulk notifications',
          'GET /api/v1/notifications/patient/:patientId': 'Get patient notifications',
          'GET /api/v1/notifications/doctor/:doctorId': 'Get doctor notifications',
          'POST /api/v1/notifications/search': 'Search notifications',
          'GET /api/v1/notifications/analytics': 'Get notification analytics',
          'PUT /api/v1/notifications/:id/cancel': 'Cancel scheduled notification',
          'PUT /api/v1/notifications/:id/retry': 'Retry failed notification'
        },
        healthcareTemplates: [
          'APPOINTMENT_REMINDER',
          'TEST_RESULTS_READY',
          'PAYMENT_REMINDER',
          'EMERGENCY_ALERT',
          'MEDICATION_REMINDER'
        ],
        channels: ['EMAIL', 'SMS', 'PUSH', 'IN_APP', 'VOICE'],
        compliance: ['HIPAA', 'Vietnamese Healthcare Standards', 'BHYT/BHTN']
      });
    });

    // Main notification routes
    this.app.use('/api/v1/notifications', 
      authMiddleware,
      healthcareRateLimitMiddleware,
      auditLoggingMiddleware,
      notificationRoutes
    );

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint không tồn tại',
        error: 'NOT_FOUND',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    });

    console.log('✅ Routes setup completed');
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    console.log('🚨 Setting up error handling...');

    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('🚨 Unhandled error:', error);

      // Use error logging middleware
      errorLoggingMiddleware(error, req, res, next);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      console.error('🚨 Uncaught Exception:', error);
      // In production, you might want to restart the service
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
      // In production, you might want to restart the service
      process.exit(1);
    });

    console.log('✅ Error handling setup completed');
  }

  /**
   * Initialize real-time service
   */
  private initializeRealTimeService(): void {
    console.log('📡 Initializing real-time service...');

    this.realTimeService = new RealTimeNotificationService(
      this.server,
      this.applicationService
    );

    console.log('✅ Real-time service initialized');
  }

  /**
   * Initialize event bus integration
   */
  private async initializeEventBus(): Promise<void> {
    console.log('🚌 Initializing event bus integration...');

    try {
      const eventHandlers = new NotificationEventHandlers(this.applicationService);

      this.eventBusIntegration = new EventBusIntegration(
        {
          connectionUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
          exchangeName: 'hospital.events',
          queueName: 'notifications.queue',
          routingKeys: [
            'appointment.*',
            'medical-record.*',
            'billing.*',
            'emergency.*',
            'medication.*'
          ],
          retryAttempts: 3,
          retryDelay: 1000
        },
        eventHandlers,
        this.realTimeService
      );

      await this.eventBusIntegration.initialize();
      console.log('✅ Event bus integration initialized');

    } catch (error) {
      console.error('❌ Failed to initialize event bus:', error);
      // Continue without event bus in development
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  /**
   * Start the server
   */
  public async start(port: number = 3011): Promise<void> {
    try {
      console.log('🚀 Starting Notifications Service...');

      // Start HTTP server
      this.server.listen(port, () => {
        console.log(`✅ Notifications Service running on port ${port}`);
        console.log(`📊 Health check: http://localhost:${port}/health`);
        console.log(`📚 API docs: http://localhost:${port}/api-docs`);
        console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📡 Real-time notifications: WebSocket enabled`);
        console.log(`🚌 Event bus: ${this.eventBusIntegration ? 'Connected' : 'Disabled'}`);
      });

      // Graceful shutdown handling
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      throw error;
    }
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      console.log(`📴 Received ${signal}, starting graceful shutdown...`);

      try {
        // Close event bus connection
        if (this.eventBusIntegration) {
          await this.eventBusIntegration.close();
        }

        // Close HTTP server
        this.server.close(() => {
          console.log('✅ HTTP server closed');
          process.exit(0);
        });

        // Force close after 30 seconds
        setTimeout(() => {
          console.error('❌ Forced shutdown after timeout');
          process.exit(1);
        }, 30000);

      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  /**
   * Get Express app instance
   */
  public getApp(): Application {
    return this.app;
  }

  /**
   * Get HTTP server instance
   */
  public getServer(): HTTPServer {
    return this.server;
  }

  /**
   * Get real-time service instance
   */
  public getRealTimeService(): RealTimeNotificationService {
    return this.realTimeService;
  }

  /**
   * Get application service instance
   */
  public getApplicationService(): NotificationApplicationService {
    return this.applicationService;
  }
}
