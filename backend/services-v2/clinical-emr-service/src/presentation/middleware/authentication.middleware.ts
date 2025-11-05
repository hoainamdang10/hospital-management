import { Request, Response, NextFunction } from 'express';

export function authenticationMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Simple JWT check
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized - No token provided'
    });
    return;
  }

  // For now, just pass through
  // TODO: Validate JWT
  next();
}

// Alias for compatibility
export const authenticateJWT = authenticationMiddleware;



