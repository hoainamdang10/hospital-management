import { Request, Response, NextFunction } from "express";
import { AuthenticateRequestUseCase } from "@application/use-cases/AuthenticateRequestUseCase";
import { v4 as uuidv4 } from "uuid";
import { getErrorMessage } from "@infrastructure/i18n/ErrorMessages";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
    sessionId?: string;
    patientId?: string;
    providerId?: string;
    primaryRole?: string;
  };
  requestId?: string;
}

export class AuthenticationMiddleware {
  constructor(private authenticateRequestUseCase: AuthenticateRequestUseCase) {}

  authenticate() {
    return async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        const requestId = uuidv4();
        req.requestId = requestId;

        // Accept authentication from either Bearer token OR session cookie
        // Priority: Bearer token (for backward compat) > Session cookie (new secure method)
        let authHeader = req.headers.authorization;
        
        // If no Bearer token, check for session cookie
        if (!authHeader && req.cookies?.session_token) {
          authHeader = `Bearer ${req.cookies.session_token}`;
        }

        const result = await this.authenticateRequestUseCase.execute({
          authorizationHeader: authHeader,
          requestId,
          ip: req.ip || "unknown",
          path: req.path,
        });

        if (!result.success || !result.user) {
          // Determine error context based on error message
          let context: string | undefined;
          const errorMsg = result.error?.toLowerCase() || "";

          if (errorMsg.includes("missing authorization")) {
            context = "missing_token";
          } else if (errorMsg.includes("invalid authorization header")) {
            context = "invalid_token";
          } else if (
            errorMsg.includes("expired") ||
            errorMsg.includes("jwt expired")
          ) {
            context = "token_expired";
          }

          const errorInfo = getErrorMessage(401, context);
          res.status(401).json({
            success: false,
            error: errorInfo.userMessage,
            code: errorInfo.code,
            requestId,
          });
          return;
        }

        req.user = result.user;

        next();
      } catch (error) {
        const errorInfo = getErrorMessage(500);
        res.status(500).json({
          success: false,
          error: errorInfo.userMessage,
          code: errorInfo.code,
          requestId: req.requestId,
        });
      }
    };
  }

  optionalAuthenticate() {
    return async (
      req: AuthenticatedRequest,
      _res: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        const requestId = uuidv4();
        req.requestId = requestId;

        // ✅ FIX: Support session cookie (same as authenticate())
        // Accept authentication from either Bearer token OR session cookie
        // Priority: Bearer token (for backward compat) > Session cookie (new secure method)
        let authHeader = req.headers.authorization;
        
        // If no Bearer token, check for session cookie
        if (!authHeader && req.cookies?.session_token) {
          authHeader = `Bearer ${req.cookies.session_token}`;
        }

        if (!authHeader) {
          next();
          return;
        }

        const result = await this.authenticateRequestUseCase.execute({
          authorizationHeader: authHeader,
          requestId,
          ip: req.ip || "unknown",
          path: req.path,
        });

        if (result.success && result.user) {
          req.user = result.user;
        }

        next();
      } catch (error) {
        next();
      }
    };
  }
}
