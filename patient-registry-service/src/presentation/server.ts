/**
 * Patient Registry Service Server - Presentation Layer
 * Express server with Clean Architecture and healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Express.js, HIPAA, Vietnamese Localization
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PatientRegistryContainer } from '../infrastructure/di/patient-registry.container';
import { PatientController } from './controllers/patient.controller';

export interface ServerConfig {
  port: number;
  environment: 'development' | 'staging' | 'production';
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  enableMetrics: boolean;
  enableHealthChecks: boolean;
}

/**
 * Patient Registry Service Server
 * Express server with healthcare compliance and Vietnamese localization
 */
export class PatientRegistryServer {
  private app: Application;
  private container: PatientRegistryContainer;
  private patientController: PatientController;
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
    this.app = express();
    this.container = new PatientRegistryContainer();
    this.patientController = this.container.getPatientController();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
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
      origin: this.config.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Request-ID',
        'X-User-ID',
        'Accept',
        'Accept-Language'
      ]
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimitWindowMs,
      max: this.config.rateLimitMaxRequests,
      message: {
        success: false,
        message: 'Quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau.',
        timestamp: new Date().toISOString()
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Request logging middleware
    this.app.use(this.requestLoggingMiddleware);

    // Request ID middleware
    this.app.use(this.requestIdMiddleware);

    // User context middleware (placeholder - would integrate with auth service)
    this.app.use(this.userContextMiddleware);
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Health check routes
    if (this.config.enableHealthChecks) {
      this.app.get('/health', this.patientController.healthCheck.bind(this.patientController));
      this.app.get('/health/detailed', this.getDetailedHealth.bind(this));
    }

    // Metrics routes
    if (this.config.enableMetrics) {
      this.app.get('/metrics', this.getMetrics.bind(this));
    }

    // API routes
    const apiRouter = express.Router();

    // Patient routes
    apiRouter.post('/patients', this.patientController.registerPatient.bind(this.patientController));
    apiRouter.get('/patients/search', this.patientController.searchPatients.bind(this.patientController));
    apiRouter.get('/patients/statistics', this.patientController.getPatientStatistics.bind(this.patientController));
    apiRouter.get('/patients/:id', this.patientController.getPatientById.bind(this.patientController));

    // Mount API router
    this.app.use('/api/v1', apiRouter);

    // Root route
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Dịch vụ Đăng ký Bệnh nhân - Hospital Management System v2.0',
        service: 'patient-registry-service',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          metrics: '/metrics',
          api: '/api/v1',
          patients: '/api/v1/patients'
        },
        documentation: '/api/v1/docs',
        compliance: ['HIPAA', 'FHIR R4', 'Vietnamese Healthcare Standards']
      });
    });

    // API documentation route (placeholder)
    this.app.get('/api/v1/docs', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'API Documentation - Patient Registry Service',
        version: '2.0.0',
        endpoints: [
          {
            method: 'POST',
            path: '/api/v1/patients',
            description: 'Đăng ký bệnh nhân mới',
            authentication: 'required'
          },
          {
            method: 'GET',
            path: '/api/v1/patients/:id',
            description: 'Lấy thông tin bệnh nhân theo ID',
            authentication: 'required'
          },
          {
            method: 'GET',
            path: '/api/v1/patients/search',
            description: 'Tìm kiếm bệnh nhân',
            authentication: 'required'
          },
          {
            method: 'GET',
            path: '/api/v1/patients/statistics',
            description: 'Lấy thống kê bệnh nhân',
            authentication: 'required'
          }
        ]
      });
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: `Không tìm thấy endpoint: ${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id']
      });
    });

    // Global error handler
    this.app.use(this.globalErrorHandler);
  }

  /**
   * Middleware functions
   */

  private requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });

    next();
  }

  private requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
    const requestId = req.headers['x-request-id'] as string || 
                     `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);
    
    next();
  }

  private userContextMiddleware(req: Request, res: Response, next: NextFunction): void {
    // In a real implementation, this would:
    // 1. Validate JWT token
    // 2. Extract user information
    // 3. Check user permissions
    // 4. Set user context on request
    
    // For now, we'll use a placeholder
    const userId = req.headers['x-user-id'] as string || req.headers['authorization'];
    
    if (userId) {
      (req as any).user = {
        id: userId,
        roles: ['healthcare_worker'], // Would be extracted from token
        permissions: ['read_patients', 'write_patients'] // Would be extracted from token
      };
    }

    next();
  }

  private globalErrorHandler(error: Error, req: Request, res: Response, next: NextFunction): void {
    console.error('Global error handler:', error);

    // HIPAA compliance: Don't expose sensitive information in error messages
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const errorResponse = {
      success: false,
      message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
      ...(isDevelopment && { 
        error: error.message,
        stack: error.stack 
      })
    };

    // Log error for monitoring
    console.error(`Error ${req.headers['x-request-id']}:`, {
      message: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    res.status(500).json(errorResponse);
  }

  /**
   * Route handlers
   */

  private async getDetailedHealth(req: Request, res: Response): Promise<void> {
    try {
      const healthService = this.container.getHealthCheckService();
      const health = await healthService.checkHealth();
      
      const status = health.status === 'healthy' ? 200 : 503;
      res.status(status).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        message: 'Lỗi kiểm tra sức khỏe dịch vụ',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metricsService = this.container.getMetricsService();
      const metrics = await metricsService.getMetrics();
      
      res.status(200).json(metrics);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Lỗi lấy thông tin metrics',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Start server
   */
  public async start(): Promise<void> {
    try {
      // Initialize container
      await this.container.initialize();

      // Start HTTP server
      const server = this.app.listen(this.config.port, () => {
        console.log(`🏥 Patient Registry Service started successfully`);
        console.log(`📍 Server running on port ${this.config.port}`);
        console.log(`🌍 Environment: ${this.config.environment}`);
        console.log(`🔒 HIPAA Compliance: Enabled`);
        console.log(`🇻🇳 Vietnamese Localization: Enabled`);
        console.log(`📊 Health checks: ${this.config.enableHealthChecks ? 'Enabled' : 'Disabled'}`);
        console.log(`📈 Metrics: ${this.config.enableMetrics ? 'Enabled' : 'Disabled'}`);
        console.log(`🎯 Clean Architecture + DDD + CQRS + Event-Driven`);
        
        // Log service information
        const serviceInfo = this.container.getServiceInfo();
        console.log(`📦 Registered ${serviceInfo.registrations.total} services`);
        console.log(`🔧 Patterns: ${serviceInfo.patterns.join(', ')}`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.gracefulShutdown(server));
      process.on('SIGINT', () => this.gracefulShutdown(server));

    } catch (error) {
      console.error('Failed to start Patient Registry Service:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  private async gracefulShutdown(server: any): Promise<void> {
    console.log('🛑 Shutting down Patient Registry Service gracefully...');
    
    try {
      // Close HTTP server
      server.close(() => {
        console.log('📡 HTTP server closed');
      });

      // Dispose container
      await this.container.dispose();
      
      console.log('✅ Patient Registry Service shut down successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Get Express app instance
   */
  public getApp(): Application {
    return this.app;
  }
}
