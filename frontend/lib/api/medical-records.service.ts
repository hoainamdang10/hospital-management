import apiClient from './axios';
import type {
  MedicalRecord,
  MedicalRecordSummary,
  HealthStatistics,
  ListMedicalRecordsResponse,
  GetMedicalRecordResponse,
  Prescription,
  ListPrescriptionsResponse,
} from '@/lib/types/medical-records';

/**
 * Medical Records Service
 * Handles all medical records API calls to Clinical EMR Service
 */
export const medicalRecordsService = {
  /**
   * Get all medical records for a patient
   * GET /api/v2/clinical-emr/patients/:patientId/medical-records
   */
  async getPatientRecords(patientId: string): Promise<ListMedicalRecordsResponse> {
    const response = await apiClient.get<ListMedicalRecordsResponse>(
      `/api/v2/clinical-emr/patients/${patientId}/medical-records`
    );
    return response.data;
  },

  /**
   * Get medical record by ID
   * GET /api/v2/clinical-emr/medical-records/:recordId
   */
  async getRecordById(recordId: string): Promise<GetMedicalRecordResponse> {
    const response = await apiClient.get<GetMedicalRecordResponse>(
      `/api/v2/clinical-emr/medical-records/${recordId}`
    );
    return response.data;
  },

  /**
   * Get patient health statistics
   * GET /api/v2/clinical-emr/patients/:patientId/statistics
   */
  async getHealthStatistics(patientId: string): Promise<HealthStatistics> {
    const response = await apiClient.get<{ success: boolean; data: HealthStatistics }>(
      `/api/v2/clinical-emr/patients/${patientId}/statistics`
    );
    return response.data.data;
  },

  /**
   * Get patient prescriptions
   * GET /api/v2/clinical-emr/prescriptions?patientId=xxx
   */
  async getPatientPrescriptions(patientId: string): Promise<ListPrescriptionsResponse> {
    const response = await apiClient.get<ListPrescriptionsResponse>(
      `/api/v2/clinical-emr/prescriptions`,
      {
        params: { patientId },
      }
    );
    return response.data;
  },

  /**
   * Get prescription by ID
   * GET /api/v2/clinical-emr/prescriptions/:prescriptionId
   */
  async getPrescriptionById(prescriptionId: string): Promise<Prescription> {
    const response = await apiClient.get<{ success: boolean; prescription: Prescription }>(
      `/api/v2/clinical-emr/prescriptions/${prescriptionId}`
    );
    return response.data.prescription;
  },

  /**
   * Export medical record to FHIR format
   * GET /api/v2/clinical-emr/medical-records/:recordId/fhir
   */
  async exportToFHIR(recordId: string): Promise<any> {
    const response = await apiClient.get(
      `/api/v2/clinical-emr/medical-records/${recordId}/fhir`
    );
    return response.data;
  },
};

/**
 * Helper functions
 */

// Calculate BMI
export function calculateBMI(weight?: number, height?: number): number | undefined {
  if (!weight || !height || height === 0) return undefined;
  const heightInMeters = height / 100;
  return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
}

// Get BMI status
export function getBMIStatus(bmi?: number): {
  status: string;
  color: string;
  label: string;
} {
  if (!bmi) return { status: 'unknown', color: 'gray', label: 'Chưa có dữ liệu' };

  if (bmi < 18.5) return { status: 'underweight', color: 'blue', label: 'Thiếu cân' };
  if (bmi < 25) return { status: 'normal', color: 'green', label: 'Bình thường' };
  if (bmi < 30) return { status: 'overweight', color: 'yellow', label: 'Thừa cân' };
  return { status: 'obese', color: 'red', label: 'Béo phì' };
}

// Get vital sign status
export function getVitalSignStatus(
  type: 'bloodPressure' | 'heartRate' | 'temperature' | 'oxygenSaturation',
  value: string | number | undefined
): 'normal' | 'warning' | 'critical' | 'unknown' {
  if (!value) return 'unknown';

  switch (type) {
    case 'bloodPressure': {
      const [systolic, diastolic] = String(value).split('/').map(Number);
      if (systolic < 90 || diastolic < 60) return 'warning';
      if (systolic > 140 || diastolic > 90) return 'warning';
      if (systolic > 180 || diastolic > 120) return 'critical';
      return 'normal';
    }
    case 'heartRate': {
      const hr = Number(value);
      if (hr < 60 || hr > 100) return 'warning';
      if (hr < 40 || hr > 120) return 'critical';
      return 'normal';
    }
    case 'temperature': {
      const temp = Number(value);
      if (temp < 36 || temp > 37.5) return 'warning';
      if (temp < 35 || temp > 39) return 'critical';
      return 'normal';
    }
    case 'oxygenSaturation': {
      const spo2 = Number(value);
      if (spo2 < 95) return 'warning';
      if (spo2 < 90) return 'critical';
      return 'normal';
    }
    default:
      return 'unknown';
  }
}

// Format diagnosis with ICD code
export function formatDiagnosis(diagnosis: { code: string; description: string }): string {
  return `${diagnosis.description} (${diagnosis.code})`;
}

// Get medication duration in days
export function getMedicationDurationDays(duration: string): number | undefined {
  const match = duration.match(/(\d+)\s*(ngày|day)/i);
  return match ? parseInt(match[1]) : undefined;
}
