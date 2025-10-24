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
exports.validationOptions = exports.checkAvailabilitySchema = exports.rescheduleAppointmentSchema = exports.scheduleAppointmentSchema = void 0;
const joi_1 = __importDefault(require("joi"));
/**
 * Vietnamese Healthcare Validation Rules
 */
const vietnameseHealthcareRules = {
    // Vietnamese phone number: 10 digits starting with 0
    phoneNumber: joi_1.default.string()
        .pattern(/^0\d{9}$/)
        .message('Số điện thoại phải có 10 chữ số và bắt đầu bằng 0'),
    // Vietnamese national ID: 9 or 12 digits
    nationalId: joi_1.default.string()
        .pattern(/^\d{9}(\d{3})?$/)
        .message('Số CMND/CCCD phải có 9 hoặc 12 chữ số'),
    // Vietnamese insurance number formats
    insuranceNumber: joi_1.default.string()
        .pattern(/^[A-Z]{2}\d{13}$/)
        .message('Số bảo hiểm không đúng định dạng'),
    // Vietnamese name validation
    vietnameseName: joi_1.default.string()
        .min(2)
        .max(100)
        .pattern(/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/)
        .message('Tên chỉ được chứa chữ cái tiếng Việt và khoảng trắng'),
    // Business hours validation (8:00 - 17:00)
    businessHours: joi_1.default.custom((value, helpers) => {
        const date = new Date(value);
        const hour = date.getHours();
        const dayOfWeek = date.getDay();
        // No appointments on Sundays
        if (dayOfWeek === 0) {
            return helpers.error('custom.noSunday');
        }
        // Business hours: 8:00 - 17:00
        if (hour < 8 || hour >= 17) {
            return helpers.error('custom.businessHours');
        }
        return value;
    }).messages({
        'custom.noSunday': 'Không thể đặt lịch hẹn vào Chủ nhật',
        'custom.businessHours': 'Lịch hẹn phải trong giờ làm việc (8:00 - 17:00)'
    }),
    // Future date validation
    futureDate: joi_1.default.date()
        .min('now')
        .message('Thời gian phải trong tương lai'),
    // Date range validation (max 60 days in advance)
    dateRange: joi_1.default.date()
        .min('now')
        .max(joi_1.default.ref('$maxDate'))
        .message('Không thể đặt lịch hẹn quá 60 ngày trong tương lai')
};
/**
 * Schedule Appointment Request Validation Schema
 */
exports.scheduleAppointmentSchema = joi_1.default.object({
    patient: joi_1.default.object({
        patientId: joi_1.default.string()
            .pattern(/^PAT-\d{6}-\d{3}$/)
            .required()
            .message('Mã bệnh nhân không đúng định dạng (PAT-YYYYMM-XXX)'),
        fullName: vietnameseHealthcareRules.vietnameseName
            .required()
            .message('Tên bệnh nhân là bắt buộc'),
        phone: vietnameseHealthcareRules.phoneNumber
            .required()
            .message('Số điện thoại là bắt buộc'),
        dateOfBirth: joi_1.default.date()
            .max('now')
            .required()
            .message('Ngày sinh không hợp lệ'),
        nationalId: vietnameseHealthcareRules.nationalId
            .required()
            .message('Số CMND/CCCD là bắt buộc'),
        email: joi_1.default.string()
            .email()
            .optional()
            .message('Email không đúng định dạng'),
        address: joi_1.default.string()
            .max(200)
            .optional()
            .message('Địa chỉ không được vượt quá 200 ký tự'),
        emergencyContact: vietnameseHealthcareRules.phoneNumber
            .optional(),
        insuranceNumber: vietnameseHealthcareRules.insuranceNumber
            .optional(),
        insuranceType: joi_1.default.string()
            .valid('BHYT', 'BHTN', 'PRIVATE', 'NONE')
            .optional()
            .message('Loại bảo hiểm không hợp lệ')
    }).required(),
    provider: joi_1.default.object({
        providerId: joi_1.default.string()
            .pattern(/^[A-Z]{3,4}-DOC-\d{6}-\d{3}$/)
            .required()
            .message('Mã bác sĩ không đúng định dạng'),
        fullName: vietnameseHealthcareRules.vietnameseName
            .optional(),
        specialization: joi_1.default.string()
            .max(100)
            .optional(),
        department: joi_1.default.string()
            .max(100)
            .optional()
    }).required(),
    appointment: joi_1.default.object({
        appointmentType: joi_1.default.string()
            .valid('consultation', 'follow_up', 'emergency', 'surgery', 'diagnostic', 'therapy', 'vaccination', 'checkup', 'prescription', 'referral')
            .required()
            .message('Loại cuộc hẹn không hợp lệ'),
        priority: joi_1.default.string()
            .valid('low', 'normal', 'high', 'urgent', 'emergency')
            .required()
            .message('Mức độ ưu tiên không hợp lệ'),
        startTime: vietnameseHealthcareRules.businessHours
            .required()
            .message('Thời gian bắt đầu là bắt buộc'),
        endTime: joi_1.default.date()
            .greater(joi_1.default.ref('startTime'))
            .required()
            .message('Thời gian kết thúc phải sau thời gian bắt đầu'),
        roomId: joi_1.default.string()
            .pattern(/^ROOM-\d{3}$/)
            .optional()
            .message('Mã phòng không đúng định dạng'),
        reason: joi_1.default.string()
            .min(3)
            .max(500)
            .required()
            .message('Lý do khám phải có từ 3-500 ký tự'),
        reasonCode: joi_1.default.string()
            .valid('consultation', 'follow_up', 'emergency', 'surgery', 'diagnostic', 'therapy', 'vaccination', 'checkup', 'prescription', 'referral')
            .optional(),
        symptoms: joi_1.default.string()
            .max(1000)
            .optional()
            .message('Mô tả triệu chứng không được vượt quá 1000 ký tự'),
        notes: joi_1.default.string()
            .max(1000)
            .optional()
            .message('Ghi chú không được vượt quá 1000 ký tự'),
        preparationInstructions: joi_1.default.string()
            .max(500)
            .optional()
            .message('Hướng dẫn chuẩn bị không được vượt quá 500 ký tự'),
        estimatedDuration: joi_1.default.number()
            .integer()
            .min(15)
            .max(480)
            .required()
            .message('Thời gian dự kiến phải từ 15 phút đến 8 giờ'),
        requiresPreparation: joi_1.default.boolean()
            .optional()
            .default(false),
        isFollowUp: joi_1.default.boolean()
            .optional()
            .default(false),
        previousAppointmentId: joi_1.default.when('isFollowUp', {
            is: true,
            then: joi_1.default.string().required().message('Cuộc hẹn tái khám phải có mã cuộc hẹn trước đó'),
            otherwise: joi_1.default.string().optional()
        }),
        urgencyLevel: joi_1.default.string()
            .valid('routine', 'urgent', 'emergency')
            .optional()
            .default('routine'),
        specialRequirements: joi_1.default.array()
            .items(joi_1.default.string().max(100))
            .max(10)
            .optional()
            .message('Yêu cầu đặc biệt không được vượt quá 10 mục'),
        interpreterRequired: joi_1.default.boolean()
            .optional()
            .default(false),
        wheelchairAccessible: joi_1.default.boolean()
            .optional()
            .default(false),
        fasting: joi_1.default.boolean()
            .optional()
            .default(false),
        medicationRestrictions: joi_1.default.array()
            .items(joi_1.default.string().max(100))
            .max(20)
            .optional()
            .message('Hạn chế thuốc không được vượt quá 20 mục')
    }).required(),
    departmentCode: joi_1.default.string()
        .pattern(/^[A-Z]{3,4}$/)
        .required()
        .message('Mã khoa không đúng định dạng'),
    createdBy: joi_1.default.string()
        .optional() // Will be set from authentication context
}).options({
    abortEarly: false, // Return all validation errors
    allowUnknown: false, // Don't allow unknown fields
    stripUnknown: true // Remove unknown fields
});
/**
 * Reschedule Appointment Request Validation Schema
 */
exports.rescheduleAppointmentSchema = joi_1.default.object({
    appointmentId: joi_1.default.string()
        .required()
        .message('Mã cuộc hẹn là bắt buộc'),
    newStartTime: vietnameseHealthcareRules.businessHours
        .required()
        .message('Thời gian bắt đầu mới là bắt buộc'),
    newEndTime: joi_1.default.date()
        .greater(joi_1.default.ref('newStartTime'))
        .required()
        .message('Thời gian kết thúc mới phải sau thời gian bắt đầu'),
    newRoomId: joi_1.default.string()
        .pattern(/^ROOM-\d{3}$/)
        .optional()
        .message('Mã phòng không đúng định dạng'),
    reason: joi_1.default.string()
        .min(3)
        .max(500)
        .required()
        .message('Lý do thay đổi lịch phải có từ 3-500 ký tự'),
    notifyPatient: joi_1.default.boolean()
        .optional()
        .default(true),
    notifyProvider: joi_1.default.boolean()
        .optional()
        .default(true),
    rescheduledBy: joi_1.default.string()
        .optional() // Will be set from authentication context
}).options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
});
/**
 * Check Availability Request Validation Schema
 */
exports.checkAvailabilitySchema = joi_1.default.object({
    providerId: joi_1.default.string()
        .pattern(/^[A-Z]{3,4}-DOC-\d{6}-\d{3}$/)
        .optional()
        .message('Mã bác sĩ không đúng định dạng'),
    departmentCode: joi_1.default.string()
        .pattern(/^[A-Z]{3,4}$/)
        .optional()
        .message('Mã khoa không đúng định dạng'),
    date: vietnameseHealthcareRules.dateRange
        .required()
        .message('Ngày kiểm tra là bắt buộc'),
    startTime: joi_1.default.date()
        .optional(),
    endTime: joi_1.default.when('startTime', {
        is: joi_1.default.exist(),
        then: joi_1.default.date().greater(joi_1.default.ref('startTime')).required(),
        otherwise: joi_1.default.date().optional()
    }).message('Thời gian kết thúc phải sau thời gian bắt đầu'),
    appointmentType: joi_1.default.string()
        .valid('consultation', 'follow_up', 'emergency', 'surgery', 'diagnostic', 'therapy', 'vaccination', 'checkup', 'prescription', 'referral')
        .optional(),
    duration: joi_1.default.number()
        .integer()
        .min(15)
        .max(480)
        .optional()
        .message('Thời gian phải từ 15 phút đến 8 giờ'),
    includeUnavailable: joi_1.default.boolean()
        .optional()
        .default(false)
}).or('providerId', 'departmentCode')
    .message('Phải cung cấp mã bác sĩ hoặc mã khoa')
    .options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
});
/**
 * Common validation options
 */
exports.validationOptions = {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
    context: {
        maxDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
    }
};
//# sourceMappingURL=ValidationSchemas.js.map