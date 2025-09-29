/**
 * UpdateMedicalRecordRequest DTO - Application Layer
 * Data Transfer Object for updating medical records
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DTO Pattern, Vietnamese Healthcare Standards
 */

export interface UpdateMedicalRecordRequest {
  recordId: string;
  
  // Optional fields to update
  symptoms?: string;
  examinationNotes?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string;
  notes?: string;

  // Vital signs update (optional)
  vitalSigns?: {
    temperature?: number;      // Celsius
    bloodPressure?: string;    // "120/80" format
    heartRate?: number;        // BPM
    weight?: number;           // KG
    height?: number;           // CM
  };

  // Update metadata
  updatedBy: string;
  updateReason?: string;
}

export interface UpdateMedicalRecordResponse {
  success: boolean;
  message: string;
  data?: {
    recordId: string;
    updatedFields: string[];
    updatedAt: string;
    updatedBy: string;
    updateReason?: string;
  };
  warnings?: string[];
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

/**
 * Validation rules for UpdateMedicalRecordRequest
 */
export const UpdateMedicalRecordValidationRules = {
  recordId: {
    required: true,
    pattern: /^MED-\d{6}-\d{3}$/,
    message: 'RecordId phải có định dạng MED-YYYYMM-XXX'
  },
  updatedBy: {
    required: true,
    pattern: /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i,
    message: 'UpdatedBy phải là UUID hợp lệ'
  },
  symptoms: {
    required: false,
    maxLength: 2000,
    message: 'Triệu chứng không được vượt quá 2000 ký tự'
  },
  examinationNotes: {
    required: false,
    maxLength: 5000,
    message: 'Ghi chú khám bệnh không được vượt quá 5000 ký tự'
  },
  diagnosis: {
    required: false,
    maxLength: 1000,
    message: 'Chẩn đoán không được vượt quá 1000 ký tự'
  },
  treatment: {
    required: false,
    maxLength: 2000,
    message: 'Điều trị không được vượt quá 2000 ký tự'
  },
  medications: {
    required: false,
    maxLength: 2000,
    message: 'Thuốc không được vượt quá 2000 ký tự'
  },
  notes: {
    required: false,
    maxLength: 3000,
    message: 'Ghi chú không được vượt quá 3000 ký tự'
  },
  updateReason: {
    required: false,
    maxLength: 500,
    message: 'Lý do cập nhật không được vượt quá 500 ký tự'
  },
  vitalSigns: {
    required: false,
    properties: {
      temperature: {
        type: 'number',
        min: 35.0,
        max: 42.0,
        message: 'Nhiệt độ phải từ 35.0°C đến 42.0°C'
      },
      bloodPressure: {
        pattern: /^\d{2,3}\/\d{2,3}$/,
        message: 'Huyết áp phải có định dạng "120/80"'
      },
      heartRate: {
        type: 'number',
        min: 40,
        max: 200,
        message: 'Nhịp tim phải từ 40 đến 200 BPM'
      },
      weight: {
        type: 'number',
        min: 1.0,
        max: 300.0,
        message: 'Cân nặng phải từ 1.0 đến 300.0 kg'
      },
      height: {
        type: 'number',
        min: 30.0,
        max: 250.0,
        message: 'Chiều cao phải từ 30.0 đến 250.0 cm'
      }
    }
  }
};

/**
 * Helper function to validate UpdateMedicalRecordRequest
 */
export function validateUpdateMedicalRecordRequest(
  request: UpdateMedicalRecordRequest
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate required fields
  if (!request.recordId) {
    errors.push({
      field: 'recordId',
      message: 'RecordId là bắt buộc',
      code: 'REQUIRED_FIELD_MISSING',
      value: request.recordId
    });
  } else if (!UpdateMedicalRecordValidationRules.recordId.pattern.test(request.recordId)) {
    errors.push({
      field: 'recordId',
      message: UpdateMedicalRecordValidationRules.recordId.message,
      code: 'INVALID_FORMAT',
      value: request.recordId
    });
  }

  if (!request.updatedBy) {
    errors.push({
      field: 'updatedBy',
      message: 'UpdatedBy là bắt buộc',
      code: 'REQUIRED_FIELD_MISSING',
      value: request.updatedBy
    });
  } else if (!UpdateMedicalRecordValidationRules.updatedBy.pattern.test(request.updatedBy)) {
    errors.push({
      field: 'updatedBy',
      message: UpdateMedicalRecordValidationRules.updatedBy.message,
      code: 'INVALID_FORMAT',
      value: request.updatedBy
    });
  }

  // Check if at least one field is being updated
  const updateFields = ['symptoms', 'examinationNotes', 'diagnosis', 'treatment', 'medications', 'notes', 'vitalSigns'];
  const hasUpdates = updateFields.some(field => {
    const value = request[field as keyof UpdateMedicalRecordRequest];
    return value !== undefined && value !== null;
  });

  if (!hasUpdates) {
    errors.push({
      field: 'updates',
      message: 'Ít nhất một trường phải được cập nhật',
      code: 'NO_UPDATES_PROVIDED'
    });
  }

  // Validate text field lengths
  const textFields = ['symptoms', 'examinationNotes', 'diagnosis', 'treatment', 'medications', 'notes', 'updateReason'];
  textFields.forEach(field => {
    const value = request[field as keyof UpdateMedicalRecordRequest] as string;
    if (value !== undefined && value !== null) {
      const rule = UpdateMedicalRecordValidationRules[field as keyof typeof UpdateMedicalRecordValidationRules] as any;
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field,
          message: rule.message,
          code: 'TEXT_TOO_LONG',
          value: value.length
        });
      }
    }
  });

  // Validate vital signs
  if (request.vitalSigns) {
    const vitalSigns = request.vitalSigns;
    
    if (vitalSigns.temperature !== undefined) {
      if (typeof vitalSigns.temperature !== 'number' || 
          vitalSigns.temperature < 35.0 || 
          vitalSigns.temperature > 42.0) {
        errors.push({
          field: 'vitalSigns.temperature',
          message: 'Nhiệt độ phải từ 35.0°C đến 42.0°C',
          code: 'INVALID_VITAL_SIGNS',
          value: vitalSigns.temperature
        });
      }
    }

    if (vitalSigns.bloodPressure !== undefined) {
      if (!UpdateMedicalRecordValidationRules.vitalSigns.properties.bloodPressure.pattern.test(vitalSigns.bloodPressure)) {
        errors.push({
          field: 'vitalSigns.bloodPressure',
          message: 'Huyết áp phải có định dạng "120/80"',
          code: 'INVALID_VITAL_SIGNS',
          value: vitalSigns.bloodPressure
        });
      }
    }

    if (vitalSigns.heartRate !== undefined) {
      if (typeof vitalSigns.heartRate !== 'number' || 
          vitalSigns.heartRate < 40 || 
          vitalSigns.heartRate > 200) {
        errors.push({
          field: 'vitalSigns.heartRate',
          message: 'Nhịp tim phải từ 40 đến 200 BPM',
          code: 'INVALID_VITAL_SIGNS',
          value: vitalSigns.heartRate
        });
      }
    }

    if (vitalSigns.weight !== undefined) {
      if (typeof vitalSigns.weight !== 'number' || 
          vitalSigns.weight < 1.0 || 
          vitalSigns.weight > 300.0) {
        errors.push({
          field: 'vitalSigns.weight',
          message: 'Cân nặng phải từ 1.0 đến 300.0 kg',
          code: 'INVALID_VITAL_SIGNS',
          value: vitalSigns.weight
        });
      }
    }

    if (vitalSigns.height !== undefined) {
      if (typeof vitalSigns.height !== 'number' || 
          vitalSigns.height < 30.0 || 
          vitalSigns.height > 250.0) {
        errors.push({
          field: 'vitalSigns.height',
          message: 'Chiều cao phải từ 30.0 đến 250.0 cm',
          code: 'INVALID_VITAL_SIGNS',
          value: vitalSigns.height
        });
      }
    }
  }

  return errors;
}

/**
 * Helper function to extract update fields from request
 */
export function extractUpdateFields(request: UpdateMedicalRecordRequest): Record<string, any> {
  const updates: Record<string, any> = {};

  if (request.symptoms !== undefined) updates.symptoms = request.symptoms;
  if (request.examinationNotes !== undefined) updates.examinationNotes = request.examinationNotes;
  if (request.diagnosis !== undefined) updates.diagnosis = request.diagnosis;
  if (request.treatment !== undefined) updates.treatment = request.treatment;
  if (request.medications !== undefined) updates.medications = request.medications;
  if (request.notes !== undefined) updates.notes = request.notes;

  return updates;
}

/**
 * Helper function to check if vital signs are being updated
 */
export function hasVitalSignsUpdate(request: UpdateMedicalRecordRequest): boolean {
  return !!(request.vitalSigns && Object.keys(request.vitalSigns).length > 0);
}
