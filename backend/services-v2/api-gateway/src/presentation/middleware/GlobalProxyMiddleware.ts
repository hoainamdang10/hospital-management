/**
 * Global Proxy Middleware
 * Centralized routing logic for API Gateway
 * 
 * This middleware intercepts ALL /api/* requests and:
 * 1. Looks up the matching route from ServiceRegistry
 * 2. Proxies to the target service
 * 
 * Benefits:
 * - Single source of truth for routing
 * - No prefix mounting conflicts
 * - Environment-agnostic (works for local & Docker)
 * - Easy to debug and monitor
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Response, NextFunction, RequestHandler } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { ILogger } from '@application/services/ILogger';
import { ServiceRegistry } from '@infrastructure/proxy/ServiceRegistry';
import { AuthenticatedRequest } from './AuthenticationMiddleware';
import { loadTimeoutConfig } from '../../../../shared/infrastructure/config/TimeoutConfig';

export class GlobalProxyMiddleware {
  private readonly timeouts: ReturnType<typeof loadTimeoutConfig>;

  constructor(
    private readonly serviceRegistry: ServiceRegistry,
    private readonly logger: ILogger
  ) {
    this.timeouts = loadTimeoutConfig();
  }

  /**
   * Create the global proxy handler
   * This replaces individual app.use(pathPrefix, proxyMiddleware) calls
   */
  public handle(): RequestHandler {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      // IMPORTANT: When middleware is mounted at /api, Express strips /api from req.path
      // We need to reconstruct the full path for route matching
      // req.baseUrl contains the mount path (/api), req.path contains the rest
      const originalPath = req.baseUrl + req.path;
      
      this.logger.debug('Global proxy: Incoming request', {
        requestId: req.requestId,
        method: req.method,
        baseUrl: req.baseUrl,
        reqPath: req.path,
        originalPath,
        originalUrl: req.originalUrl
      });

      // Find matching route from registry
      const route = this.serviceRegistry.findMatchingRoute(originalPath);
      
      if (!route) {
        this.logger.debug('Global proxy: No matching route found', {
          requestId: req.requestId,
          path: originalPath
        });
        return next(); // Let 404 handler catch it
      }

      this.logger.info('Global proxy: Route matched', {
        requestId: req.requestId,
        originalPath,
        serviceName: route.serviceName,
        pathPrefix: route.pathPrefix,
        baseUrl: route.baseUrl,
        specificity: route.getSpecificity()
      });

      // ✅ FIX: Check if route requires authentication
      if (route.requiresAuth && !req.user) {
        this.logger.warn('Global proxy: Authentication required but user not authenticated', {
          requestId: req.requestId,
          path: originalPath,
          serviceName: route.serviceName
        });
        return res.status(401).json({
          success: false,
          message: 'Unauthorized - Authentication required',
          timestamp: new Date().toISOString()
        });
      }

      // ✅ FIX: Check required permissions
      if (route.requiredPermissions && route.requiredPermissions.length > 0 && req.user) {
        const userPermissions = req.user.permissions || [];
        const hasPermission = route.requiredPermissions.some(perm => 
          userPermissions.includes(perm)
        );
        
        if (!hasPermission) {
          this.logger.warn('Global proxy: Insufficient permissions', {
            requestId: req.requestId,
            path: originalPath,
            required: route.requiredPermissions,
            userHas: userPermissions
          });
          return res.status(403).json({
            success: false,
            message: 'Forbidden - Insufficient permissions',
            timestamp: new Date().toISOString()
          });
        }
      }

      // ✅ FIX: Check service health via circuit breaker
      const isHealthy = await this.serviceRegistry.isHealthy(route.serviceName);
      if (!isHealthy) {
        this.logger.error('Global proxy: Service unhealthy', {
          requestId: req.requestId,
          serviceName: route.serviceName
        });
        return res.status(503).json({
          success: false,
          message: 'Service temporarily unavailable',
          timestamp: new Date().toISOString()
        });
      }

      // ✅ FIX: Set req.url to originalPath BEFORE proxy sees it
      // This ensures http-proxy-middleware sees the full path with /api prefix
      req.url = originalPath;

      const targetUrl = route.getTargetUrl(originalPath);

      this.logger.debug('Global proxy: Forwarding request', {
        requestId: req.requestId,
        originalPath,
        targetUrl,
        reqUrlSet: req.url
      });

      // Create proxy middleware for this specific request
      const proxyOptions: Options = {
        target: route.baseUrl,
        changeOrigin: true,
        timeout: this.timeouts.proxy.request,
        proxyTimeout: this.timeouts.proxy.upstream,
        
        // Cookie domain rewrite
        cookieDomainRewrite: {
          "*": "" // Remove domain from cookies
        },

        onProxyReq: (proxyReq, request: AuthenticatedRequest) => {
          // Forward session cookie as Authorization header
          let sessionToken: string | undefined;
          
          // @ts-ignore - cookies added by cookie-parser middleware
          if (request.cookies?.session_token) {
            sessionToken = request.cookies.session_token;
          } else if (request.headers.cookie) {
            const cookies = request.headers.cookie.split(';').reduce((acc, cookie) => {
              const [key, value] = cookie.trim().split('=');
              if (key && value) acc[key] = value;
              return acc;
            }, {} as Record<string, string>);
            sessionToken = cookies.session_token;
          }
          
          if (sessionToken && !request.headers.authorization) {
            proxyReq.setHeader("Authorization", `Bearer ${sessionToken}`);
          }
          
          // Forward user context headers
          if (request.user) {
            proxyReq.setHeader("X-User-Id", request.user.userId);
            proxyReq.setHeader("X-User-Email", request.user.email);
            proxyReq.setHeader("X-User-Roles", JSON.stringify(request.user.roles));
            if (request.user.permissions) {
              proxyReq.setHeader("X-User-Permissions", JSON.stringify(request.user.permissions));
            }
            if (request.user.patientId) {
              proxyReq.setHeader("X-Patient-Id", request.user.patientId);
            }
            if (request.user.providerId) {
              proxyReq.setHeader("X-Provider-Id", request.user.providerId);
            }
          }

          if (request.requestId) {
            proxyReq.setHeader("X-Request-Id", request.requestId);
          }

          proxyReq.setHeader("X-Forwarded-For", request.ip || "unknown");
          proxyReq.setHeader("X-Forwarded-Proto", request.protocol);
          proxyReq.setHeader("X-Forwarded-Host", request.hostname);
          proxyReq.removeHeader("expect");

          // ✅ FIX: Don't manually re-stream body - let http-proxy-middleware handle it
          // The body parsing logic was skipped by shouldParseJson() check in main.ts,
          // so request body is still in raw stream format and will be auto-piped by proxy
          // Manually writing body causes conflicts and corruption

          this.logger.debug('Global proxy: Request forwarded', {
            requestId: request.requestId,
            method: request.method,
            target: route.baseUrl,
            rewrittenPath,
            userId: request.user?.userId
          });
        },

        onProxyRes: (proxyRes, request: AuthenticatedRequest) => {
          this.logger.debug('Global proxy: Response received', {
            requestId: request.requestId,
            path: request.path,
            statusCode: proxyRes.statusCode,
            userId: request.user?.userId,
            hasCookies: Boolean(proxyRes.headers['set-cookie'])
          });
        },

        onError: (err, request: AuthenticatedRequest, response) => {
          this.logger.error('Global proxy: Error', {
            requestId: request.requestId,
            path: request.path,
            target: route.baseUrl,
            error: err.message,
            userId: request.user?.userId,
            stack: err.stack,
          });

          if (!response.headersSent) {
            response.status(502).json({
              success: false,
              error: 'BAD_GATEWAY',
              message: 'Service temporarily unavailable',
              serviceName: route.serviceName,
              requestId: request.requestId
            });
          }
        },
      };

      // Create and execute proxy middleware
      const proxyMiddleware = createProxyMiddleware(proxyOptions);
      return proxyMiddleware(req, res, next);
    };
  }
}
