import { NextFunction, Request, Response } from "express";
export declare class HIPAAComplianceMiddleware {
    private supabase;
    auditAccess: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    private logAccess;
    private containsPHI;
    maskSensitiveData: (req: Request, res: Response, next: NextFunction) => void;
    rateLimitPHI(req: Request, res: Response, next: NextFunction): Promise<any>;
}
export declare const hipaaMiddleware: HIPAAComplianceMiddleware;
//# sourceMappingURL=hipaa-compliance.middleware.d.ts.map