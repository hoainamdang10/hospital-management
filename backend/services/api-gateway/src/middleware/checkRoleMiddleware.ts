import { Request, Response, NextFunction } from 'express';

export const checkRoleMiddleware = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.headers['x-user-role'];

    if (userRole !== requiredRole) {
      res.status(403).json({
        success: false,
        error: `Access denied. ${requiredRole} role required.`
      });
      return;
    }

    next();
  };
};
