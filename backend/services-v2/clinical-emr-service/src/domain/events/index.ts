/**
 * Domain Events Exports
 * Centralized export for all domain events
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD
 */

export * from './MedicalRecordCreatedEvent';
export * from './MedicalRecordUpdatedEvent';
export * from './DiagnosisAddedEvent';
export * from './MedicationAddedEvent';
export * from './VitalSignsUpdatedEvent';
export * from './MedicalRecordArchivedEvent';

// Clinical Notes Events
export * from './ClinicalNoteCreatedEvent';
export * from './ClinicalNoteUpdatedEvent';
export * from './ClinicalNoteCosignedEvent';

// Diagnostic Report Events
export * from './DiagnosticReportCreatedEvent';
export * from './DiagnosticReportUpdatedEvent';
export * from './DiagnosticReportFinalizedEvent';

// Treatment Plan Events
export * from './TreatmentPlanCreatedEvent';
export * from './TreatmentPlanUpdatedEvent';
export * from './TreatmentPlanCompletedEvent';

// Prescription Events
export * from './PrescriptionCreatedEvent';
export * from './PrescriptionUpdatedEvent';
export * from './PrescriptionDispensedEvent';
export * from './PrescriptionCompletedEvent';

