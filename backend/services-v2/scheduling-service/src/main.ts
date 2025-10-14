/**
 * Scheduling Service - Main Entry Point
 * V3 Clean Architecture + DDD Implementation
 * 
 * @author Hospital Management Team
 * @version 3.0.0
 * @port 3024
 * @schema scheduling_schema
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createAppointmentRoutes } from './presentation/routes/appointment.routes';
import { createAppointmentQueryRoutes } from './presentation/routes/appointmentQueryRoutes';
import { getContainer } from './infrastructure/di/container';

const app: Application = express();
const PORT = process.env.PORT || 3024;
const SERVICE_NAME = 'scheduling-service';

// Initialize DI Container
console.log('[Main] Initializing DI Container...');
const container = getContainer();
console.log('[Main] DI Container initialized successfully');

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    service: SERVICE_NAME,
    status: 'healthy',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    port: PORT,
    features: [
      'Appointment Scheduling',
      'Appointment Management',
      'Clean Architecture',
      'DDD',
      'CQRS',
      'CQRS Read Model',
      'Event-Driven Architecture'
    ]
  });
});

// API Routes
// V1 - Command routes (Write operations) + Legacy queries
app.use('/api/v1', createAppointmentRoutes());

// V2 - Query routes (Read Model with denormalized data)
app.use('/api/v2', createAppointmentQueryRoutes());

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, async () => {
  console.log('='.repeat(60));
  console.log(`🏥 ${SERVICE_NAME.toUpperCase()}`);
  console.log('='.repeat(60));
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log('='.repeat(60));
  console.log('📋 API V1 - Command Endpoints (Write Model):');
  console.log(`   POST   /api/v1/appointments - Schedule appointment`);
  console.log(`   POST   /api/v1/appointments/:id/confirm - Confirm appointment`);
  console.log(`   POST   /api/v1/appointments/:id/complete - Complete appointment`);
  console.log(`   POST   /api/v1/appointments/:id/cancel - Cancel appointment`);
  console.log(`   GET    /api/v1/appointments/:id - Get appointment (legacy)`);
  console.log(`   GET    /api/v1/appointments - List appointments (legacy)`);
  console.log('='.repeat(60));
  console.log('📊 API V2 - Query Endpoints (Read Model with Patient/Doctor Info):');
  console.log(`   GET    /api/v2/appointments/:id - Get appointment details`);
  console.log(`   GET    /api/v2/appointments - List appointments with filters`);
  console.log(`   GET    /api/v2/patients/:patientId/appointments - Patient appointments`);
  console.log(`   GET    /api/v2/doctors/:doctorId/appointments - Doctor appointments`);
  console.log('='.repeat(60));

  // Connect event subscriptions
  try {
    console.log('[Main] Connecting event subscriptions...');
    const eventSubscriptions = container.getEventSubscriptions();
    await eventSubscriptions.connect();
    console.log('[Main] ✅ Event subscriptions connected');
  } catch (error) {
    console.error('[Main] ⚠️ Failed to connect event subscriptions:', error);
    console.error('[Main] ⚠️ Service will continue without event subscriptions');
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');

  // Disconnect event subscriptions
  try {
    const eventSubscriptions = container.getEventSubscriptions();
    await eventSubscriptions.disconnect();
    console.log('Event subscriptions disconnected');
  } catch (error) {
    console.error('Failed to disconnect event subscriptions:', error);
  }

  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');

  // Disconnect event subscriptions
  try {
    const eventSubscriptions = container.getEventSubscriptions();
    await eventSubscriptions.disconnect();
    console.log('Event subscriptions disconnected');
  } catch (error) {
    console.error('Failed to disconnect event subscriptions:', error);
  }

  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;

