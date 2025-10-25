import { Request, Response, NextFunction } from 'express';

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  // Log request for audit
  console.log(`[Audit] ${req.method} ${req.path} by ${req.headers['x-user-id']}`);
  next();
}



