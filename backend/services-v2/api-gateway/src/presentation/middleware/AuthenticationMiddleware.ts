import { Request, Response, NextFunction } from 'express';
import { AuthenticateRequestUseCase } from '@application/use-cases/AuthenticateRequestUseCase';
import { v4 as uuidv4 } from 'uuid';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
    sessionId?: string;
  };
  requestId?: string;
}

export class AuthenticationMiddleware {
  constructor(private authenticateRequestUseCase: AuthenticateRequestUseCase) {}

  authenticate() {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const requestId = uuidv4();
        req.requestId = requestId;

        const result = await this.authenticateRequestUseCase.execute({
          authorizationHeader: req.headers.authorization,
          requestId,
          ip: req.ip || 'unknown',
          path: req.path
        });

        if (!result.success || !result.user) {
          res.status(401).json({
            success: false,
            error: result.error || 'Authentication failed',
            requestId
          });
          return;
        }

        req.user = result.user;

        next();

      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Internal authentication error',
          requestId: req.requestId
        });
      }
    };
  }

  optionalAuthenticate() {
    return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
      try {
        const requestId = uuidv4();
        req.requestId = requestId;

        if (!req.headers.authorization) {
          next();
          return;
        }

        const result = await this.authenticateRequestUseCase.execute({
          authorizationHeader: req.headers.authorization,
          requestId,
          ip: req.ip || 'unknown',
          path: req.path
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

