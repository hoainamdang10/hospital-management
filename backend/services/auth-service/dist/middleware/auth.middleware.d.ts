import { NextFunction, Request, Response } from "express";
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (roles: string | string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireDoctor: (req: Request, res: Response, next: NextFunction) => void;
export declare const requirePatient: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireDoctorOrAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireReceptionist: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireReceptionistOrAdmin: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map