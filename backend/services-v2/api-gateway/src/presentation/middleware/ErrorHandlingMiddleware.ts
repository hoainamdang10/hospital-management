import { Response, NextFunction } from 'express';
import { ILogger } from '@application/services/ILogger';
import { AuthenticatedRequest } from './AuthenticationMiddleware';

export class ErrorHandlingMiddleware {
  constructor(private logger: ILogger) {}

  handleErrors() {
    return (error: Error, req: AuthenticatedRequest, res: Response, _next: NextFunction): void => {
      this.logger.error('Unhandled error', {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        error: error.message,
        stack: error.stack,
        userId: req.user?.userId
      });

      const statusCode = this.getStatusCode(error);

      res.status(statusCode).json({
        success: false,
        error: this.getErrorMessage(error, statusCode),
        requestId: req.requestId
      });
    };
  }

  handleNotFound() {
    return (req: AuthenticatedRequest, res: Response): void => {
      this.logger.warn('Route not found', {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        userId: req.user?.userId
      });

      res.status(404).json({
        success: false,
        error: `Route not found: ${req.method} ${req.path}`,
        requestId: req.requestId
      });
    };
  }

  private getStatusCode(error: Error): number {
    if ('statusCode' in error && typeof error.statusCode === 'number') {
      return error.statusCode;
    }

    if (error.message.includes('not found')) {
      return 404;
    }

    if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
      return 401;
    }

    if (error.message.includes('forbidden') || error.message.includes('permission')) {
      return 403;
    }

    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return 400;
    }

    return 500;
  }

  private getErrorMessage(error: Error, statusCode: number): string {
    if (statusCode >= 500) {
      return 'Internal server error';
    }

    return error.message;
  }
}

