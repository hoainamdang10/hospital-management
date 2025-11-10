import { Request, RequestHandler } from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { AuthenticatedRequest } from "../middleware/AuthenticationMiddleware";
import { ILogger } from "@application/services/ILogger";
import { ProxyError } from "@domain/errors/ProxyError";
import { loadTimeoutConfig } from "../../../../shared/infrastructure/config/TimeoutConfig";

export interface ProxyRouteConfig {
  pathPrefix: string;
  target: string;
  requiresAuth: boolean;
  changeOrigin?: boolean;
  pathRewrite?: Record<string, string>;
}

const ROLE_PRIORITY = ["super_admin", "admin", "doctor", "nurse", "patient"];

function resolvePrimaryRole(
  user?: AuthenticatedRequest["user"],
): string | undefined {
  if (!user) {
    return undefined;
  }

  if (user.primaryRole) {
    return user.primaryRole;
  }

  if (!user.roles || user.roles.length === 0) {
    return undefined;
  }

  const normalized = user.roles.map((role) =>
    typeof role === "string" ? role.toLowerCase() : String(role).toLowerCase(),
  );

  const sorted = [...normalized].sort((a, b) => {
    const aPriority = ROLE_PRIORITY.indexOf(a);
    const bPriority = ROLE_PRIORITY.indexOf(b);
    if (aPriority === -1 && bPriority === -1) return 0;
    if (aPriority === -1) return 1;
    if (bPriority === -1) return -1;
    return aPriority - bPriority;
  });

  return sorted[0];
}

/**
 * Create proxy middleware (NOT a Router)
 * Returns the middleware function directly for use with app.use()
 */
export function createProxyRoute(
  config: ProxyRouteConfig,
  logger: ILogger,
): RequestHandler {
  // Load centralized timeout configuration
  const timeouts = loadTimeoutConfig();

  // Log proxy middleware creation
  logger.info("Creating proxy middleware", {
    target: config.target,
    pathPrefix: config.pathPrefix,
    pathRewrite: config.pathRewrite,
    requiresAuth: config.requiresAuth,
  });

  const proxyOptions: Options = {
    target: config.target,
    changeOrigin: config.changeOrigin !== false,
    pathRewrite: config.pathRewrite,
    timeout: timeouts.proxy.request,
    proxyTimeout: timeouts.proxy.upstream,
    
    // Cookie domain rewrite - forward cookies from downstream services to client
    cookieDomainRewrite: {
      "*": "" // Remove domain from cookies so they work across all localhost ports
    },

    onProxyReq: (proxyReq, req: AuthenticatedRequest) => {
      // Forward session cookie as Authorization header for downstream services
      // Parse cookie manually from header (cookie-parser may not work in proxy context)
      let sessionToken: string | undefined;
      
      // @ts-ignore - cookies added by cookie-parser middleware
      if (req.cookies?.session_token) {
        sessionToken = req.cookies.session_token;
      } else if (req.headers.cookie) {
        // Manual cookie parsing as fallback
        const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          if (key && value) acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        sessionToken = cookies.session_token;
      }
      
      logger.info("Proxy request debug", {
        requestId: req.requestId,
        path: req.path,
        hasCookieHeader: !!req.headers.cookie,
        hasSessionToken: !!sessionToken,
        cookieHeaderPreview: req.headers.cookie?.substring(0, 60)
      });
      
      if (sessionToken && !req.headers.authorization) {
        proxyReq.setHeader("Authorization", `Bearer ${sessionToken}`);
        logger.info("✓ Forwarded session cookie as Authorization header", {
          requestId: req.requestId,
          path: req.path
        });
      }
      
      if (req.user) {
        proxyReq.setHeader("X-User-Id", req.user.userId);
        proxyReq.setHeader("X-User-Email", req.user.email);
        proxyReq.setHeader("X-User-Roles", JSON.stringify(req.user.roles));
        proxyReq.setHeader(
          "X-User-Permissions",
          JSON.stringify(req.user.permissions),
        );
        const primaryRole = resolvePrimaryRole(req.user);
        if (primaryRole) {
          proxyReq.setHeader("X-User-Role", primaryRole);
        }
        if (req.user.patientId) {
          proxyReq.setHeader("X-Patient-Id", req.user.patientId);
        }
        if (req.user.providerId) {
          proxyReq.setHeader("X-Provider-Id", req.user.providerId);
        }
      }

      if (req.requestId) {
        proxyReq.setHeader("X-Request-Id", req.requestId);
      }

      proxyReq.setHeader("X-Forwarded-For", req.ip || "unknown");
      proxyReq.setHeader("X-Forwarded-Proto", req.protocol);
      proxyReq.setHeader("X-Forwarded-Host", req.hostname);
      proxyReq.removeHeader("expect");

      // Re-stream parsed request body to upstream so payloads are not dropped
      const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
      const hasParsedBody =
        req.body &&
        typeof req.body !== "function" &&
        ((Buffer.isBuffer(req.body) && req.body.length > 0) ||
          (typeof req.body === "string" && req.body.length > 0) ||
          (typeof req.body === "object" &&
            Object.keys(req.body as Record<string, unknown>).length > 0));

      if (req.method && !["GET", "HEAD"].includes(req.method.toUpperCase())) {
        logger.debug("Proxy body debug", {
          requestId: req.requestId,
          path: req.path,
          rawBodyLength: rawBody?.length ?? 0,
          hasParsedBody,
          bodyType: typeof req.body,
        });
      }

      if (
        req.method &&
        !["GET", "HEAD"].includes(req.method.toUpperCase()) &&
        (rawBody?.length || hasParsedBody)
      ) {
        const contentType = (req.headers["content-type"] || "").toString();
        let bodyData: string | Buffer | undefined = rawBody;

        if (!bodyData) {
          if (Buffer.isBuffer(req.body)) {
            bodyData = req.body;
          } else if (contentType.includes("application/json")) {
            bodyData = JSON.stringify(req.body);
          } else if (
            contentType.includes("application/x-www-form-urlencoded")
          ) {
            bodyData = new URLSearchParams(
              req.body as Record<string, string>,
            ).toString();
          }
        }

        if (bodyData) {
          const length = Buffer.isBuffer(bodyData)
            ? bodyData.length
            : Buffer.byteLength(bodyData);
          proxyReq.setHeader("Content-Length", length);
          proxyReq.removeHeader("transfer-encoding");
          proxyReq.removeHeader("expect");
          proxyReq.write(bodyData);
          proxyReq.end();
          logger.debug("Forwarded request body to upstream", {
            requestId: req.requestId,
            path: req.path,
            contentLength: length,
            usedRawBody: Boolean(rawBody),
          });
        }
      }

      logger.debug("Proxying request", {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        target: config.target,
        userId: req.user?.userId,
      });
    },

    onProxyRes: (proxyRes, req: AuthenticatedRequest) => {
      // http-proxy-middleware automatically forwards headers including Set-Cookie
      // cookieDomainRewrite option ensures cookies work across localhost ports
      logger.debug("Proxy response received", {
        requestId: req.requestId,
        path: req.path,
        statusCode: proxyRes.statusCode,
        userId: req.user?.userId,
        hasCookies: Boolean(proxyRes.headers['set-cookie'])
      });
    },

    onError: (err, req: AuthenticatedRequest, res) => {
      const serviceName =
        config.target.split("//")[1]?.split(":")[0] || "unknown";

      const proxyError = ProxyError.fromError(err, {
        serviceName,
        path: req.path,
        method: req.method,
        requestId: req.requestId,
        userId: req.user?.userId,
      });

      logger.error("Proxy error", {
        requestId: req.requestId,
        path: req.path,
        target: config.target,
        errorType: proxyError.type,
        error: proxyError.message,
        retryable: proxyError.retryable,
        userId: req.user?.userId,
        stack: err.stack,
      });

      if (!res.headersSent) {
        res.status(proxyError.statusCode).json({
          ...proxyError.toJSON(),
          userMessage: proxyError.getUserMessage(),
        });
      }
    },
  };

  return createProxyMiddleware(proxyOptions);
}
