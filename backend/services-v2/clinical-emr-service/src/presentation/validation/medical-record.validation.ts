/**
 * Medical Record Validation Schemas - Presentation Layer
 * Joi validation schemas for medical record API endpoints
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Input Validation, Vietnamese Healthcare Standards
 */

import Joi from 'joi';

// =====================================================
// COMMON VALIDATION PATTERNS
// =====================================================

const vietnameseIdPatterns = {
  patientId: /^PAT-\d{6}-\d{3}$/,
  doctorId: /^[A-Z]{2,4}-DOC-\d{6}-\d{3}$/,
  recordId: /^MED-\d{6}-\d{3}$/,
  appointmentId: /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i
};

const vitalSignsSchema = Joi.object({
  temperature: Joi.number()
    .min(35.0)
    .max(42.0)
    .precision(1)
    .messages({
      'number.base': 'Nhiệt độ phải là số',
      'number.min': 'Nhiệt độ phải từ 35.0°C trở lên',
      'number.max': 'Nhiệt độ phải dưới 42.0°C',
      'number.precision': 'Nhiệt độ chỉ được có 1 chữ số thập phân'
    }),
  
  bloodPressure: Joi.string()
    .pattern(/^\d{2,3}\/\d{2,3}$/)
    .messages({
      'string.pattern.base': 'Huyết áp phải có định dạng "120/80"'
    }),
  
  heartRate: Joi.number()
    .integer()
    .min(40)
    .max(200)
    .messages({
      'number.base': 'Nhịp tim phải là số',
      'number.integer': 'Nhịp tim phải là số nguyên',
      'number.min': 'Nhịp tim phải từ 40 BPM trở lên',
      'number.max': 'Nhịp tim phải dưới 200 BPM'
    }),
  
  weight: Joi.number()
    .min(1.0)
    .max(300.0)
    .precision(1)
    .messages({
      'number.base': 'Cân nặng phải là số',
      'number.min': 'Cân nặng phải từ 1.0 kg trở lên',
      'number.max': 'Cân nặng phải dưới 300.0 kg',
      'number.precision': 'Cân nặng chỉ được có 1 chữ số thập phân'
    }),
  
  height: Joi.number()
    .min(30.0)
    .max(250.0)
    .precision(1)
    .messages({
      'number.base': 'Chiều cao phải là số',
      'number.min': 'Chiều cao phải từ 30.0 cm trở lên',
      'number.max': 'Chiều cao phải dưới 250.0 cm',
      'number.precision': 'Chiều cao chỉ được có 1 chữ số thập phân'
    })
}).messages({
  'object.base': 'Sinh hiệu phải là một đối tượng hợp lệ'
});

// =====================================================
// CREATE MEDICAL RECORD VALIDATION
// =====================================================

export const createMedicalRecordSchema = Joi.object({
  body: Joi.object({
    patientId: Joi.string()
      .pattern(vietnameseIdPatterns.patientId)
      .required()
      .messages({
        'string.pattern.base': 'PatientId phải có định dạng PAT-YYYYMM-XXX',
        'any.required': 'PatientId là bắt buộc'
      }),
    
    doctorId: Joi.string()
      .pattern(vietnameseIdPatterns.doctorId)
      .required()
      .messages({
        'string.pattern.base': 'DoctorId phải có định dạng DEPT-DOC-YYYYMM-XXX',
        'any.required': 'DoctorId là bắt buộc'
      }),
    
    appointmentId: Joi.string()
      .pattern(vietnameseIdPatterns.appointmentId)
      .optional()
      .messages({
        'string.pattern.base': 'AppointmentId phải là UUID hợp lệ'
      }),
    
    visitDate: Joi.date()
      .iso()
      .max('now')
      .min(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) // 1 year ago
      .required()
      .messages({
        'date.base': 'Ngày khám phải là ngày hợp lệ',
        'date.iso': 'Ngày khám phải có định dạng ISO',
        'date.max': 'Ngày khám không được là tương lai',
        'date.min': 'Ngày khám không được quá 1 năm trước',
        'any.required': 'Ngày khám là bắt buộc'
      }),
    
    symptoms: Joi.string()
      .max(2000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Triệu chứng không được vượt quá 2000 ký tự'
      }),
    
    examinationNotes: Joi.string()
      .max(5000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Ghi chú khám bệnh không được vượt quá 5000 ký tự'
      }),
    
    diagnosis: Joi.string()
      .max(1000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Chẩn đoán không được vượt quá 1000 ký tự'
      }),
    
    treatment: Joi.string()
      .max(2000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Điều trị không được vượt quá 2000 ký tự'
      }),
    
    medications: Joi.string()
      .max(2000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Thuốc không được vượt quá 2000 ký tự'
      }),
    
    notes: Joi.string()
      .max(3000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Ghi chú không được vượt quá 3000 ký tự'
      }),
    
    vitalSigns: vitalSignsSchema.optional()
  }).required()
}).messages({
  'object.base': 'Dữ liệu yêu cầu không hợp lệ'
});

// =====================================================
// UPDATE MEDICAL RECORD VALIDATION
// =====================================================

export const updateMedicalRecordSchema = Joi.object({
  params: Joi.object({
    recordId: Joi.string()
      .pattern(vietnameseIdPatterns.recordId)
      .required()
      .messages({
        'string.pattern.base': 'RecordId phải có định dạng MED-YYYYMM-XXX',
        'any.required': 'RecordId là bắt buộc'
      })
  }).required(),
  
  body: Joi.object({
    symptoms: Joi.string()
      .max(2000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Triệu chứng không được vượt quá 2000 ký tự'
      }),
    
    examinationNotes: Joi.string()
      .max(5000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Ghi chú khám bệnh không được vượt quá 5000 ký tự'
      }),
    
    diagnosis: Joi.string()
      .max(1000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Chẩn đoán không được vượt quá 1000 ký tự'
      }),
    
    treatment: Joi.string()
      .max(2000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Điều trị không được vượt quá 2000 ký tự'
      }),
    
    medications: Joi.string()
      .max(2000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Thuốc không được vượt quá 2000 ký tự'
      }),
    
    notes: Joi.string()
      .max(3000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Ghi chú không được vượt quá 3000 ký tự'
      }),
    
    vitalSigns: vitalSignsSchema.optional(),
    
    updateReason: Joi.string()
      .max(500)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Lý do cập nhật không được vượt quá 500 ký tự'
      })
  })
  .min(1)
  .required()
  .messages({
    'object.min': 'Ít nhất một trường phải được cập nhật'
  })
}).messages({
  'object.base': 'Dữ liệu yêu cầu không hợp lệ'
});

// =====================================================
// GET MEDICAL RECORD VALIDATION
// =====================================================

export const getMedicalRecordSchema = Joi.object({
  params: Joi.object({
    recordId: Joi.string()
      .pattern(vietnameseIdPatterns.recordId)
      .required()
      .messages({
        'string.pattern.base': 'RecordId phải có định dạng MED-YYYYMM-XXX',
        'any.required': 'RecordId là bắt buộc'
      })
  }).required(),
  
  query: Joi.object({
    includeArchived: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'includeArchived phải là true hoặc false'
      }),
    
    includeVitalSigns: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'includeVitalSigns phải là true hoặc false'
      })
  }).optional()
}).messages({
  'object.base': 'Dữ liệu yêu cầu không hợp lệ'
});

// =====================================================
// GET PATIENT MEDICAL RECORDS VALIDATION
// =====================================================

export const getPatientMedicalRecordsSchema = Joi.object({
  params: Joi.object({
    patientId: Joi.string()
      .pattern(vietnameseIdPatterns.patientId)
      .required()
      .messages({
        'string.pattern.base': 'PatientId phải có định dạng PAT-YYYYMM-XXX',
        'any.required': 'PatientId là bắt buộc'
      })
  }).required(),
  
  query: Joi.object({
    status: Joi.string()
      .valid('active', 'archived', 'deleted')
      .optional()
      .messages({
        'any.only': 'Status phải là active, archived, hoặc deleted'
      }),
    
    includeArchived: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'includeArchived phải là true hoặc false'
      }),
    
    includeVitalSigns: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'includeVitalSigns phải là true hoặc false'
      }),
    
    visitDateFrom: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.base': 'visitDateFrom phải là ngày hợp lệ',
        'date.iso': 'visitDateFrom phải có định dạng ISO'
      }),
    
    visitDateTo: Joi.date()
      .iso()
      .min(Joi.ref('visitDateFrom'))
      .optional()
      .messages({
        'date.base': 'visitDateTo phải là ngày hợp lệ',
        'date.iso': 'visitDateTo phải có định dạng ISO',
        'date.min': 'visitDateTo phải sau visitDateFrom'
      }),
    
    page: Joi.number()
      .integer()
      .min(1)
      .max(1000)
      .optional()
      .messages({
        'number.base': 'page phải là số',
        'number.integer': 'page phải là số nguyên',
        'number.min': 'page phải từ 1 trở lên',
        'number.max': 'page không được vượt quá 1000'
      }),
    
    pageSize: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .optional()
      .messages({
        'number.base': 'pageSize phải là số',
        'number.integer': 'pageSize phải là số nguyên',
        'number.min': 'pageSize phải từ 1 trở lên',
        'number.max': 'pageSize không được vượt quá 100'
      }),
    
    sortBy: Joi.string()
      .valid('visitDate', 'createdAt', 'updatedAt', 'recordId')
      .optional()
      .messages({
        'any.only': 'sortBy phải là visitDate, createdAt, updatedAt, hoặc recordId'
      }),
    
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .optional()
      .messages({
        'any.only': 'sortOrder phải là asc hoặc desc'
      }),
    
    hasDiagnosis: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'hasDiagnosis phải là true hoặc false'
      }),
    
    hasTreatment: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'hasTreatment phải là true hoặc false'
      }),
    
    hasVitalSigns: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'hasVitalSigns phải là true hoặc false'
      }),
    
    doctorId: Joi.string()
      .pattern(vietnameseIdPatterns.doctorId)
      .optional()
      .messages({
        'string.pattern.base': 'DoctorId phải có định dạng DEPT-DOC-YYYYMM-XXX'
      })
  }).optional()
}).messages({
  'object.base': 'Dữ liệu yêu cầu không hợp lệ'
});

// =====================================================
// VALIDATION ERROR MESSAGES
// =====================================================

export const validationErrorMessages = {
  'any.required': 'Trường này là bắt buộc',
  'string.empty': 'Trường này không được để trống',
  'string.min': 'Trường này phải có ít nhất {#limit} ký tự',
  'string.max': 'Trường này không được vượt quá {#limit} ký tự',
  'string.pattern.base': 'Định dạng không hợp lệ',
  'number.base': 'Trường này phải là số',
  'number.integer': 'Trường này phải là số nguyên',
  'number.min': 'Giá trị phải từ {#limit} trở lên',
  'number.max': 'Giá trị không được vượt quá {#limit}',
  'date.base': 'Trường này phải là ngày hợp lệ',
  'date.iso': 'Ngày phải có định dạng ISO (YYYY-MM-DD)',
  'boolean.base': 'Trường này phải là true hoặc false',
  'any.only': 'Giá trị không hợp lệ',
  'object.min': 'Ít nhất một trường phải được cung cấp'
};

// =====================================================
// VALIDATION HELPER FUNCTIONS
// =====================================================

export function validateVietnameseId(id: string, type: 'patient' | 'doctor' | 'record' | 'appointment'): boolean {
  const pattern = vietnameseIdPatterns[`${type}Id` as keyof typeof vietnameseIdPatterns];
  return pattern.test(id);
}

export function sanitizeTextInput(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, ''); // Remove potential HTML tags
}

export function validateVitalSigns(vitalSigns: any): { valid: boolean; errors: string[] } {
  const { error } = vitalSignsSchema.validate(vitalSigns);
  
  if (error) {
    return {
      valid: false,
      errors: error.details.map(detail => detail.message)
    };
  }
  
  return { valid: true, errors: [] };
}
