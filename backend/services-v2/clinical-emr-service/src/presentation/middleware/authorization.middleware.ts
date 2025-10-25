import { Request, Response, NextFunction } from 'express';

export function authorizationMiddleware(allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRoles = req.headers['x-user-roles'] as string;
    const roles = userRoles ? userRoles.split(',').map(r => r.trim()) : [];
    
    const hasPermission = allowedRoles.some(role => roles.includes(role));
    
    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: 'Forbidden - Insufficient permissions'
      });
      return;
    }

    next();
  };
}



