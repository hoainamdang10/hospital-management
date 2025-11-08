import { Request, Response, NextFunction } from 'express';
export declare function validationMiddleware(schema: any): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate request using express-validator
 */
export declare function validateRequest(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=validation.middleware.d.ts.map