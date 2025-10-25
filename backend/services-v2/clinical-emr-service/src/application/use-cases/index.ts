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


