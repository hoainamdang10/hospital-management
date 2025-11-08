import { Request, Response, NextFunction } from 'express';
import { ApplicationError } from '../../../application/errors/ApplicationError';

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApplicationError) {
    res.status(err.status).json({ success: false, message: err.message });
    return;
  }

  if (err instanceof Error) {
    res.status(500).json({ success: false, message: err.message });
    return;
  }

  res.status(500).json({ success: false, message: 'Internal Server Error' });
}
