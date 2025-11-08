/**
 * Department Service - Main Entry Point
 * Simple CRUD microservice for hospital departments
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Microservices Pattern
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
// import rateLimit from 'express-rate-limit'; // Disabled for development
import dotenv from 'dotenv';

import { SupabaseDepartmentRepository } from './infrastructure/persistence/SupabaseDepartmentRepository';
import { RedisDepartmentCache } from './infrastructure/cache/RedisDepartmentCache';
import { DepartmentController } from './presentation/controllers/DepartmentController';
import { createDepartmentRoutes } from './presentation/routes/department.routes';

// Load environment variables
dotenv.config();

// Configuration
const PORT = process.env.PORT || 3025;
const NODE_ENV = process.env.NODE_ENV || 'development';
const SERVICE_NAME = process.env.SERVICE_NAME || 'department-service';

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Redis configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// CORS configuration
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[Department Service] Missing required environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Express app
const app: Application = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({ origin: CORS_ORIGIN })); // CORS
app.use(express.json()); // JSON body parser
app.use(express.urlencoded({ extended: true })); // URL-encoded body parser

// Rate limiting - DISABLED for development
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later'
// });
// app.use('/api/', limiter);

// Request logging middleware
app.use((_req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${SERVICE_NAME}] ${_req.method} ${_req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Initialize dependencies
const repository = new SupabaseDepartmentRepository(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const cache = new RedisDepartmentCache(REDIS_URL);
const controller = new DepartmentController(repository, cache);

// Routes
app.use('/api/departments', createDepartmentRoutes(controller));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: SERVICE_NAME,
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    service: SERVICE_NAME,
    version: '2.0.0',
    description: 'Department Service - Simple CRUD microservice for hospital departments',
    endpoints: {
      health: '/health',
      departments: '/api/departments',
      departmentById: '/api/departments/:id',
      departmentByCode: '/api/departments/code/:code',
      stats: '/api/departments/stats'
    }
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: _req.path
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('[Department Service] Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: NODE_ENV === 'development' ? err.message : undefined
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Department Service] SIGTERM received, shutting down gracefully...');
  await cache.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Department Service] SIGINT received, shutting down gracefully...');
  await cache.disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`[Department Service] Started successfully`);
  console.log(`[Department Service] Environment: ${NODE_ENV}`);
  console.log(`[Department Service] Port: ${PORT}`);
  console.log(`[Department Service] Health: http://localhost:${PORT}/health`);
  console.log(`[Department Service] API: http://localhost:${PORT}/api/departments`);
  console.log('='.repeat(60));
});

export default app;

