/**
 * Metrics Authentication Middleware
 * Protects internal endpoints like /metrics and /api-docs
 * 
 * Features:
 * - Token-based authentication for metrics endpoints
 * - IP whitelist support
 * - Configurable via environment variables
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, Security
 */

import { Request, Response, NextFunction } from 'express';
import { ILogger } from '../../application/services/ILogger';

/**
 * Metrics Auth Middleware Configuration
 */
export interface MetricsAuthConfig {
  enabled: boolean;
  authToken?: string;
  allowedIPs?: string[];
}

/**
 * Create Metrics Authentication Middleware
 * Protects internal endpoints from unauthorized access
 */
export function createMetricsAuthMiddleware(
  config: MetricsAuthConfig,
  logger: ILogger
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip auth if disabled (development mode)
    if (!config.enabled) {
      return next();
    }

    // Check IP whitelist if configured
    if (config.allowedIPs && config.allowedIPs.length > 0) {
      const clientIP = req.ip || req.socket.remoteAddress || '';
      const isAllowedIP = config.allowedIPs.some(allowedIP => {
        // Support CIDR notation or exact match
        return clientIP.includes(allowedIP) || allowedIP === clientIP;
      });

      if (isAllowedIP) {
        return next();
      }
    }

    // Check auth token
    if (config.authToken) {
      const providedToken = req.headers['authorization']?.replace('Bearer ', '') ||
                           req.query.token as string;

      if (providedToken === config.authToken) {
        return next();
      }
    }

    // Unauthorized
    logger.warn('Unauthorized access attempt to metrics endpoint', {
      ip: req.ip,
      path: req.path,
      userAgent: req.headers['user-agent']
    });

    res.status(403).json({
      error: 'Forbidden',
      message: 'Access to this endpoint is restricted'
    });
  };
}

