/**
 * Validation Schemas - Presentation Layer
 * V2 Clean Architecture + DDD Implementation
 * Input validation schemas for API requests with Vietnamese healthcare rules
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Input Validation, Vietnamese Healthcare Standards
 */
import Joi from "joi";
/**
 * Schedule Appointment Request Validation Schema
 */
export declare const scheduleAppointmentSchema: Joi.ObjectSchema<any>;
/**
 * Reschedule Appointment Request Validation Schema
 * Accepts either (appointmentDate + appointmentTime) from frontend
 * or legacy newStartTime/newEndTime payloads from admin portal.
 */
export declare const rescheduleAppointmentSchema: Joi.ObjectSchema<any>;
/**
 * Check Availability Request Validation Schema
 */
export declare const checkAvailabilitySchema: Joi.ObjectSchema<any>;
/**
 * V3 API Validation Schemas (Clean Architecture - Only IDs)
 */
export declare const confirmAppointmentSchema: Joi.ObjectSchema<any>;
export declare const cancelAppointmentSchema: Joi.ObjectSchema<any>;
export declare const getAppointmentSchema: Joi.ObjectSchema<any>;
export declare const listAppointmentsSchema: Joi.ObjectSchema<any>;
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