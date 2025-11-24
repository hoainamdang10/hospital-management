/**
 * Validation Middleware - Presentation Layer
 * Request validation using express-validator
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Input Validation
 */
import { Request, Response, NextFunction } from 'express';
import { ValidationChain } from 'express-validator';
/**
 * Validation middleware factory
 * Creates middleware that validates request using provided validation chains
 */
export declare function validateRequest(validations: ValidationChain[]): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * UUID validation helper
 */
export declare function validateUUID(fieldName: string): {
    isUUID: {
        errorMessage: string;
    };
};
/**
 * Date validation helper
 */
export declare function validateDate(fieldName: string, format?: string): {
    isDate: {
        errorMessage: string;
    };
    matches: {
        options: RegExp[];
        errorMessage: string;
    };
};
/**
 * Time validation helper
 */
export declare function validateTime(fieldName: string): {
    matches: {
        options: RegExp[];
        errorMessage: string;
    };
};
/**
 * Email validation helper
 */
export declare function validateEmail(fieldName?: string): {
    isEmail: {
        errorMessage: string;
    };
    normalizeEmail: boolean;
};
/**
 * Phone number validation helper
 */
export declare function validatePhone(fieldName?: string): {
    matches: {
        options: RegExp[];
        errorMessage: string;
    };
};
/**
 * Pagination validation helpers
 */
export declare function validatePagination(): ({
    query: string;
    optional: {
        options: {
            nullable: boolean;
        };
    };
    isInt: {
        options: {
            min: number;
            max: number;
        };
        errorMessage: string;
    };
    toInt: boolean;
} | {
    query: string;
    optional: {
        options: {
            nullable: boolean;
        };
    };
    isInt: {
        options: {
            min: number;
            max?: undefined;
        };
        errorMessage: string;
    };
    toInt: boolean;
})[];
/**
 * Common validation rules
 */
export declare const commonValidations: {
    appointmentId: {
        isString: {
            errorMessage: string;
        };
        matches: {
            options: RegExp[];
            errorMessage: string;
        };
    };
    patientId: {
        isString: {
            errorMessage: string;
        };
        notEmpty: {
            errorMessage: string;
        };
    };
    doctorId: {
        isString: {
            errorMessage: string;
        };
        notEmpty: {
            errorMessage: string;
        };
    };
    status: {
        isIn: {
            options: string[][];
            errorMessage: string;
        };
    };
    priority: {
        isIn: {
            options: string[][];
            errorMessage: string;
        };
    };
};
//# sourceMappingURL=validation.middleware.d.ts.map