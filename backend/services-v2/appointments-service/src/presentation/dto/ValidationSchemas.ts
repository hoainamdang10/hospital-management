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
 * Vietnamese Healthcare Validation Rules
 */
const vietnameseHealthcareRules = {
  // Vietnamese phone number: 10 digits starting with 0
  phoneNumber: Joi.string()
    .pattern(/^0\d{9}$/)
    .message('Số điện thoại phải có 10 chữ số và bắt đầu bằng 0'),

  // Vietnamese national ID: 9 or 12 digits
  nationalId: Joi.string()
    .pattern(/^\d{9}(\d{3})?$/)
    .message('Số CMND/CCCD phải có 9 hoặc 12 chữ số'),

  // Vietnamese insurance number formats
  insuranceNumber: Joi.string()
    .pattern(/^[A-Z]{2}\d{13}$/)
    .message('Số bảo hiểm không đúng định dạng'),

  // Vietnamese name validation
  vietnameseName: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/)
    .message('Tên chỉ được chứa chữ cái tiếng Việt và khoảng trắng'),

  // Business hours validation (8:00 - 17:00)
  businessHours: Joi.custom((value, helpers) => {
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
  futureDate: Joi.date()
    .min('now')
    .message('Thời gian phải trong tương lai'),

  // Date range validation (max 60 days in advance)
  dateRange: Joi.date()
    .min('now')
    .max(Joi.ref('$maxDate'))
    .message('Không thể đặt lịch hẹn quá 60 ngày trong tương lai')
};

/**
 * Schedule Appointment Request Validation Schema
 */
export const scheduleAppointmentSchema = Joi.object({
  patient: Joi.object({
    patientId: Joi.string()
      .pattern(/^PAT-\d{6}-\d{3}$/)
      .required()
      .message('Mã bệnh nhân không đúng định dạng (PAT-YYYYMM-XXX)'),
    
    fullName: vietnameseHealthcareRules.vietnameseName
      .required()
      .message('Tên bệnh nhân là bắt buộc'),
    
    phone: vietnameseHealthcareRules.phoneNumber
      .required()
      .message('Số điện thoại là bắt buộc'),
    
    dateOfBirth: Joi.date()
      .max('now')
      .required()
      .message('Ngày sinh không hợp lệ'),
    
    nationalId: vietnameseHealthcareRules.nationalId
      .required()
      .message('Số CMND/CCCD là bắt buộc'),
    
    email: Joi.string()
      .email()
      .optional()
      .message('Email không đúng định dạng'),
    
    address: Joi.string()
      .max(200)
      .optional()
      .message('Địa chỉ không được vượt quá 200 ký tự'),
    
    emergencyContact: vietnameseHealthcareRules.phoneNumber
      .optional(),
    
    insuranceNumber: vietnameseHealthcareRules.insuranceNumber
      .optional(),
    
    insuranceType: Joi.string()
      .valid('BHYT', 'BHTN', 'PRIVATE', 'NONE')
      .optional()
      .message('Loại bảo hiểm không hợp lệ')
  }).required(),

  provider: Joi.object({
    providerId: Joi.string()
      .pattern(/^[A-Z]{3,4}-DOC-\d{6}-\d{3}$/)
      .required()
      .message('Mã bác sĩ không đúng định dạng'),
    
    fullName: vietnameseHealthcareRules.vietnameseName
      .optional(),
    
    specialization: Joi.string()
      .max(100)
      .optional(),
    
    department: Joi.string()
      .max(100)
      .optional()
  }).required(),

  appointment: Joi.object({
    appointmentType: Joi.string()
      .valid('consultation', 'follow_up', 'emergency', 'surgery', 'diagnostic', 'therapy', 'vaccination', 'checkup', 'prescription', 'referral')
      .required()
      .message('Loại cuộc hẹn không hợp lệ'),
    
    priority: Joi.string()
      .valid('low', 'normal', 'high', 'urgent', 'emergency')
      .required()
      .message('Mức độ ưu tiên không hợp lệ'),
    
    startTime: vietnameseHealthcareRules.businessHours
      .required()
      .message('Thời gian bắt đầu là bắt buộc'),
    
    endTime: Joi.date()
      .greater(Joi.ref('startTime'))
      .required()
      .message('Thời gian kết thúc phải sau thời gian bắt đầu'),
    
    roomId: Joi.string()
      .pattern(/^ROOM-\d{3}$/)
      .optional()
      .message('Mã phòng không đúng định dạng'),
    
    reason: Joi.string()
      .min(3)
      .max(500)
      .required()
      .message('Lý do khám phải có từ 3-500 ký tự'),
    
    reasonCode: Joi.string()
      .valid('consultation', 'follow_up', 'emergency', 'surgery', 'diagnostic', 'therapy', 'vaccination', 'checkup', 'prescription', 'referral')
      .optional(),
    
    symptoms: Joi.string()
      .max(1000)
      .optional()
      .message('Mô tả triệu chứng không được vượt quá 1000 ký tự'),
    
    notes: Joi.string()
      .max(1000)
      .optional()
      .message('Ghi chú không được vượt quá 1000 ký tự'),
    
    preparationInstructions: Joi.string()
      .max(500)
      .optional()
      .message('Hướng dẫn chuẩn bị không được vượt quá 500 ký tự'),
    
    estimatedDuration: Joi.number()
      .integer()
      .min(15)
      .max(480)
      .required()
      .message('Thời gian dự kiến phải từ 15 phút đến 8 giờ'),
    
    requiresPreparation: Joi.boolean()
      .optional()
      .default(false),
    
    isFollowUp: Joi.boolean()
      .optional()
      .default(false),
    
    previousAppointmentId: Joi.when('isFollowUp', {
      is: true,
      then: Joi.string().required().message('Cuộc hẹn tái khám phải có mã cuộc hẹn trước đó'),
      otherwise: Joi.string().optional()
    }),
    
    urgencyLevel: Joi.string()
      .valid('routine', 'urgent', 'emergency')
      .optional()
      .default('routine'),
    
    specialRequirements: Joi.array()
      .items(Joi.string().max(100))
      .max(10)
      .optional()
      .message('Yêu cầu đặc biệt không được vượt quá 10 mục'),
    
    interpreterRequired: Joi.boolean()
      .optional()
      .default(false),
    
    wheelchairAccessible: Joi.boolean()
      .optional()
      .default(false),
    
    fasting: Joi.boolean()
      .optional()
      .default(false),
    
    medicationRestrictions: Joi.array()
      .items(Joi.string().max(100))
      .max(20)
      .optional()
      .message('Hạn chế thuốc không được vượt quá 20 mục')
  }).required(),

  departmentCode: Joi.string()
    .pattern(/^[A-Z]{3,4}$/)
    .required()
    .message('Mã khoa không đúng định dạng'),

  createdBy: Joi.string()
    .optional() // Will be set from authentication context
}).options({
  abortEarly: false, // Return all validation errors
  allowUnknown: false, // Don't allow unknown fields
  stripUnknown: true // Remove unknown fields
});

/**
 * Reschedule Appointment Request Validation Schema
 */
export const rescheduleAppointmentSchema = Joi.object({
  appointmentId: Joi.string()
    .required()
    .message('Mã cuộc hẹn là bắt buộc'),

  newStartTime: vietnameseHealthcareRules.businessHours
    .required()
    .message('Thời gian bắt đầu mới là bắt buộc'),

  newEndTime: Joi.date()
    .greater(Joi.ref('newStartTime'))
    .required()
    .message('Thời gian kết thúc mới phải sau thời gian bắt đầu'),

  newRoomId: Joi.string()
    .pattern(/^ROOM-\d{3}$/)
    .optional()
    .message('Mã phòng không đúng định dạng'),

  reason: Joi.string()
    .min(3)
    .max(500)
    .required()
    .message('Lý do thay đổi lịch phải có từ 3-500 ký tự'),

  notifyPatient: Joi.boolean()
    .optional()
    .default(true),

  notifyProvider: Joi.boolean()
    .optional()
    .default(true),

  rescheduledBy: Joi.string()
    .optional() // Will be set from authentication context
}).options({
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: true
});

/**
 * Check Availability Request Validation Schema
 */
export const checkAvailabilitySchema = Joi.object({
  providerId: Joi.string()
    .pattern(/^[A-Z]{3,4}-DOC-\d{6}-\d{3}$/)
    .optional()
    .message('Mã bác sĩ không đúng định dạng'),

  departmentCode: Joi.string()
    .pattern(/^[A-Z]{3,4}$/)
    .optional()
    .message('Mã khoa không đúng định dạng'),

  date: vietnameseHealthcareRules.dateRange
    .required()
    .message('Ngày kiểm tra là bắt buộc'),

  startTime: Joi.date()
    .optional(),

  endTime: Joi.when('startTime', {
    is: Joi.exist(),
    then: Joi.date().greater(Joi.ref('startTime')).required(),
    otherwise: Joi.date().optional()
  }).message('Thời gian kết thúc phải sau thời gian bắt đầu'),

  appointmentType: Joi.string()
    .valid('consultation', 'follow_up', 'emergency', 'surgery', 'diagnostic', 'therapy', 'vaccination', 'checkup', 'prescription', 'referral')
    .optional(),

  duration: Joi.number()
    .integer()
    .min(15)
    .max(480)
    .optional()
    .message('Thời gian phải từ 15 phút đến 8 giờ'),

  includeUnavailable: Joi.boolean()
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
export const validationOptions = {
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: true,
  context: {
    maxDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
  }
};
