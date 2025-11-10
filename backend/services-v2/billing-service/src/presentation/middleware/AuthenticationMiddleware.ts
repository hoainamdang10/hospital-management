/**
 * Authentication Middleware
 * Verifies JWT tokens by calling Identity Service
 */

import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { ILogger } from "@shared/application/services/logger.interface";

export interface AuthenticatedUser {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  sessionId?: string;
}

export interface AuthenticatedRequest extends Request {
  authenticatedUser?: AuthenticatedUser;
  correlationId?: string;
}

export interface AuthenticationMiddlewareConfig {
  identityServiceUrl: string;
  logger: ILogger;
  skipPaths?: string[];
}

export class AuthenticationMiddleware {
  private readonly identityServiceUrl: string;
  private readonly logger: ILogger;
  private readonly skipPaths: string[];
  private readonly bypassAuth: boolean;

  constructor(config: AuthenticationMiddlewareConfig) {
    this.identityServiceUrl = config.identityServiceUrl;
    this.logger = config.logger;
    this.skipPaths = config.skipPaths || ["/health", "/api-docs"];
    this.bypassAuth = process.env.BYPASS_AUTH === "true";
  }

  public authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Skip authentication for certain paths
      if (this.shouldSkipAuth(req.path)) {
        return next();
      }

      // Bypass authentication in development
      if (this.bypassAuth) {
        req.authenticatedUser = {
          userId: "dev-user-id",
          email: "dev@example.com",
          roles: ["ADMIN"],
          permissions: ["*"]
        };
        return next();
      }

      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing or invalid authorization header" });
        return;
      }

      const token = authHeader.substring(7);

      // Verify token with Identity Service
      const response = await axios.post(
        `${this.identityServiceUrl}/api/auth/verify`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }
      );

      if (!response.data || !response.data.userId) {
        res.status(401).json({ error: "Invalid token" });
        return;
      }

      // Attach user to request
      req.authenticatedUser = {
        userId: response.data.userId,
        email: response.data.email,
        roles: response.data.roles || [],
        permissions: response.data.permissions || [],
        sessionId: response.data.sessionId
      };

      next();
    } catch (error: any) {
      this.logger.error("Authentication failed", { error: error.message });
      res.status(401).json({ error: "Authentication failed" });
    }
  };

  private shouldSkipAuth(path: string): boolean {
    return this.skipPaths.some(skipPath => path.startsWith(skipPath));
  }
}
