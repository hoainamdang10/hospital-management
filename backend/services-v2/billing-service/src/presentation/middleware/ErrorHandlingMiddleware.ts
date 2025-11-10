/**
 * Error Handling Middleware
 * Copy from patient-registry-service
 */

import { Request, Response, NextFunction } from "express";
import { ILogger } from "@shared/application/services/logger.interface";

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ResponseHelper {
  static success<T>(data: T, message?: string) {
    return {
      success: true,
      data,
      message,
    };
  }

  static error(message: string, details?: any) {
    return {
      success: false,
      error: message,
      details,
    };
  }
}

export class ErrorHandlingMiddleware {
  constructor(private logger: ILogger) {}

  public handle() {
    return (
      err: Error,
      req: Request,
      res: Response,
      next: NextFunction,
    ): void => {
      this.logger.error("Error occurred", {
        error: err.message,
        stack: err.stack,
        path: req.path,
      });

      if (err instanceof NotFoundError) {
        res.status(404).json(ResponseHelper.error(err.message));
        return;
      }

      if (err instanceof ValidationError) {
        res.status(400).json(ResponseHelper.error(err.message));
        return;
      }

      if (err instanceof DomainError) {
        res.status(400).json(ResponseHelper.error(err.message));
        return;
      }

      res.status(500).json(ResponseHelper.error("Internal server error"));
    };
  }

  public notFound() {
    return (req: Request, res: Response): void => {
      res.status(404).json(ResponseHelper.error("Route not found"));
    };
  }
}
