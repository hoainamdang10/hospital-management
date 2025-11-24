"use strict";
/**
 * Validation Schemas - Presentation Layer
 * V2 Clean Architecture + DDD Implementation
 * Input validation schemas for API requests with Vietnamese healthcare rules
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Input Validation, Vietnamese Healthcare Standards
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationOptions = exports.listAppointmentsSchema = exports.getAppointmentSchema = exports.cancelAppointmentSchema = exports.confirmAppointmentSchema = exports.checkAvailabilitySchema = exports.rescheduleAppointmentSchema = exports.scheduleAppointmentSchema = void 0;
const joi_1 = __importDefault(require("joi"));
/**
 * Vietnamese Healthcare Validation Rules
 */
const vietnameseHealthcareRules = {
    // Vietnamese phone number: 10 digits starting with 0
    phoneNumber: joi_1.default.string()
        .pattern(/^0\d{9}$/)
        .messages({
        "string.pattern.base": "Số điện thoại phải có 10 chữ số và bắt đầu bằng 0",
    }),
    // Vietnamese national ID: 9 or 12 digits
    nationalId: joi_1.default.string()
        .pattern(/^\d{9}(\d{3})?$/)
        .messages({
        "string.pattern.base": "Số CMND/CCCD phải có 9 hoặc 12 chữ số",
    }),
    // Vietnamese insurance number formats
    insuranceNumber: joi_1.default.string()
        .pattern(/^[A-Z]{2}\d{13}$/)
        .messages({
        "string.pattern.base": "Số bảo hiểm không đúng định dạng",
    }),
    // Vietnamese name validation
    vietnameseName: joi_1.default.string()
        .min(2)
        .max(100)
        .pattern(/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/)
        .messages({
        "string.pattern.base": "Tên chỉ được chứa chữ cái tiếng Việt và khoảng trắng",
    }),
    // Business hours validation (8:00 - 17:00)
    businessHours: joi_1.default.custom((value, helpers) => {
        const date = new Date(value);
        const hour = date.getHours();
        const dayOfWeek = date.getDay();
        // No appointments on Sundays
        if (dayOfWeek === 0) {
            return helpers.error("custom.noSunday");
        }
        // Business hours: 8:00 - 17:00
        if (hour < 8 || hour >= 17) {
            return helpers.error("custom.businessHours");
        }
        return value;
    }).messages({
        "custom.noSunday": "Không thể đặt lịch hẹn vào Chủ nhật",
        "custom.businessHours": "Lịch hẹn phải trong giờ làm việc (8:00 - 17:00)",
    }),
    // Future date validation
    futureDate: joi_1.default.date().min("now").messages({
        "date.min": "Thời gian phải trong tương lai",
    }),
    // Date range validation (max 60 days in advance)
    dateRange: joi_1.default.date().min("now").max(joi_1.default.ref("$maxDate")).messages({
        "date.max": "Không thể đặt lịch hẹn quá 60 ngày trong tương lai",
    }),
};
/**
 * Schedule Appointment Request Validation Schema
 */
exports.scheduleAppointmentSchema = joi_1.default.object({
    patient: joi_1.default.object({
        patientId: joi_1.default.string()
            .pattern(/^PAT-\d{6}-\d{3}$/)
            .required(),
        fullName: vietnameseHealthcareRules.vietnameseName.required(),
        phone: vietnameseHealthcareRules.phoneNumber.required(),
        dateOfBirth: joi_1.default.date().max("now").required(),
        nationalId: vietnameseHealthcareRules.nationalId.required(),
        email: joi_1.default.string().email().optional(),
        address: joi_1.default.string().max(200).optional(),
        emergencyContact: vietnameseHealthcareRules.phoneNumber.optional(),
        insuranceNumber: vietnameseHealthcareRules.insuranceNumber.optional(),
        insuranceType: joi_1.default.string()
            .valid("BHYT", "BHTN", "PRIVATE", "NONE")
            .optional(),
    }).required(),
    provider: joi_1.default.object({
        providerId: joi_1.default.alternatives()
            .try(joi_1.default.string().pattern(/^[A-Z]{3,4}-DOC-\d{6}-\d{3}$/), // e.g., PEDI-DOC-202502-010
        joi_1.default.string().pattern(/^DOC-GEN-\d{6}-\d{3}$/))
            .required(),
        fullName: vietnameseHealthcareRules.vietnameseName.optional(),
        specialization: joi_1.default.string().max(100).optional(),
        department: joi_1.default.string().max(100).optional(),
    }).required(),
    appointment: joi_1.default.object({
        appointmentType: joi_1.default.string()
            .valid("consultation", "follow_up", "emergency", "telemedicine", "surgery", "procedure", "urgent_consultation", "medical_test")
            .required(),
        priority: joi_1.default.string()
            .valid("low", "normal", "urgent", "emergency")
            .required(),
        startTime: vietnameseHealthcareRules.businessHours.required(),
        endTime: joi_1.default.date().greater(joi_1.default.ref("startTime")).required(),
        roomId: joi_1.default.string()
            .pattern(/^ROOM-\d{3}$/)
            .optional(),
        reason: joi_1.default.string().min(3).max(500).required(),
        reasonCode: joi_1.default.string()
            .valid("consultation", "follow_up", "emergency", "surgery", "diagnostic", "therapy", "vaccination", "checkup", "prescription", "referral")
            .optional(),
        symptoms: joi_1.default.string().max(1000).optional(),
        notes: joi_1.default.string().max(1000).optional(),
        preparationInstructions: joi_1.default.string().max(500).optional(),
        estimatedDuration: joi_1.default.number().integer().min(15).max(480).required(),
        requiresPreparation: joi_1.default.boolean().optional().default(false),
        isFollowUp: joi_1.default.boolean().optional().default(false),
        previousAppointmentId: joi_1.default.when("isFollowUp", {
            is: true,
            then: joi_1.default.string().required(),
            otherwise: joi_1.default.string().optional(),
        }),
        urgencyLevel: joi_1.default.string()
            .valid("routine", "urgent", "emergency")
            .optional()
            .default("routine"),
        specialRequirements: joi_1.default.array()
            .items(joi_1.default.string().max(100))
            .max(10)
            .optional(),
        interpreterRequired: joi_1.default.boolean().optional().default(false),
        wheelchairAccessible: joi_1.default.boolean().optional().default(false),
        fasting: joi_1.default.boolean().optional().default(false),
        medicationRestrictions: joi_1.default.array()
            .items(joi_1.default.string().max(100))
            .max(20)
            .optional(),
    }).required(),
    departmentCode: joi_1.default.string()
        .pattern(/^[A-Z]{3,4}$/)
        .required(),
    createdBy: joi_1.default.string().optional(), // Will be set from authentication context
}).options({
    abortEarly: false, // Return all validation errors
    allowUnknown: false, // Don't allow unknown fields
    stripUnknown: true, // Remove unknown fields
});
/**
 * Reschedule Appointment Request Validation Schema
 * Accepts either (appointmentDate + appointmentTime) from frontend
 * or legacy newStartTime/newEndTime payloads from admin portal.
 */
exports.rescheduleAppointmentSchema = joi_1.default.object({
    appointmentDate: joi_1.default.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .messages({
        "string.pattern.base": "Ngày phải đúng định dạng YYYY-MM-DD",
    }),
    appointmentTime: joi_1.default.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/)
        .messages({
        "string.pattern.base": "Giờ phải đúng định dạng HH:mm hoặc HH:mm:ss",
    }),
    // Legacy payloads may send ISO datetime values
    newStartTime: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.date()).optional(),
    newEndTime: joi_1.default.alternatives().try(joi_1.default.string(), joi_1.default.date()).optional(),
    reason: joi_1.default.string().min(3).max(500).required(),
    notifyPatient: joi_1.default.boolean().optional().default(true),
    notifyDoctor: joi_1.default.boolean().optional().default(true),
    rescheduledBy: joi_1.default.string().optional(), // Will be set from authentication context
})
    .custom((value, helpers) => {
    const ensureTimeString = (time) => {
        if (!time) {
            return time;
        }
        if (/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(time)) {
            return time;
        }
        if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
            return `${time}:00`;
        }
        const parsed = new Date(time);
        if (!isNaN(parsed.getTime())) {
            return parsed.toTimeString().split(" ")[0];
        }
        return time;
    };
    const normalizeFromDate = (input) => {
        const parsed = new Date(input);
        if (isNaN(parsed.getTime())) {
            throw helpers.error("date.base", { label: "appointmentDate" });
        }
        value.appointmentDate = parsed.toISOString().split("T")[0];
        value.appointmentTime = parsed.toTimeString().split(" ")[0];
    };
    if (!value.appointmentDate || !value.appointmentTime) {
        if (!value.newStartTime) {
            return helpers.error("any.required", { label: "appointmentDate" });
        }
        normalizeFromDate(value.newStartTime);
    }
    else {
        const normalizedTime = ensureTimeString(value.appointmentTime);
        if (!/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(normalizedTime)) {
            return helpers.error("string.pattern.base", {
                label: "appointmentTime",
                value: value.appointmentTime,
            });
        }
        value.appointmentTime = normalizedTime;
    }
    // Cleanup legacy fields to avoid leaking to use case
    delete value.newStartTime;
    delete value.newEndTime;
    return value;
})
    .options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
});
/**
 * Check Availability Request Validation Schema
 */
exports.checkAvailabilitySchema = joi_1.default.object({
    providerId: joi_1.default.string()
        .pattern(/^[A-Z]{3,4}-DOC-\d{6}-\d{3}$/)
        .optional(),
    departmentCode: joi_1.default.string()
        .pattern(/^[A-Z]{3,4}$/)
        .optional(),
    date: vietnameseHealthcareRules.dateRange.required(),
    startTime: joi_1.default.date().optional(),
    endTime: joi_1.default.when("startTime", {
        is: joi_1.default.exist(),
        then: joi_1.default.date().greater(joi_1.default.ref("startTime")).required(),
        otherwise: joi_1.default.date().optional(),
    }),
    appointmentType: joi_1.default.string()
        .valid("consultation", "follow_up", "emergency", "surgery", "diagnostic", "therapy", "vaccination", "checkup", "prescription", "referral")
        .optional(),
    duration: joi_1.default.number().integer().min(15).max(480).optional(),
    includeUnavailable: joi_1.default.boolean().optional().default(false),
})
    .or("providerId", "departmentCode")
    .options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
});
/**
 * V3 API Validation Schemas (Clean Architecture - Only IDs)
 */
// Confirm Appointment Schema
exports.confirmAppointmentSchema = joi_1.default.object({
    confirmedBy: joi_1.default.string().optional(), // Will be set from auth context
}).options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
});
// Cancel Appointment Schema
exports.cancelAppointmentSchema = joi_1.default.object({
    cancellationReason: joi_1.default.string().min(3).max(500),
    reason: joi_1.default.string().min(3).max(500),
    cancelledBy: joi_1.default.string().optional(), // Will be set from auth context
})
    .custom((value, helpers) => {
    if (!value.cancellationReason && value.reason) {
        value.cancellationReason = value.reason;
    }
    if (!value.cancellationReason) {
        return helpers.error("any.required", { label: "cancellationReason" });
    }
    delete value.reason;
    return value;
})
    .options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
});
// Get Appointment Schema (params)
exports.getAppointmentSchema = joi_1.default.object({
    id: joi_1.default.string().required(),
}).options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
});
// List Appointments Schema (query)
exports.listAppointmentsSchema = joi_1.default.object({
    patientId: joi_1.default.string().optional(),
    doctorId: joi_1.default.string().optional(),
    startDate: joi_1.default.date().optional(),
    endDate: joi_1.default.date()
        .when("startDate", {
        is: joi_1.default.exist(),
        then: joi_1.default.date().greater(joi_1.default.ref("startDate")),
        otherwise: joi_1.default.date(),
    })
        .optional(),
    status: joi_1.default.string()
        .valid("SCHEDULED", "CONFIRMED", "ARRIVED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW")
        .optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional().default(50),
    offset: joi_1.default.number().integer().min(0).optional().default(0),
}).options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
});
/**
 * Common validation options
 */
exports.validationOptions = {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
    context: {
        maxDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    },
};
//# sourceMappingURL=ValidationSchemas.js.map