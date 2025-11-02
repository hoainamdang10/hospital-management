/**
 * GetMedicalRecordRequest DTO - Application Layer
 * Data Transfer Object for retrieving medical records
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DTO Pattern, Vietnamese Healthcare Standards
 */

export interface GetMedicalRecordRequest {
  recordId: string;
  includeArchived?: boolean;
  includeVitalSigns?: boolean;
  requestedBy: string; // User ID making the request
}

export interface GetMedicalRecordResponse {
  success: boolean;
  message: string;
  data?: MedicalRecordDto;
  errors?: ValidationError[];
}

export interface MedicalRecordDto {
  recordId: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  
  // Medical Information
  visitDate: string;
  symptoms?: string;
  examinationNotes?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string;
  notes?: string;
  
  // Vital Signs
  vitalSigns?: {
    temperature?: number;
    bloodPressure?: string;
    heartRate?: number;
    weight?: number;
    height?: number;
    bmi?: number;
    bmiCategory?: string;
    summary?: string;
  };
  
  // Status and Audit
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  
  // Additional Information
  isActive: boolean;
  isArchived: boolean;
  hasVitalSigns: boolean;
  hasCompleteVitalSigns: boolean;
  hasDiagnosis: boolean;
  hasTreatment: boolean;
  hasMedications: boolean;
  isFromCurrentMonth: boolean;
  isFromCurrentYear: boolean;
  summary: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

/**
 * Validation rules for GetMedicalRecordRequest
 */
export const GetMedicalRecordValidationRules = {
  recordId: {
    required: true,
    pattern: /^MED-\d{6}-\d{3}$/,
    message: 'RecordId phải có định dạng MED-YYYYMM-XXX'
  },
  requestedBy: {
    required: true,
    pattern: /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i,
    message: 'RequestedBy phải là UUID hợp lệ'
  }
};

/**
 * Helper function to validate GetMedicalRecordRequest
 */
export function validateGetMedicalRecordRequest(
  request: GetMedicalRecordRequest
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate recordId
  if (!request.recordId) {
    errors.push({
      field: 'recordId',
      message: 'RecordId là bắt buộc',
      code: 'REQUIRED_FIELD_MISSING',
      value: request.recordId
    });
  } else if (!GetMedicalRecordValidationRules.recordId.pattern.test(request.recordId)) {
    errors.push({
      field: 'recordId',
      message: GetMedicalRecordValidationRules.recordId.message,
      code: 'INVALID_FORMAT',
      value: request.recordId
    });
  }

  // Validate requestedBy
  if (!request.requestedBy) {
    errors.push({
      field: 'requestedBy',
      message: 'RequestedBy là bắt buộc',
      code: 'REQUIRED_FIELD_MISSING',
      value: request.requestedBy
    });
  } else if (!GetMedicalRecordValidationRules.requestedBy.pattern.test(request.requestedBy)) {
    errors.push({
      field: 'requestedBy',
      message: GetMedicalRecordValidationRules.requestedBy.message,
      code: 'INVALID_FORMAT',
      value: request.requestedBy
    });
  }

  return errors;
}

/**
 * Helper function to map MedicalRecordAggregate to DTO
 */
export function mapMedicalRecordToDto(medicalRecord: any, includeVitalSigns: boolean = true): MedicalRecordDto {
  const vitalSigns = medicalRecord.vitalSigns;
  
  return {
    recordId: medicalRecord.recordId.value,
    patientId: medicalRecord.patientId,
    doctorId: medicalRecord.doctorId,
    appointmentId: medicalRecord.appointmentId,
    
    visitDate: medicalRecord.visitDate.toISOString(),
    symptoms: medicalRecord.symptoms,
    examinationNotes: medicalRecord.examinationNotes,
    diagnosis: medicalRecord.diagnosis,
    treatment: medicalRecord.treatment,
    medications: medicalRecord.medications,
    notes: medicalRecord.notes,
    
    // Conditionally include vital signs using spread operator
    ...(includeVitalSigns && vitalSigns ? {
      vitalSigns: {
        temperature: vitalSigns.temperature,
        bloodPressure: vitalSigns.bloodPressure,
        heartRate: vitalSigns.heartRate,
        weight: vitalSigns.weight,
        height: vitalSigns.height,
        bmi: vitalSigns.calculateBMI(),
        bmiCategory: vitalSigns.getBMICategory(),
        summary: vitalSigns.getSummary()
      }
    } : {}),
    
    status: medicalRecord.status,
    createdAt: medicalRecord.createdAt.toISOString(),
    updatedAt: medicalRecord.updatedAt.toISOString(),
    createdBy: medicalRecord.createdBy,
    updatedBy: medicalRecord.updatedBy,
    
    isActive: medicalRecord.isActive(),
    isArchived: medicalRecord.isArchived(),
    hasVitalSigns: medicalRecord.hasVitalSigns(),
    hasCompleteVitalSigns: medicalRecord.hasCompleteVitalSigns(),
    hasDiagnosis: medicalRecord.hasDiagnosis(),
    hasTreatment: medicalRecord.hasTreatment(),
    hasMedications: medicalRecord.hasMedications(),
    isFromCurrentMonth: medicalRecord.isFromCurrentMonth(),
    isFromCurrentYear: medicalRecord.isFromCurrentYear(),
    summary: medicalRecord.getSummary()
  };
}
