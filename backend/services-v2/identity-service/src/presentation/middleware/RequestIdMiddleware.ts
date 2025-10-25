/**
 * Request ID Middleware
 * Generates or extracts request ID for request tracing
 * 
 * Features:
 * - Generates unique request ID if not provided
 * - Extracts request ID from x-request-id header
 * - Attaches request ID to response headers
 * - Creates child logger with request ID context
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, Distributed Tracing
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ILogger } from '../../application/services/ILogger';

// Extend Express Request to include requestId and logger
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
      logger?: ILogger;
    }
  }
}

/**
 * Request ID Middleware Factory
 * Creates middleware that attaches request ID to each request
 */
export function createRequestIdMiddleware(baseLogger: ILogger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Extract or generate request ID
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();
    
    // Attach request ID to request object
    req.requestId = requestId;
    
    // Create child logger with request ID context
    // This allows all logs within this request to include the request ID
    if ('child' in baseLogger && typeof baseLogger.child === 'function') {
      req.logger = baseLogger.child({ requestId });
    } else {
      // Fallback if logger doesn't support child()
      req.logger = baseLogger;
    }
    
    // Attach request ID to response headers for client-side tracing
    res.setHeader('x-request-id', requestId);
    
    next();
  };
}

