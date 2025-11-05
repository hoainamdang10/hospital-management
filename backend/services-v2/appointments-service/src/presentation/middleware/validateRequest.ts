/**
 * Express Validator Middleware
 * Simple validation middleware using express-validator
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Validate request using express-validator
 */
export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: 'param' in err ? err.param : 'unknown',
        message: err.msg
      }))
    });
    return;
  }
  
  next();
}

