import { Request, Response, NextFunction } from 'express';
/**
 * Validation schemas for common data types
 */
export interface ValidationRule {
    field: string;
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'email' | 'phone' | 'date' | 'array' | 'object';
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean | string;
    vietnamese?: string;
}
export interface ValidationSchema {
    body?: ValidationRule[];
    query?: ValidationRule[];
    params?: ValidationRule[];
}
/**
 * Vietnamese phone number validation
 */
export declare const validateVietnamesePhone: (phone: string) => boolean;
/**
 * Vietnamese license number validation
 */
export declare const validateVietnameseLicense: (license: string) => boolean;
/**
 * Email validation
 */
export declare const validateEmail: (email: string) => boolean;
/**
 * Express middleware for request validation
 */
export declare function validateRequest(schema: ValidationSchema): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Common validation schemas
 */
export declare const CommonValidationSchemas: {
    createDoctor: {
        body: ({
            field: string;
            required: boolean;
            type: "string";
            minLength: number;
            maxLength: number;
            vietnamese: string;
            pattern?: undefined;
            min?: undefined;
            max?: undefined;
        } | {
            field: string;
            required: boolean;
            type: "email";
            vietnamese: string;
            minLength?: undefined;
            maxLength?: undefined;
            pattern?: undefined;
            min?: undefined;
            max?: undefined;
        } | {
            field: string;
            required: boolean;
            type: "phone";
            vietnamese: string;
            minLength?: undefined;
            maxLength?: undefined;
            pattern?: undefined;
            min?: undefined;
            max?: undefined;
        } | {
            field: string;
            required: boolean;
            type: "string";
            pattern: RegExp;
            vietnamese: string;
            minLength?: undefined;
            maxLength?: undefined;
            min?: undefined;
            max?: undefined;
        } | {
            field: string;
            required: boolean;
            type: "number";
            min: number;
            max: number;
            vietnamese: string;
            minLength?: undefined;
            maxLength?: undefined;
            pattern?: undefined;
        } | {
            field: string;
            required: boolean;
            type: "string";
            vietnamese: string;
            minLength?: undefined;
            maxLength?: undefined;
            pattern?: undefined;
            min?: undefined;
            max?: undefined;
        })[];
    };
    createPatient: {
        body: ({
            field: string;
            required: boolean;
            type: "string";
            minLength: number;
            maxLength: number;
            vietnamese: string;
        } | {
            field: string;
            required: boolean;
            type: "email";
            vietnamese: string;
            minLength?: undefined;
            maxLength?: undefined;
        } | {
            field: string;
            required: boolean;
            type: "phone";
            vietnamese: string;
            minLength?: undefined;
            maxLength?: undefined;
        } | {
            field: string;
            required: boolean;
            type: "date";
            vietnamese: string;
            minLength?: undefined;
            maxLength?: undefined;
        } | {
            field: string;
            required: boolean;
            type: "string";
            vietnamese: string;
            minLength?: undefined;
            maxLength?: undefined;
        } | {
            field: string;
            required: boolean;
            type: "string";
            maxLength: number;
            vietnamese: string;
            minLength?: undefined;
        })[];
    };
    createAppointment: {
        body: ({
            field: string;
            required: boolean;
            type: "string";
            vietnamese: string;
            maxLength?: undefined;
        } | {
            field: string;
            required: boolean;
            type: "date";
            vietnamese: string;
            maxLength?: undefined;
        } | {
            field: string;
            required: boolean;
            type: "string";
            maxLength: number;
            vietnamese: string;
        })[];
    };
    idParam: {
        params: {
            field: string;
            required: boolean;
            type: "string";
            minLength: number;
            vietnamese: string;
        }[];
    };
    pagination: {
        query: ({
            field: string;
            required: boolean;
            type: "number";
            min: number;
            vietnamese: string;
            max?: undefined;
            maxLength?: undefined;
        } | {
            field: string;
            required: boolean;
            type: "number";
            min: number;
            max: number;
            vietnamese: string;
            maxLength?: undefined;
        } | {
            field: string;
            required: boolean;
            type: "string";
            maxLength: number;
            vietnamese: string;
            min?: undefined;
            max?: undefined;
        })[];
    };
};
/**
 * Middleware to sanitize input data
 */
export declare function sanitizeInput(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=validation.middleware.d.ts.map