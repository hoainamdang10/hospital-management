/**
 * ClinicalNote Request/Response DTOs - Application Layer
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DTO Pattern, Vietnamese Healthcare Standards
 */

import { ClinicalNoteType, ClinicalNoteStatus } from '../../domain/aggregates/ClinicalNote.aggregate';

// ==================== CREATE CLINICAL NOTE ====================

export interface CreateClinicalNoteRequest {
  // Required fields
  medicalRecordId: string;
  patientId: string;
  authorId: string;
  noteType: ClinicalNoteType;
  noteTitle: string;
  noteContent: string;

  // Optional SOAP format
  clinicalFindings?: string;
  assessment?: string;
  plan?: string;

  // Cosigning
  requiresCosign?: boolean;

  // Metadata
  specialtyCode?: string;

  // Audit
  createdBy: string;
}

export interface CreateClinicalNoteResponse {
  success: boolean;
  noteId: string;
  message: string;
  data?: {
    noteId: string;
    medicalRecordId: string;
    patientId: string;
    authorId: string;
    noteType: string;
    status: string;
    requiresCosign: boolean;
    createdAt: string;
    createdBy: string;
  };
  errors?: ValidationError[];
}

// ==================== GET CLINICAL NOTE ====================

export interface GetClinicalNoteRequest {
  noteId: string;
  accessedBy: string;
  purpose?: string;
}

export interface GetClinicalNoteResponse {
  success: boolean;
  message: string;
  data?: {
    noteId: string;
    medicalRecordId: string;
    patientId: string;
    authorId: string;
    noteType: string;
    noteTitle: string;
    noteContent: string;
    clinicalFindings?: string;
    assessment?: string;
    plan?: string;
    requiresCosign: boolean;
    cosignedBy?: string;
    cosignedAt?: string;
    cosignComment?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy?: string;
  };
  errors?: ValidationError[];
}

// ==================== UPDATE CLINICAL NOTE ====================

export interface UpdateClinicalNoteRequest {
  noteId: string;
  
  // Fields to update
  noteTitle?: string;
  noteContent?: string;
  clinicalFindings?: string;
  assessment?: string;
  plan?: string;

  // Audit
  updatedBy: string;
  updateReason?: string;
}

export interface UpdateClinicalNoteResponse {
  success: boolean;
  noteId: string;
  message: string;
  data?: {
    noteId: string;
    updatedFields: string[];
    updatedAt: string;
    updatedBy: string;
  };
  errors?: ValidationError[];
}

// ==================== COSIGN CLINICAL NOTE ====================

export interface CosignClinicalNoteRequest {
  noteId: string;
  cosignedBy: string;
  cosignComment?: string;
}

export interface CosignClinicalNoteResponse {
  success: boolean;
  noteId: string;
  message: string;
  data?: {
    noteId: string;
    authorId: string;
    cosignedBy: string;
    cosignedAt: string;
    status: string;
  };
  errors?: ValidationError[];
}

// ==================== LIST CLINICAL NOTES ====================

export interface ListClinicalNotesRequest {
  medicalRecordId?: string;
  patientId?: string;
  authorId?: string;
  noteType?: ClinicalNoteType;
  status?: ClinicalNoteStatus;
  requiresCosign?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  accessedBy?: string;
}

export interface ListClinicalNotesResponse {
  success: boolean;
  message: string;
  data?: {
    notes: ClinicalNoteSummary[];
    total: number;
    limit: number;
    offset: number;
  };
  errors?: ValidationError[];
}

export interface ClinicalNoteSummary {
  noteId: string;
  medicalRecordId: string;
  patientId: string;
  authorId: string;
  noteType: string;
  noteTitle: string;
  requiresCosign: boolean;
  cosignedBy?: string;
  cosignedAt?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== VALIDATION ====================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

/**
 * Validation rules for CreateClinicalNoteRequest
 */
export const CreateClinicalNoteValidationRules = {
  medicalRecordId: {
    required: true,
    pattern: /^REC-\d{6}-\d{3}$/,
    message: 'MedicalRecordId phải có định dạng REC-YYYYMM-XXX'
  },
  patientId: {
    required: true,
    pattern: /^PAT-\d{6}-\d{3}$/,
    message: 'PatientId phải có định dạng PAT-YYYYMM-XXX'
  },
  authorId: {
    required: true,
    pattern: /^[A-Z]{2,4}-DOC-\d{6}-\d{3}$/,
    message: 'AuthorId phải có định dạng DEPT-DOC-YYYYMM-XXX'
  },
  noteType: {
    required: true,
    enum: Object.values(ClinicalNoteType),
    message: 'NoteType không hợp lệ'
  },
  noteTitle: {
    required: true,
    minLength: 1,
    maxLength: 200,
    message: 'Tiêu đề ghi chú từ 1-200 ký tự'
  },
  noteContent: {
    required: true,
    minLength: 1,
    maxLength: 50000,
    message: 'Nội dung ghi chú từ 1-50,000 ký tự'
  },
  clinicalFindings: {
    required: false,
    maxLength: 10000,
    message: 'Clinical findings không được vượt quá 10,000 ký tự'
  },
  assessment: {
    required: false,
    maxLength: 10000,
    message: 'Assessment không được vượt quá 10,000 ký tự'
  },
  plan: {
    required: false,
    maxLength: 10000,
    message: 'Plan không được vượt quá 10,000 ký tự'
  },
  createdBy: {
    required: true,
    message: 'CreatedBy là bắt buộc'
  }
};

/**
 * Validate CreateClinicalNoteRequest
 */
export function validateCreateClinicalNoteRequest(request: CreateClinicalNoteRequest): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  if (!request.medicalRecordId || request.medicalRecordId.trim() === '') {
    errors.push({
      field: 'medicalRecordId',
      message: 'MedicalRecordId là bắt buộc',
      code: 'REQUIRED_FIELD'
    });
  } else if (!CreateClinicalNoteValidationRules.medicalRecordId.pattern.test(request.medicalRecordId)) {
    errors.push({
      field: 'medicalRecordId',
      message: CreateClinicalNoteValidationRules.medicalRecordId.message,
      code: 'INVALID_FORMAT',
      value: request.medicalRecordId
    });
  }

  if (!request.patientId || request.patientId.trim() === '') {
    errors.push({
      field: 'patientId',
      message: 'PatientId là bắt buộc',
      code: 'REQUIRED_FIELD'
    });
  } else if (!CreateClinicalNoteValidationRules.patientId.pattern.test(request.patientId)) {
    errors.push({
      field: 'patientId',
      message: CreateClinicalNoteValidationRules.patientId.message,
      code: 'INVALID_FORMAT',
      value: request.patientId
    });
  }

  if (!request.authorId || request.authorId.trim() === '') {
    errors.push({
      field: 'authorId',
      message: 'AuthorId là bắt buộc',
      code: 'REQUIRED_FIELD'
    });
  } else if (!CreateClinicalNoteValidationRules.authorId.pattern.test(request.authorId)) {
    errors.push({
      field: 'authorId',
      message: CreateClinicalNoteValidationRules.authorId.message,
      code: 'INVALID_FORMAT',
      value: request.authorId
    });
  }

  if (!request.noteType) {
    errors.push({
      field: 'noteType',
      message: 'NoteType là bắt buộc',
      code: 'REQUIRED_FIELD'
    });
  } else if (!CreateClinicalNoteValidationRules.noteType.enum.includes(request.noteType)) {
    errors.push({
      field: 'noteType',
      message: CreateClinicalNoteValidationRules.noteType.message,
      code: 'INVALID_ENUM',
      value: request.noteType
    });
  }

  if (!request.noteTitle || request.noteTitle.trim() === '') {
    errors.push({
      field: 'noteTitle',
      message: 'Tiêu đề ghi chú là bắt buộc',
      code: 'REQUIRED_FIELD'
    });
  } else if (request.noteTitle.length > 200) {
    errors.push({
      field: 'noteTitle',
      message: CreateClinicalNoteValidationRules.noteTitle.message,
      code: 'MAX_LENGTH_EXCEEDED',
      value: request.noteTitle.length
    });
  }

  if (!request.noteContent || request.noteContent.trim() === '') {
    errors.push({
      field: 'noteContent',
      message: 'Nội dung ghi chú là bắt buộc',
      code: 'REQUIRED_FIELD'
    });
  } else if (request.noteContent.length > 50000) {
    errors.push({
      field: 'noteContent',
      message: CreateClinicalNoteValidationRules.noteContent.message,
      code: 'MAX_LENGTH_EXCEEDED',
      value: request.noteContent.length
    });
  }

  if (!request.createdBy || request.createdBy.trim() === '') {
    errors.push({
      field: 'createdBy',
      message: 'CreatedBy là bắt buộc',
      code: 'REQUIRED_FIELD'
    });
  }

  // Optional fields length validation
  if (request.clinicalFindings && request.clinicalFindings.length > 10000) {
    errors.push({
      field: 'clinicalFindings',
      message: CreateClinicalNoteValidationRules.clinicalFindings.message,
      code: 'MAX_LENGTH_EXCEEDED',
      value: request.clinicalFindings.length
    });
  }

  if (request.assessment && request.assessment.length > 10000) {
    errors.push({
      field: 'assessment',
      message: CreateClinicalNoteValidationRules.assessment.message,
      code: 'MAX_LENGTH_EXCEEDED',
      value: request.assessment.length
    });
  }

  if (request.plan && request.plan.length > 10000) {
    errors.push({
      field: 'plan',
      message: CreateClinicalNoteValidationRules.plan.message,
      code: 'MAX_LENGTH_EXCEEDED',
      value: request.plan.length
    });
  }

  return errors;
}

/**
 * Validate UpdateClinicalNoteRequest
 */
export function validateUpdateClinicalNoteRequest(request: UpdateClinicalNoteRequest): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!request.noteId || request.noteId.trim() === '') {
    errors.push({
      field: 'noteId',
      message: 'NoteId là bắt buộc',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!request.updatedBy || request.updatedBy.trim() === '') {
    errors.push({
      field: 'updatedBy',
      message: 'UpdatedBy là bắt buộc',
      code: 'REQUIRED_FIELD'
    });
  }

  // At least one field must be provided
  if (!request.noteTitle && !request.noteContent && !request.clinicalFindings && 
      !request.assessment && !request.plan) {
    errors.push({
      field: 'general',
      message: 'Phải cung cấp ít nhất một trường để cập nhật',
      code: 'NO_FIELDS_TO_UPDATE'
    });
  }

  // Field length validation
  if (request.noteTitle && request.noteTitle.length > 200) {
    errors.push({
      field: 'noteTitle',
      message: 'Tiêu đề ghi chú không được vượt quá 200 ký tự',
      code: 'MAX_LENGTH_EXCEEDED',
      value: request.noteTitle.length
    });
  }

  if (request.noteContent && request.noteContent.length > 50000) {
    errors.push({
      field: 'noteContent',
      message: 'Nội dung ghi chú không được vượt quá 50,000 ký tự',
      code: 'MAX_LENGTH_EXCEEDED',
      value: request.noteContent.length
    });
  }

  return errors;
}

/**
 * Validate CosignClinicalNoteRequest
 */
export function validateCosignClinicalNoteRequest(request: CosignClinicalNoteRequest): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!request.noteId || request.noteId.trim() === '') {
    errors.push({
      field: 'noteId',
      message: 'NoteId là bắt buộc',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!request.cosignedBy || request.cosignedBy.trim() === '') {
    errors.push({
      field: 'cosignedBy',
      message: 'CosignedBy là bắt buộc',
      code: 'REQUIRED_FIELD'
    });
  }

  if (request.cosignComment && request.cosignComment.length > 1000) {
    errors.push({
      field: 'cosignComment',
      message: 'Ghi chú ký tên không được vượt quá 1,000 ký tự',
      code: 'MAX_LENGTH_EXCEEDED',
      value: request.cosignComment.length
    });
  }

  return errors;
}
