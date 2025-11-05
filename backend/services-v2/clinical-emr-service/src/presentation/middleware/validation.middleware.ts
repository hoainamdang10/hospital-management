import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export function validationMiddleware(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Simple validation - can enhance with Joi
    next();
  };
}

/**
 * Validate request using express-validator
 */
export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.type === 'field' ? (err as any).path : 'unknown',
        message: err.msg,
        code: 'VALIDATION_ERROR'
      }))
    });
    return;
  }

  next();
}



