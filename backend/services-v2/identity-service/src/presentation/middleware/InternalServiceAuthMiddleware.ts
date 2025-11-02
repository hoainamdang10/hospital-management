/**
 * Internal Service Authentication Middleware
 * Protects internal-only APIs that are exposed over HTTP but intended for trusted services.
 */

import { Request, Response, NextFunction } from 'express';
import { ILogger } from '../../application/services/ILogger';
import { normalizeIp, isIpAllowed } from './utils/ip-utils';

export interface InternalServiceAuthConfig {
  enabled: boolean;
  tokens: string[];
  headerName?: string;
  allowedIPs?: string[];
}

export function createInternalServiceAuthMiddleware(
  config: InternalServiceAuthConfig,
  logger: ILogger
) {
  const headerName = (config.headerName || 'x-internal-token').toLowerCase();
  const normalizedTokens = config.tokens.filter(token => token.trim().length > 0);

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!config.enabled) {
      return next();
    }

    // Optional IP allow-list for extra defense in depth
    if (config.allowedIPs && config.allowedIPs.length > 0) {
      const clientIp = normalizeIp(req.ip || req.socket.remoteAddress || '');
      if (!clientIp || !isIpAllowed(clientIp, config.allowedIPs)) {
        logger.warn('Internal auth blocked by IP allow list', {
          ip: req.ip,
          path: req.path
        });
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Access denied from this IP address'
        });
        return;
      }
    }

    const headerValue = (req.headers[headerName] as string | undefined)?.trim();
    const bearerValue = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.substring(7).trim()
      : undefined;

    const providedToken = headerValue || bearerValue;

    if (providedToken && normalizedTokens.includes(providedToken)) {
      return next();
    }

    logger.warn('Internal service authentication failed', {
      path: req.path,
      method: req.method,
      hasHeader: Boolean(headerValue),
      hasBearer: Boolean(bearerValue)
    });

    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Internal authentication required'
    });
  };
}

