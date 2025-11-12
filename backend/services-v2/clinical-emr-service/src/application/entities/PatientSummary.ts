export interface PatientSummary {
  patientId: string;
  primaryMedicalRecordId: string;
  diagnosis: Record<string, unknown>;
  firstVisitDate: Date;
  totalNotes: number;
  totalLabResults: number;
  activePrescriptions: number;
  totalImagingStudies: number;
  activeTreatmentPlans: number;
  latestNoteDate?: Date;
  latestLabDate?: Date;
  latestPrescriptionDate?: Date;
  fullName?: string;
  dateOfBirth?: Date;
  gender?: string;
  phone?: string;
  email?: string;
}
