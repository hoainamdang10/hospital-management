/**
 * Validation Schemas - Presentation Layer
 * V2 Clean Architecture + DDD Implementation
 * Input validation schemas for API requests with Vietnamese healthcare rules
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Input Validation, Vietnamese Healthcare Standards
 */
import Joi from 'joi';
/**
 * Schedule Appointment Request Validation Schema
 */
export declare const scheduleAppointmentSchema: Joi.ObjectSchema<any>;
/**
 * Reschedule Appointment Request Validation Schema
 */
export declare const rescheduleAppointmentSchema: Joi.ObjectSchema<any>;
/**
 * Check Availability Request Validation Schema
 */
export declare const checkAvailabilitySchema: Joi.ObjectSchema<any>;
/**
 * Common validation options
 */
export declare const validationOptions: {
    abortEarly: boolean;
    allowUnknown: boolean;
    stripUnknown: boolean;
    context: {
        maxDate: Date;
    };
};
//# sourceMappingURL=ValidationSchemas.d.ts.map