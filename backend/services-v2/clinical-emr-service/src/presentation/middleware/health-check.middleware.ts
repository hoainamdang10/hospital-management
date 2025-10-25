/**
 * Health Check Middleware
 * Provides health check endpoint for service monitoring
 */

import { Request, Response, NextFunction } from 'express';

export function healthCheckMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.path === '/health' || req.path === '/health/') {
    res.status(200).json({
      status: 'healthy',
      service: 'clinical-emr-service',
      version: '2.0.0',
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  next();
}

