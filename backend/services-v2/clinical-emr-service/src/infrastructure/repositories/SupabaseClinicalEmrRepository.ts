import { ClinicalEmrRepository } from "../../application/repositories/ClinicalEmrRepository";
import { PatientSummary } from "../../application/entities/PatientSummary";
import { MedicalRecordHistory } from "../../application/entities/MedicalRecordHistory";
import { SearchResult } from "../../application/entities/SearchResult";
import { ServiceMetrics } from "../../application/entities/ServiceMetrics";
import { supabaseClient } from "../db/supabase-client";

export class SupabaseClinicalEmrRepository implements ClinicalEmrRepository {

  async getPatientSummary(patientId: string): Promise<PatientSummary | null> {
    try {
      const { data, error } = await supabaseClient
        .rpc('get_patient_summary', { p_patient_id: patientId });

      if (error) {
        console.error('Error getting patient summary:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const summary = data[0];

      return {
        patientId: summary.patient_id,
        primaryMedicalRecordId: summary.primary_medical_record_id,
        diagnosis: summary.diagnosis,
        firstVisitDate: new Date(summary.first_visit_date),
        totalNotes: summary.total_notes,
        totalLabResults: summary.total_lab_results,
        activePrescriptions: summary.active_prescriptions,
        totalImagingStudies: summary.total_imaging_studies,
        activeTreatmentPlans: summary.active_treatment_plans,
        latestNoteDate: summary.latest_note_date ? new Date(summary.latest_note_date) : undefined,
        latestLabDate: summary.latest_lab_date ? new Date(summary.latest_lab_date) : undefined,
        latestPrescriptionDate: summary.latest_prescription_date ? new Date(summary.latest_prescription_date) : undefined,
        fullName: summary.full_name,
        dateOfBirth: summary.date_of_birth ? new Date(summary.date_of_birth) : undefined,
        gender: summary.gender,
        phone: summary.phone,
        email: summary.email
      };
    } catch (error) {
      console.error('Repository error getting patient summary:', error);
      throw error;
    }
  }

  async getMedicalRecordHistory(recordId: string): Promise<MedicalRecordHistory[]> {
    try {
      const { data, error } = await supabaseClient
        .rpc('get_medical_record_history', { p_record_id: recordId });

      if (error) {
        console.error('Error getting medical record history:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((item: Record<string, unknown>) => ({
        historyId: item.history_id as string,
        action: item.action as string,
        actorId: item.actor_id as string,
        metadata: item.metadata as Record<string, unknown>,
        createdAt: new Date(item.created_at as string),
        historyType: item.history_type as 'audit_log' | 'version'
      }));
    } catch (error) {
      console.error('Repository error getting medical record history:', error);
      throw error;
    }
  }

  async searchClinicalData(searchTerm: string, limit: number): Promise<SearchResult[]> {
    try {
      const { data, error } = await supabaseClient
        .rpc('search_clinical_data', {
          p_search_term: searchTerm,
          p_limit: limit
        });

      if (error) {
        console.error('Error searching clinical data:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((item: Record<string, unknown>) => ({
        resultType: item.result_type as 'medical_record' | 'clinical_note' | 'lab_result' | 'prescription',
        id: item.id as string,
        patientId: item.patient_id as string,
        title: item.title as string,
        content: item.content as Record<string, unknown>,
        createdAt: new Date(item.created_at as string),
        relevanceScore: parseFloat(item.relevance_score as string)
      }));
    } catch (error) {
      console.error('Repository error searching clinical data:', error);
      throw error;
    }
  }

  async getServiceMetrics(): Promise<ServiceMetrics> {
    try {
      const { data, error } = await supabaseClient
        .from('service_metrics')
        .select('*')
        .single();

      if (error) {
        console.error('Error getting service metrics:', error);
        throw error;
      }

      return {
        totalPatients: data.total_patients,
        totalMedicalRecords: data.total_medical_records,
        recordsLast30Days: data.records_last_30_days,
        recordsLast7Days: data.records_last_7_days,
        totalClinicalNotes: data.total_clinical_notes,
        notesLast30Days: data.notes_last_30_days,
        totalLabResults: data.total_lab_results,
        labsLast30Days: data.labs_last_30_days,
        pendingLabResults: data.pending_lab_results,
        totalPrescriptions: data.total_prescriptions,
        activePrescriptions: data.active_prescriptions,
        prescriptionsLast30Days: data.prescriptions_last_30_days,
        totalImagingStudies: data.total_imaging_studies,
        imagingLast30Days: data.imaging_last_30_days,
        totalTreatmentPlans: data.total_treatment_plans,
        activeTreatmentPlans: data.active_treatment_plans,
        totalAuditLogs: data.total_audit_logs,
        auditLogsLast24h: data.audit_logs_last_24h,
        totalIntegrationEvents: data.total_integration_events,
        failedIntegrationEvents: data.failed_integration_events,
        lastMedicalRecordUpdate: new Date(data.last_medical_record_update),
        lastClinicalNoteUpdate: new Date(data.last_clinical_note_update),
        lastAuditLogUpdate: new Date(data.last_audit_log_update),
        calculatedAt: new Date(data.calculated_at)
      };
    } catch (error) {
      console.error('Repository error getting service metrics:', error);
      throw error;
    }
  }

  async exportPatientData(patientId: string): Promise<Record<string, unknown>> {
    try {
      const { data, error } = await supabaseClient
        .rpc('export_patient_data', { p_patient_id: patientId });

      if (error) {
        console.error('Error exporting patient data:', error);
        throw error;
      }

      return data as Record<string, unknown>;
    } catch (error) {
      console.error('Repository error exporting patient data:', error);
      throw error;
    }
  }
}
