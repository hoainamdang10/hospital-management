/**
 * Use Cases - Export Index
 * Central export point for all use cases
 */

// Core CRUD Use Cases
export * from './CreateMedicalRecordUseCase';
export * from './GetMedicalRecordUseCase';
export * from './GetPatientMedicalRecordsUseCase';
export * from './UpdateMedicalRecordUseCase';
export * from './DeleteMedicalRecordUseCase';

// Archive/Restore Use Cases
export * from './ArchiveMedicalRecordUseCase';
export * from './RestoreMedicalRecordUseCase';

// Diagnosis Management Use Cases
export * from './AddDiagnosisUseCase';
export * from './RemoveDiagnosisUseCase';

// Medication Management Use Cases
export * from './AddMedicationUseCase';
export * from './RemoveMedicationUseCase';

// Vital Signs Use Cases
export * from './UpdateVitalSignsUseCase';

// FHIR Use Cases
export * from './ExportToFHIRUseCase';
export * from './ValidateFHIRComplianceUseCase';

// Query Use Cases
export * from './SearchMedicalRecordsUseCase';
export * from './GetDoctorMedicalRecordsUseCase';
export * from './GetMedicalRecordStatisticsUseCase';

// Reporting Use Cases
export * from './GenerateMedicalReportUseCase';

// Access Control Use Cases
export * from './GrantAccessUseCase';
export * from './RevokeAccessUseCase';
export * from './AuditAccessHistoryUseCase';

// Clinical Notes Use Cases
export * from './CreateClinicalNoteUseCase';
export * from './GetClinicalNoteUseCase';
export * from './UpdateClinicalNoteUseCase';
export * from './CosignClinicalNoteUseCase';
export * from './ListClinicalNotesUseCase';

// Diagnostic Reports Use Cases
export * from './CreateDiagnosticReportUseCase';
export * from './GetDiagnosticReportUseCase';
export * from './UpdateDiagnosticReportUseCase';
export * from './FinalizeDiagnosticReportUseCase';
export * from './ListDiagnosticReportsUseCase';

// Treatment Plans Use Cases
export * from './CreateTreatmentPlanUseCase';
export * from './GetTreatmentPlanUseCase';
export * from './UpdateTreatmentPlanUseCase';
export * from './CompleteTreatmentPlanUseCase';
export * from './ListTreatmentPlansUseCase';

// Prescription Use Cases
export * from './CreatePrescriptionUseCase';
export * from './GetPrescriptionUseCase';
export * from './DispensePrescriptionUseCase';
export * from './ListPrescriptionsUseCase';

