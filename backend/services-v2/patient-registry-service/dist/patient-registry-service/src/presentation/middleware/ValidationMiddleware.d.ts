/**
 * Validation Middleware
 * Request validation using express-validator
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Vietnamese Healthcare Standards
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Handle validation errors
 */
export declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate register patient request
 */
export declare const validateRegisterPatient: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
/**
 * Validate update patient request
 */
export declare const validateUpdatePatient: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
/**
 * Validate patient ID parameter
 */
export declare const validatePatientId: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
/**
 * Validate user ID parameter
 */
export declare const validateUserId: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
/**
 * Validate national ID parameter
 */
export declare const validateNationalId: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
/**
 * Validate BHYT number parameter
 */
export declare const validateBHYTNumber: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
/**
 * Validate search patients request
 */
export declare const validateSearchPatients: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
/**
 * Validate filter patients request
 */
export declare const validateFilterPatients: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
/**
 * Validate match patients request
 */
export declare const validateMatchPatients: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
/**
 * Validate merge patients request
 */
export declare const validateMergePatients: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
/**
 * Validate link patients request
 */
export declare const validateLinkPatients: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
/**
 * Validate add emergency contact request
 */
export declare const validateAddEmergencyContact: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
/**
 * Validate grant consent request
 */
export declare const validateGrantConsent: (((req: Request, res: Response, next: NextFunction) => void) | import("express-validator").ValidationChain)[];
//# sourceMappingURL=ValidationMiddleware.d.ts.map