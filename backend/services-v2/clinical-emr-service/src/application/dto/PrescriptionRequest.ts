/**
 * Prescription DTOs - Request/Response Models (Concise Version)
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import {
  PrescriptionStatus,
  MedicationItem,
  MedicationDosageForm,
  MedicationRoute,
} from '../../domain/aggregates/Prescription.aggregate';

// CREATE
export interface CreatePrescriptionRequest {
  medicalRecordId: string;
  patientId: string;
  prescribedBy: string;
  medications: Omit<MedicationItem, 'itemId' | 'status'>[];
  prescribedDate: string;
  diagnosis?: string;
  diagnosisCode?: string;
  generalInstructions?: string;
  precautions?: string;
  validUntil?: string;
  refillsAllowed?: number;
  createdBy: string;
}

export interface CreatePrescriptionResponse {
  prescriptionId: string;
  medicationCount: number;
  status: PrescriptionStatus;
  createdAt: string;
  message: string;
}

export function validateCreatePrescriptionRequest(req: CreatePrescriptionRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!req.medicalRecordId?.trim()) errors.push('MedicalRecordId là bắt buộc');
  if (!req.patientId?.trim()) errors.push('PatientId là bắt buộc');
  if (!req.prescribedBy?.trim()) errors.push('PrescribedBy là bắt buộc');
  if (!req.medications || req.medications.length === 0) errors.push('Phải có ít nhất một loại thuốc');
  if (!req.prescribedDate?.trim()) errors.push('PrescribedDate là bắt buộc');
  if (!req.createdBy?.trim()) errors.push('CreatedBy là bắt buộc');
  
  if (req.patientId && !/^PAT-\d{6}-\d{3}$/.test(req.patientId)) errors.push('PatientId không hợp lệ');
  if (req.prescribedBy && !/^[A-Z]{2,4}-DOC-\d{6}-\d{3}$/.test(req.prescribedBy)) errors.push('PrescribedBy không hợp lệ');
  
  req.medications?.forEach((med, idx) => {
    if (!med.medicationName?.trim()) errors.push(`Tên thuốc #${idx + 1} là bắt buộc`);
    if (!med.dosage?.trim()) errors.push(`Liều lượng thuốc #${idx + 1} là bắt buộc`);
    if (!med.frequency?.trim()) errors.push(`Tần suất thuốc #${idx + 1} là bắt buộc`);
    if (!med.duration?.trim()) errors.push(`Thời gian thuốc #${idx + 1} là bắt buộc`);
    if (med.quantity <= 0) errors.push(`Số lượng thuốc #${idx + 1} phải > 0`);
  });
  
  return { valid: errors.length === 0, errors };
}

// GET
export interface GetPrescriptionRequest {
  prescriptionId: string;
  accessedBy: string;
  accessPurpose?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface GetPrescriptionResponse {
  prescriptionId: string;
  medicalRecordId: string;
  patientId: string;
  prescribedBy: string;
  diagnosis?: string;
  medications: MedicationItem[];
  generalInstructions?: string;
  precautions?: string;
  prescribedDate: string;
  validUntil?: string;
  dispensedBy?: string;
  dispensedAt?: string;
  pharmacyId?: string;
  refillsAllowed: number;
  refillsRemaining: number;
  status: PrescriptionStatus;
  createdAt: string;
  updatedAt: string;
}

export function validateGetPrescriptionRequest(req: GetPrescriptionRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!req.prescriptionId?.trim()) errors.push('PrescriptionId là bắt buộc');
  if (!req.accessedBy?.trim()) errors.push('AccessedBy là bắt buộc');
  if (req.prescriptionId && !/^PRESC-\d{6}-\d{3}$/.test(req.prescriptionId)) errors.push('PrescriptionId không hợp lệ');
  return { valid: errors.length === 0, errors };
}

// DISPENSE
export interface DispensePrescriptionRequest {
  prescriptionId: string;
  dispensedBy: string;
  pharmacyId: string;
}

export interface DispensePrescriptionResponse {
  prescriptionId: string;
  status: PrescriptionStatus;
  dispensedAt: string;
  message: string;
}

export function validateDispensePrescriptionRequest(req: DispensePrescriptionRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!req.prescriptionId?.trim()) errors.push('PrescriptionId là bắt buộc');
  if (!req.dispensedBy?.trim()) errors.push('DispensedBy là bắt buộc');
  if (!req.pharmacyId?.trim()) errors.push('PharmacyId là bắt buộc');
  return { valid: errors.length === 0, errors };
}

// LIST
export interface ListPrescriptionsRequest {
  patientId?: string;
  medicalRecordId?: string;
  prescribedBy?: string;
  status?: PrescriptionStatus;
  pharmacyId?: string;
  fromDate?: string;
  toDate?: string;
  hasRefills?: boolean;
  limit?: number;
  offset?: number;
  accessedBy?: string;
}

export interface PrescriptionSummaryDTO {
  prescriptionId: string;
  patientId: string;
  prescribedBy: string;
  medicationCount: number;
  prescribedDate: string;
  validUntil?: string;
  dispensedAt?: string;
  refillsRemaining: number;
  status: PrescriptionStatus;
  createdAt: string;
}

export interface ListPrescriptionsResponse {
  prescriptions: PrescriptionSummaryDTO[];
  total: number;
  limit: number;
  offset: number;
}

export function validateListPrescriptionsRequest(req: ListPrescriptionsRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (req.limit !== undefined && req.limit <= 0) errors.push('Limit phải > 0');
  if (req.offset !== undefined && req.offset < 0) errors.push('Offset phải >= 0');
  return { valid: errors.length === 0, errors };
}
