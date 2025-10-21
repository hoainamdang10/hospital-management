import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
export declare function validateRequest(schema: Joi.ObjectSchema): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validateRequest.d.ts.map