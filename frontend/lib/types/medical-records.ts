/**
 * Medical Records Types
 * Types for Clinical EMR Service
 */

export interface VitalSigns {
  bloodPressure?: string;        // "120/80"
  heartRate?: number;            // bpm
  temperature?: number;          // °C
  weight?: number;               // kg
  height?: number;               // cm
  respiratoryRate?: number;      // breaths/min
  oxygenSaturation?: number;     // %
  bmi?: number;                  // calculated
}

export interface Diagnosis {
  code: string;                  // ICD-10 code
  description: string;
  type: 'primary' | 'secondary';
  diagnosedAt?: string;
}

export interface Medication {
  medicationCode: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  startDate?: string;
  endDate?: string;
}

export interface MedicalRecord {
  recordId: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  departmentName?: string;
  appointmentId?: string;
  visitDate: string;
  chiefComplaint: string;        // Lý do khám
  
  // Vital Signs
  vitalSigns?: VitalSigns;
  
  // Diagnoses
  diagnoses: Diagnosis[];
  
  // Medications
  medications: Medication[];
  
  // Clinical Notes
  clinicalNotes?: string;
  treatmentPlan?: string;
  followUpInstructions?: string;
  followUpDate?: string;
  
  // Lab Results
  labResults?: Array<{
    testName: string;
    result: string;
    unit: string;
    normalRange: string;
    status: 'normal' | 'abnormal' | 'critical';
  }>;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'archived';
}

export interface MedicalRecordSummary {
  recordId: string;
  visitDate: string;
  doctorName: string;
  departmentName?: string;
  primaryDiagnosis?: string;
  medicationCount: number;
  status: 'active' | 'archived';
}

export interface HealthStatistics {
  totalRecords: number;
  totalPrescriptions: number;
  totalLabTests: number;
  totalDiagnoses: number;
  lastVisit?: string;
  commonDiagnoses: Array<{
    diagnosis: string;
    count: number;
  }>;
}

export interface ListMedicalRecordsResponse {
  success: boolean;
  records: MedicalRecord[];
  totalCount: number;
}

export interface GetMedicalRecordResponse {
  success: boolean;
  record: MedicalRecord;
}

export interface Prescription {
  prescriptionId: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  prescribedDate: string;
  medications: Medication[];
  instructions?: string;
  status: 'active' | 'dispensed' | 'cancelled';
  dispensedAt?: string;
  dispensedBy?: string;
}

export interface ListPrescriptionsResponse {
  success: boolean;
  prescriptions: Prescription[];
  totalCount: number;
}
