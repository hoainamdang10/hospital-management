import { Request, Response, NextFunction } from 'express';

export function validationMiddleware(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Simple validation - can enhance with Joi
    next();
  };
}



