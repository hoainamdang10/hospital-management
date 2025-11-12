export interface ServiceMetrics {
  // Patient metrics
  totalPatients: number;

  // Medical record metrics
  totalMedicalRecords: number;
  recordsLast30Days: number;
  recordsLast7Days: number;

  // Clinical notes metrics
  totalClinicalNotes: number;
  notesLast30Days: number;

  // Lab results metrics
  totalLabResults: number;
  labsLast30Days: number;
  pendingLabResults: number;

  // Prescriptions metrics
  totalPrescriptions: number;
  activePrescriptions: number;
  prescriptionsLast30Days: number;

  // Imaging studies metrics
  totalImagingStudies: number;
  imagingLast30Days: number;

  // Treatment plans metrics
  totalTreatmentPlans: number;
  activeTreatmentPlans: number;

  // Audit metrics
  totalAuditLogs: number;
  auditLogsLast24h: number;

  // Integration metrics
  totalIntegrationEvents: number;
  failedIntegrationEvents: number;

  // Data freshness
  lastMedicalRecordUpdate: Date;
  lastClinicalNoteUpdate: Date;
  lastAuditLogUpdate: Date;

  // Timestamp
  calculatedAt: Date;
}
