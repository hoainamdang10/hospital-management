import { Request, Response, NextFunction } from 'express';
export type UserRole = 'admin' | 'receptionist' | 'doctor' | 'patient';
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function requireReceptionistOrAdmin(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
export declare function requireDoctor(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
export declare function requirePatient(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
//# sourceMappingURL=auth.middleware.d.ts.map