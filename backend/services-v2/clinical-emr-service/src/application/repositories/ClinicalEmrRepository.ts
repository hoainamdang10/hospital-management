import { PatientSummary } from "../entities/PatientSummary";
import { MedicalRecordHistory } from "../entities/MedicalRecordHistory";
import { SearchResult } from "../entities/SearchResult";
import { ServiceMetrics } from "../entities/ServiceMetrics";

export interface ClinicalEmrRepository {
  // Patient Summary
  getPatientSummary(patientId: string): Promise<PatientSummary | null>;

  // Medical Record History
  getMedicalRecordHistory(recordId: string): Promise<MedicalRecordHistory[]>;

  // Search Functionality
  searchClinicalData(searchTerm: string, limit: number): Promise<SearchResult[]>;

  // Service Metrics
  getServiceMetrics(): Promise<ServiceMetrics>;

  // Export Functionality
  exportPatientData(patientId: string): Promise<Record<string, unknown>>;
}
