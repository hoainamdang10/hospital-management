import { NextFunction, Request, Response } from "express";
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        userId: string;
        email: string;
        role: string;
        full_name?: string;
        phone_number?: string;
        is_active?: boolean;
        receptionist_id?: string;
        patient_id?: string;
    };
}
export declare const authMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (allowedRoles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireReceptionist: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireReceptionistOrAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const authenticateToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=auth.middleware.d.ts.map