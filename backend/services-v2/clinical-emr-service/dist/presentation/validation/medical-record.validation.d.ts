/**
 * Medical Record Validation Schemas - Presentation Layer
 * Joi validation schemas for medical record API endpoints
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Input Validation, Vietnamese Healthcare Standards
 */
import Joi from 'joi';
export declare const createMedicalRecordSchema: Joi.ObjectSchema<any>;
export declare const updateMedicalRecordSchema: Joi.ObjectSchema<any>;
export declare const getMedicalRecordSchema: Joi.ObjectSchema<any>;
export declare const getPatientMedicalRecordsSchema: Joi.ObjectSchema<any>;
export declare const validationErrorMessages: {
    'any.required': string;
    'string.empty': string;
    'string.min': string;
    'string.max': string;
    'string.pattern.base': string;
    'number.base': string;
    'number.integer': string;
    'number.min': string;
    'number.max': string;
    'date.base': string;
    'date.iso': string;
    'boolean.base': string;
    'any.only': string;
    'object.min': string;
};
export declare function validateVietnameseId(id: string, type: 'patient' | 'doctor' | 'record' | 'appointment'): boolean;
export declare function sanitizeTextInput(input: string): string;
export declare function validateVitalSigns(vitalSigns: any): {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=medical-record.validation.d.ts.map