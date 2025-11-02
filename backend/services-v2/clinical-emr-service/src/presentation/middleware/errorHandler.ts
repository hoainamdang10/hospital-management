/**
 * Error Handling Middleware
 * Centralized error handling for Express
 *
 * @compliance Clean Architecture, Express, HIPAA
 */

import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export function errorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error (exclude sensitive data)
  console.error('API Error:', {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Determine status code
  const statusCode = error.statusCode || 500;

  // Build error response
  const errorResponse: any = {
    success: false,
    error: {
      message: error.message || 'Internal Server Error',
      code: error.code || 'INTERNAL_ERROR',
    },
  };

  // Add details in development
  if (process.env.NODE_ENV === 'development' && error.details) {
    errorResponse.error.details = error.details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    errorResponse.error.stack = error.stack.split('\n');
  }

  res.status(statusCode).json(errorResponse);
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      message: `Endpoint ${req.method} ${req.path} not found`,
      code: 'NOT_FOUND',
    },
  });
}

// Alias for compatibility
export { errorHandler as errorHandlingMiddleware };
