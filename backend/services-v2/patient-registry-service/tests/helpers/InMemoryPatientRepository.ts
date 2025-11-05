import { IPatientRepository } from '../../src/domain/repositories/IPatientRepository';
import { Patient } from '../../src/domain/aggregates/Patient';
import { PatientId } from '../../src/domain/value-objects/PatientId';
import { PatientStatus } from '../../src/domain/value-objects/PatientStatus';

interface SavedPatient {
  patient: Patient;
}

export class InMemoryPatientRepository implements IPatientRepository {
  private patients = new Map<string, SavedPatient>();

  async findById(patientId: PatientId): Promise<Patient | null> {
    return this.patients.get(patientId.getValue())?.patient ?? null;
  }

  async findByUserId(userId: string): Promise<Patient | null> {
    for (const record of this.patients.values()) {
      if (record.patient.getProps().userId === userId) {
        return record.patient;
      }
    }
    return null;
  }

  async findByNationalId(nationalId: string): Promise<Patient | null> {
    for (const record of this.patients.values()) {
      if (record.patient.getProps().personalInfo.nationalId === nationalId) {
        return record.patient;
      }
    }
    return null;
  }

  async save(patient: Patient): Promise<void> {
    this.patients.set(patient.getPatientId()!, { patient });
  }

  async delete(patientId: PatientId): Promise<void> {
    const existing = this.patients.get(patientId.getValue());
    if (existing) {
      const props = existing.patient.getProps();
      props.status = PatientStatus.INACTIVE;
      this.patients.set(patientId.getValue(), { patient: existing.patient });
    }
  }

  async findWithFilters(): Promise<{ patients: Patient[]; total: number; }> {
    const patients = Array.from(this.patients.values()).map(record => record.patient);
    return { patients, total: patients.length };
  }

  async searchPatients(
    searchTerm: string,
    _filters?: { isActive?: boolean; hasInsurance?: boolean },
    _pagination?: { page: number; limit: number }
  ): Promise<{ patients: Patient[]; total: number }> {
    const term = searchTerm.trim().toLowerCase();
    const patients = Array.from(this.patients.values())
      .map(record => record.patient)
      .filter(patient => {
        const props = patient.getProps();
        return props.personalInfo.fullName.toLowerCase().includes(term) ||
          props.personalInfo.nationalId.includes(term) ||
          (props.contactInfo.email?.toLowerCase().includes(term) ?? false);
      });

    return { patients, total: patients.length };
  }

  async matchPatients(): Promise<Array<{ patient: Patient; matchGrade: 'certain' | 'probable' | 'possible' | 'certainly-not'; score: number }>> {
    return [];
  }

  async findByBHYTNumber(bhytNumber: string): Promise<Patient | null> {
    for (const record of this.patients.values()) {
      if (record.patient.getProps().insuranceInfo?.bhytNumber === bhytNumber) {
        return record.patient;
      }
    }
    return null;
  }

  async getHealthStatus(): Promise<{ status: string; message?: string }> {
    return { status: 'healthy' };
  }

  async getStatistics(): Promise<{
    total: number;
    byGender: { male: number; female: number; other: number; unknown: number; };
    byAgeRange: { '0-18': number; '19-40': number; '41-60': number; '60+': number; };
    byInsuranceType: { bhyt: number; bhtn: number; private: number; selfPay: number; };
    byStatus: { active: number; inactive: number; deceased: number; merged: number; };
    registrationTrend: Array<{ month: string; count: number }>;
  }> {
    const patients = Array.from(this.patients.values()).map(record => record.patient);
    return {
      total: patients.length,
      byGender: { male: 0, female: 0, other: 0, unknown: 0 },
      byAgeRange: { '0-18': 0, '19-40': 0, '41-60': 0, '60+': 0 },
      byInsuranceType: { bhyt: 0, bhtn: 0, private: 0, selfPay: 0 },
      byStatus: { active: patients.length, inactive: 0, deceased: 0, merged: 0 },
      registrationTrend: []
    };
  }

  async getPatientHistory(
    patientId: PatientId,
    options?: {
      limit?: number;
      offset?: number;
      dateFrom?: Date;
      dateTo?: Date;
      eventTypes?: string[];
    }
  ): Promise<{
    history: Array<{
      eventId: string;
      eventType: string;
      action: string;
      userId: string;
      userRole?: string;
      timestamp: Date;
      changes?: Record<string, any>;
      accessedFields?: string[];
      ipAddress?: string;
      userAgent?: string;
    }>;
    total: number;
  }> {
    // In-memory implementation returns empty history for tests
    return { history: [], total: 0 };
  }

  /**
   * Utility helpers for tests
   */
  clear(): void {
    this.patients.clear();
  }

  getAllPatients(): Patient[] {
    return Array.from(this.patients.values()).map(record => record.patient);
  }
}
