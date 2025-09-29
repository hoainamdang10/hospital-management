import { NextFunction, Request, Response } from "express";
export declare const validateDoctorId: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateDateFormat: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateTimeFormat: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateAvailabilityQuery: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateCheckAvailabilityBody: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateWeekStartDate: (req: Request, res: Response, next: NextFunction) => void;
export declare const logAvailabilityRequest: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.middleware.d.ts.map