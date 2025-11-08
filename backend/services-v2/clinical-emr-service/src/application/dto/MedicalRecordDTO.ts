import { VitalSignsSnapshot, DiagnosisInfo } from '../../domain/entities/MedicalRecord';

export interface MedicalRecordDTO {
  id: string;
  patientId: string;
  doctorId: string;
  encounterType: 'inpatient' | 'outpatient';
  encounterDate: string;
  diagnosis: DiagnosisInfo;
  treatmentSummary?: string;
  vitalSigns?: VitalSignsSnapshot;
  status: 'draft' | 'final' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicalRecordDTO {
  patientId: string;
  doctorId: string;
  encounterType: 'inpatient' | 'outpatient';
  encounterDate: string;
  diagnosis: DiagnosisInfo;
  treatmentSummary?: string;
  vitalSigns?: VitalSignsSnapshot;
}

export interface UpdateMedicalRecordDTO extends Partial<CreateMedicalRecordDTO> {
  status?: 'draft' | 'final' | 'archived';
}
