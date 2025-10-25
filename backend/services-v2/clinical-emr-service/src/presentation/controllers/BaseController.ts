/**
 * Base Controller - Presentation Layer
 * Common controller functionality
 */

import { Request, Response } from 'express';

export abstract class BaseController {
  /**
   * Extract user ID from request
   */
  protected extractUserId(req: Request): string {
    return req.headers['x-user-id'] as string || 'unknown';
  }

  /**
   * Extract user roles from request
   */
  protected extractUserRoles(req: Request): string[] {
    const rolesHeader = req.headers['x-user-roles'] as string;
    return rolesHeader ? rolesHeader.split(',').map(r => r.trim()) : [];
  }

  /**
   * Send success response
   */
  protected sendSuccessResponse(
    res: Response,
    data: any,
    message: string = 'Success',
    statusCode: number = 200
  ): void {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send error response
   */
  protected sendErrorResponse(
    res: Response,
    message: string,
    statusCode: number = 400,
    errors?: any[]
  ): void {
    res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle controller errors
   */
  protected handleControllerError(
    res: Response,
    error: unknown,
    defaultMessage: string = 'Internal server error'
  ): void {
    console.error('Controller error:', error);
    
    const message = error instanceof Error ? error.message : defaultMessage;
    const statusCode = 500;

    this.sendErrorResponse(res, message, statusCode);
  }
}



