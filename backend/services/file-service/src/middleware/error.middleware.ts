import express from "express";
import { logger } from "../utils/logger";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

export class ValidationError extends Error {
  statusCode = 400;
  isOperational = true;
  code = "VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class FileError extends Error {
  statusCode = 400;
  isOperational = true;
  code = "FILE_ERROR";

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "FileError";
    this.statusCode = statusCode;
  }
}

export class SecurityError extends Error {
  statusCode = 403;
  isOperational = true;
  code = "SECURITY_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "SecurityError";
  }
}

export class StorageError extends Error {
  statusCode = 500;
  isOperational = true;
  code = "STORAGE_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}

export const errorHandler = (
  err: AppError,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  // Default to 500 server error
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let code = err.code || "INTERNAL_ERROR";

  // Log error details
  logger.error("Error occurred", {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      statusCode,
      code,
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    },
  });

  // Handle specific error types
  if (err.name === "ValidationError" || err.name === "CastError") {
    statusCode = 400;
    message = "Invalid input data";
    code = "VALIDATION_ERROR";
  }

  if (err.name === "MulterError") {
    statusCode = 400;
    code = "FILE_UPLOAD_ERROR";

    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        message = "File size exceeds the allowed limit";
        break;
      case "LIMIT_FILE_COUNT":
        message = "Too many files uploaded";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = "Unexpected file field";
        break;
      default:
        message = "File upload error";
    }
  }

  // Don't expose internal errors in production
  if (statusCode >= 500 && process.env.NODE_ENV === "production") {
    message = "Something went wrong. Please try again later.";
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
};

export const asyncHandler = (fn: Function) => {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
