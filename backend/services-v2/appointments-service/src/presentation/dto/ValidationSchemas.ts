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
 * Vietnamese Healthcare Validation Rules
 */
const vietnameseHealthcareRules = {
  // Vietnamese phone number: 10 digits starting with 0
  phoneNumber: Joi.string()
    .pattern(/^0\d{9}$/)
    .messages({
      "string.pattern.base": "Số điện thoại phải có 10 chữ số và bắt đầu bằng 0",
    }),

  // Vietnamese national ID: 9 or 12 digits
  nationalId: Joi.string()
    .pattern(/^\d{9}(\d{3})?$/)
    .messages({
      "string.pattern.base": "Số CMND/CCCD phải có 9 hoặc 12 chữ số",
    }),

  // Vietnamese insurance number formats
  insuranceNumber: Joi.string()
    .pattern(/^[A-Z]{2}\d{13}$/)
    .messages({
      "string.pattern.base": "Số bảo hiểm không đúng định dạng",
    }),

  // Vietnamese name validation
  vietnameseName: Joi.string()
    .min(2)
    .max(100)
    .pattern(
      /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/,
    )
    .messages({
      "string.pattern.base": "Tên chỉ được chứa chữ cái tiếng Việt và khoảng trắng",
    }),

  // Business hours validation (8:00 - 17:00)
  businessHours: Joi.custom((value, helpers) => {
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
  futureDate: Joi.date().min("now").messages({
    "date.min": "Thời gian phải trong tương lai",
  }),

  // Date range validation (max 60 days in advance)
  dateRange: Joi.date()
    .min("now")
    .max(Joi.ref("$maxDate"))
    .messages({
      "date.max": "Không thể đặt lịch hẹn quá 60 ngày trong tương lai",
    }),
};

/**
 * Schedule Appointment Request Validation Schema
 */
export const scheduleAppointmentSchema = Joi.object({
  patient: Joi.object({
    patientId: Joi.string()
      .pattern(/^PAT-\d{6}-\d{3}$/)
      .required(),

    fullName: vietnameseHealthcareRules.vietnameseName
      .required(),

    phone: vietnameseHealthcareRules.phoneNumber
      .required(),

    dateOfBirth: Joi.date()
      .max("now")
      .required(),

    nationalId: vietnameseHealthcareRules.nationalId
      .required(),

    email: Joi.string()
      .email()
      .optional(),

    address: Joi.string()
      .max(200)
      .optional(),

    emergencyContact: vietnameseHealthcareRules.phoneNumber.optional(),

    insuranceNumber: vietnameseHealthcareRules.insuranceNumber.optional(),

    insuranceType: Joi.string()
      .valid("BHYT", "BHTN", "PRIVATE", "NONE")
      .optional(),
  }).required(),

  provider: Joi.object({
    providerId: Joi.alternatives()
      .try(
        Joi.string().pattern(/^[A-Z]{3,4}-DOC-\d{6}-\d{3}$/), // e.g., PEDI-DOC-202502-010
        Joi.string().pattern(/^DOC-GEN-\d{6}-\d{3}$/)    // e.g., DOC-GEN-202511-955
      )
      .required(),

    fullName: vietnameseHealthcareRules.vietnameseName.optional(),

    specialization: Joi.string().max(100).optional(),

    department: Joi.string().max(100).optional(),
  }).required(),

  appointment: Joi.object({
    appointmentType: Joi.string()
      .valid(
        "consultation",
        "follow_up",
        "emergency",
        "telemedicine",
        "surgery",
        "procedure",
        "urgent_consultation",
        "medical_test",
      )
      .required(),

    priority: Joi.string()
      .valid("low", "normal", "urgent", "emergency")
      .required(),

    startTime: vietnameseHealthcareRules.businessHours
      .required(),

    endTime: Joi.date()
      .greater(Joi.ref("startTime"))
      .required(),

    roomId: Joi.string()
      .pattern(/^ROOM-\d{3}$/)
      .optional(),

    reason: Joi.string()
      .min(3)
      .max(500)
      .required(),

    reasonCode: Joi.string()
      .valid(
        "consultation",
        "follow_up",
        "emergency",
        "surgery",
        "diagnostic",
        "therapy",
        "vaccination",
        "checkup",
        "prescription",
        "referral",
      )
      .optional(),

    symptoms: Joi.string()
      .max(1000)
      .optional()
      ,

    notes: Joi.string()
      .max(1000)
      .optional()
      ,

    preparationInstructions: Joi.string()
      .max(500)
      .optional()
      ,

    estimatedDuration: Joi.number()
      .integer()
      .min(15)
      .max(480)
      .required()
      ,

    requiresPreparation: Joi.boolean().optional().default(false),

    isFollowUp: Joi.boolean().optional().default(false),

    previousAppointmentId: Joi.when("isFollowUp", {
      is: true,
      then: Joi.string()
        .required()
        ,
      otherwise: Joi.string().optional(),
    }),

    urgencyLevel: Joi.string()
      .valid("routine", "urgent", "emergency")
      .optional()
      .default("routine"),

    specialRequirements: Joi.array()
      .items(Joi.string().max(100))
      .max(10)
      .optional()
      ,

    interpreterRequired: Joi.boolean().optional().default(false),

    wheelchairAccessible: Joi.boolean().optional().default(false),

    fasting: Joi.boolean().optional().default(false),

    medicationRestrictions: Joi.array()
      .items(Joi.string().max(100))
      .max(20)
      .optional()
      ,
  }).required(),

  departmentCode: Joi.string()
    .pattern(/^[A-Z]{3,4}$/)
    .required()
    ,

  createdBy: Joi.string().optional(), // Will be set from authentication context
}).options({
  abortEarly: false, // Return all validation errors
  allowUnknown: false, // Don't allow unknown fields
  stripUnknown: true, // Remove unknown fields
});

/**
 * Reschedule Appointment Request Validation Schema
 */
export const rescheduleAppointmentSchema = Joi.object({
  appointmentId: Joi.string().required(),

  newStartTime: vietnameseHealthcareRules.businessHours
    .required()
    ,

  newEndTime: Joi.date()
    .greater(Joi.ref("newStartTime"))
    .required()
    ,

  newRoomId: Joi.string()
    .pattern(/^ROOM-\d{3}$/)
    .optional()
    ,

  reason: Joi.string()
    .min(3)
    .max(500)
    .required()
    ,

  notifyPatient: Joi.boolean().optional().default(true),

  notifyProvider: Joi.boolean().optional().default(true),

  rescheduledBy: Joi.string().optional(), // Will be set from authentication context
}).options({
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: true,
});

/**
 * Check Availability Request Validation Schema
 */
export const checkAvailabilitySchema = Joi.object({
  providerId: Joi.string()
    .pattern(/^[A-Z]{3,4}-DOC-\d{6}-\d{3}$/)
    .optional()
    ,

  departmentCode: Joi.string()
    .pattern(/^[A-Z]{3,4}$/)
    .optional()
    ,

  date: vietnameseHealthcareRules.dateRange
    .required()
    ,

  startTime: Joi.date().optional(),

  endTime: Joi.when("startTime", {
    is: Joi.exist(),
    then: Joi.date().greater(Joi.ref("startTime")).required(),
    otherwise: Joi.date().optional(),
  }),

  appointmentType: Joi.string()
    .valid(
      "consultation",
      "follow_up",
      "emergency",
      "surgery",
      "diagnostic",
      "therapy",
      "vaccination",
      "checkup",
      "prescription",
      "referral",
    )
    .optional(),

  duration: Joi.number()
    .integer()
    .min(15)
    .max(480)
    .optional()
    ,

  includeUnavailable: Joi.boolean().optional().default(false),
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
export const confirmAppointmentSchema = Joi.object({
  confirmedBy: Joi.string().optional(), // Will be set from auth context
}).options({
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: true,
});

// Cancel Appointment Schema
export const cancelAppointmentSchema = Joi.object({
  cancellationReason: Joi.string()
    .min(3)
    .max(500)
    ,
  reason: Joi.string()
    .min(3)
    .max(500)
    ,
  cancelledBy: Joi.string().optional(), // Will be set from auth context
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
export const getAppointmentSchema = Joi.object({
  id: Joi.string().required(),
}).options({
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: true,
});

// List Appointments Schema (query)
export const listAppointmentsSchema = Joi.object({
  patientId: Joi.string().optional(),
  doctorId: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date()
    .when("startDate", {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref("startDate")),
      otherwise: Joi.date(),
    })
    .optional()
    ,
  status: Joi.string()
    .valid(
      "SCHEDULED",
      "CONFIRMED",
      "ARRIVED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "NO_SHOW",
    )
    .optional(),
  limit: Joi.number().integer().min(1).max(100).optional().default(50),
  offset: Joi.number().integer().min(0).optional().default(0),
}).options({
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: true,
});

/**
 * Common validation options
 */
export const validationOptions = {
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: true,
  context: {
    maxDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
  },
};
