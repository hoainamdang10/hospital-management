import { Response, NextFunction } from 'express';
import { ILogger } from '@application/services/ILogger';
import { AuthenticatedRequest } from './AuthenticationMiddleware';
import { getErrorMessage } from '@infrastructure/i18n/ErrorMessages';

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
      const context = this.extractErrorContext(error);
      const errorInfo = getErrorMessage(statusCode, context);

      res.status(statusCode).json({
        success: false,
        error: errorInfo.userMessage,
        code: errorInfo.code,
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
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

      const errorInfo = getErrorMessage(404);

      res.status(404).json({
        success: false,
        error: errorInfo.userMessage,
        code: errorInfo.code,
        path: `${req.method} ${req.path}`,
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

  /**
   * Extract error context from error message
   * Used to provide more specific Vietnamese error messages
   */
  private extractErrorContext(error: Error): string | undefined {
    const message = error.message.toLowerCase();

    // Authentication errors
    if (message.includes('invalid credentials') || message.includes('wrong password')) {
      return 'invalid_credentials';
    }
    if (message.includes('email already exists') || message.includes('duplicate email')) {
      return 'email_already_exists';
    }
    if (message.includes('weak password')) {
      return 'weak_password';
    }
    if (message.includes('invalid token') || message.includes('token expired')) {
      return 'invalid_token';
    }

    // Patient errors
    if (message.includes('patient not found')) {
      return 'patient_not_found';
    }
    if (message.includes('duplicate patient')) {
      return 'duplicate_patient';
    }

    // Appointment errors
    if (message.includes('appointment conflict') || message.includes('time slot taken')) {
      return 'appointment_conflict';
    }
    if (message.includes('appointment not found')) {
      return 'appointment_not_found';
    }

    // Provider errors
    if (message.includes('provider not found')) {
      return 'provider_not_found';
    }
    if (message.includes('provider not available')) {
      return 'provider_not_available';
    }

    // Billing errors
    if (message.includes('invoice not found')) {
      return 'invoice_not_found';
    }
    if (message.includes('payment failed')) {
      return 'payment_failed';
    }

    // General errors
    if (message.includes('validation')) {
      return 'validation_error';
    }

    return undefined;
  }
}

