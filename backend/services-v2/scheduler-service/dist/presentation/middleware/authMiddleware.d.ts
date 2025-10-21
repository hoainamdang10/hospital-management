import { Request, Response, NextFunction } from 'express';
interface JWTPayload {
    sub: string;
    email?: string;
    role?: string;
    service?: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): void;
export {};
//# sourceMappingURL=authMiddleware.d.ts.map