import { Router } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { AuthenticatedRequest } from '../middleware/AuthenticationMiddleware';
import { ILogger } from '@application/services/ILogger';
import { ProxyError, ProxyErrorType } from '@domain/errors/ProxyError';
import { loadTimeoutConfig } from '../../../../shared/infrastructure/config/TimeoutConfig';

export interface ProxyRouteConfig {
  pathPrefix: string;
  target: string;
  requiresAuth: boolean;
  changeOrigin?: boolean;
  pathRewrite?: Record<string, string>;
}

export function createProxyRoute(
  config: ProxyRouteConfig,
  logger: ILogger
): Router {
  const router = Router();

  // Load centralized timeout configuration
  const timeouts = loadTimeoutConfig();

  const proxyOptions: Options = {
    target: config.target,
    changeOrigin: config.changeOrigin !== false,
    pathRewrite: config.pathRewrite,
    timeout: timeouts.proxy.request,
    proxyTimeout: timeouts.proxy.upstream,

    onProxyReq: (proxyReq, req: AuthenticatedRequest) => {
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.userId);
        proxyReq.setHeader('X-User-Email', req.user.email);
        proxyReq.setHeader('X-User-Roles', JSON.stringify(req.user.roles));
        proxyReq.setHeader('X-User-Permissions', JSON.stringify(req.user.permissions));
      }

      if (req.requestId) {
        proxyReq.setHeader('X-Request-Id', req.requestId);
      }

      proxyReq.setHeader('X-Forwarded-For', req.ip || 'unknown');
      proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
      proxyReq.setHeader('X-Forwarded-Host', req.hostname);

      logger.debug('Proxying request', {
        requestId: req.requestId,
        path: req.path,
        target: config.target,
        userId: req.user?.userId
      });
    },

    onProxyRes: (proxyRes, req: AuthenticatedRequest) => {
      logger.debug('Proxy response received', {
        requestId: req.requestId,
        path: req.path,
        statusCode: proxyRes.statusCode,
        userId: req.user?.userId
      });
    },

    onError: (err, req: AuthenticatedRequest, res) => {
      const serviceName = config.target.split('//')[1]?.split(':')[0] || 'unknown';
      
      const proxyError = ProxyError.fromError(err, {
        serviceName,
        path: req.path,
        method: req.method,
        requestId: req.requestId,
        userId: req.user?.userId
      });

      logger.error('Proxy error', {
        requestId: req.requestId,
        path: req.path,
        target: config.target,
        errorType: proxyError.type,
        error: proxyError.message,
        retryable: proxyError.retryable,
        userId: req.user?.userId,
        stack: err.stack
      });

      if (!res.headersSent) {
        res.status(proxyError.statusCode).json({
          ...proxyError.toJSON(),
          userMessage: proxyError.getUserMessage()
        });
      }
    }
  };

  router.use(createProxyMiddleware(proxyOptions));

  return router;
}

