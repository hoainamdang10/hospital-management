import { Request, Response, NextFunction } from 'express';
export declare const checkRoleMiddleware: (requiredRole: string) => (req: Request, res: Response, next: NextFunction) => void;
