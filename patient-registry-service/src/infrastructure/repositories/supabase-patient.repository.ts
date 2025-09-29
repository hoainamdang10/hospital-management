/**
 * Supabase Patient Repository - Infrastructure Layer
 * Patient repository implementation with Supabase integration
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Repository Pattern, HIPAA, Supabase
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IPatientRepository } from '../../domain/repositories/patient.repository';
import { Patient, PatientStatus } from '../../domain/aggregates/patient.aggregate';
import { PatientId } from '../../domain/value-objects/patient-id';

export class SupabasePatientRepository implements IPatientRepository {
  private supabase: SupabaseClient;
  private readonly tableName = 'patients';
  private readonly schemaName = 'patient_schema';

  constructor(
    supabaseUrl: string,
    supabaseServiceKey: string
  ) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema: this.schemaName }
    });
  }

  /**
   * Save patient (create or update)
   */
  async save(patient: Patient): Promise<void> {
    try {
      const data = patient.toPersistence();
      
      if (patient.id) {
        // Update existing patient
        const { error } = await this.supabase
          .from(this.tableName)
          .update(data)
          .eq('id', patient.id);

        if (error) {
          throw new Error(`Lỗi cập nhật bệnh nhân: ${error.message}`);
        }
      } else {
        // Create new patient
        const { data: insertedData, error } = await this.supabase
          .from(this.tableName)
          .insert(data)
          .select()
          .single();

        if (error) {
          throw new Error(`Lỗi tạo bệnh nhân mới: ${error.message}`);
        }

        // Set the generated ID
        if (insertedData) {
          (patient as any).id = insertedData.id;
        }
      }

      // Log HIPAA audit trail
      await this.logHIPAAAudit('SAVE', patient.getPatientId(), data.registered_by || 'SYSTEM');
    } catch (error) {
      throw new Error(`Lỗi lưu thông tin bệnh nhân: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find patient by ID
   */
  async findById(id: string): Promise<Patient | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Lỗi tìm bệnh nhân theo ID: ${error.message}`);
      }

      if (!data) return null;

      // Log HIPAA audit trail
      await this.logHIPAAAudit('READ', data.patient_id, 'SYSTEM');

      return Patient.fromPersistence(data);
    } catch (error) {
      throw new Error(`Lỗi tìm bệnh nhân: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find patient by patient ID
   */
  async findByPatientId(patientId: string): Promise<Patient | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('patient_id', patientId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Lỗi tìm bệnh nhân theo mã: ${error.message}`);
      }

      if (!data) return null;

      // Log HIPAA audit trail
      await this.logHIPAAAudit('READ', data.patient_id, 'SYSTEM');

      return Patient.fromPersistence(data);
    } catch (error) {
      throw new Error(`Lỗi tìm bệnh nhân: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find patient by national ID
   */
  async findByNationalId(nationalId: string): Promise<Patient | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('national_id', nationalId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Lỗi tìm bệnh nhân theo CCCD: ${error.message}`);
      }

      if (!data) return null;

      // Log HIPAA audit trail
      await this.logHIPAAAudit('READ', data.patient_id, 'SYSTEM');

      return Patient.fromPersistence(data);
    } catch (error) {
      throw new Error(`Lỗi tìm bệnh nhân: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find patients by phone
   */
  async findByPhone(phone: string): Promise<Patient[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('phone', phone);

      if (error) {
        throw new Error(`Lỗi tìm bệnh nhân theo số điện thoại: ${error.message}`);
      }

      if (!data || data.length === 0) return [];

      // Log HIPAA audit trail for each patient
      for (const patient of data) {
        await this.logHIPAAAudit('READ', patient.patient_id, 'SYSTEM');
      }

      return data.map(d => Patient.fromPersistence(d));
    } catch (error) {
      throw new Error(`Lỗi tìm bệnh nhân: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find patient by email
   */
  async findByEmail(email: string): Promise<Patient | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Lỗi tìm bệnh nhân theo email: ${error.message}`);
      }

      if (!data) return null;

      // Log HIPAA audit trail
      await this.logHIPAAAudit('READ', data.patient_id, 'SYSTEM');

      return Patient.fromPersistence(data);
    } catch (error) {
      throw new Error(`Lỗi tìm bệnh nhân: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find patients by full name
   */
  async findByFullName(fullName: string): Promise<Patient[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .ilike('full_name', `%${fullName}%`);

      if (error) {
        throw new Error(`Lỗi tìm bệnh nhân theo tên: ${error.message}`);
      }

      if (!data || data.length === 0) return [];

      // Log HIPAA audit trail for each patient
      for (const patient of data) {
        await this.logHIPAAAudit('READ', patient.patient_id, 'SYSTEM');
      }

      return data.map(d => Patient.fromPersistence(d));
    } catch (error) {
      throw new Error(`Lỗi tìm bệnh nhân: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search patients with criteria
   */
  async searchPatients(criteria: {
    fullName?: string;
    phone?: string;
    email?: string;
    nationalId?: string;
    status?: PatientStatus;
    registrationDateFrom?: Date;
    registrationDateTo?: Date;
    ageFrom?: number;
    ageTo?: number;
    gender?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ patients: Patient[]; total: number }> {
    try {
      let query = this.supabase.from(this.tableName).select('*', { count: 'exact' });

      // Apply filters
      if (criteria.fullName) {
        query = query.ilike('full_name', `%${criteria.fullName}%`);
      }

      if (criteria.phone) {
        query = query.eq('phone', criteria.phone);
      }

      if (criteria.email) {
        query = query.eq('email', criteria.email);
      }

      if (criteria.nationalId) {
        query = query.eq('national_id', criteria.nationalId);
      }

      if (criteria.status) {
        query = query.eq('status', criteria.status);
      }

      if (criteria.gender) {
        query = query.eq('gender', criteria.gender);
      }

      if (criteria.registrationDateFrom) {
        query = query.gte('registration_date', criteria.registrationDateFrom.toISOString());
      }

      if (criteria.registrationDateTo) {
        query = query.lte('registration_date', criteria.registrationDateTo.toISOString());
      }

      // Age filtering would require calculated field or stored procedure
      // For now, we'll filter after retrieval

      // Apply pagination
      if (criteria.limit) {
        query = query.limit(criteria.limit);
      }

      if (criteria.offset) {
        query = query.range(criteria.offset, (criteria.offset + (criteria.limit || 10)) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Lỗi tìm kiếm bệnh nhân: ${error.message}`);
      }

      if (!data) return { patients: [], total: 0 };

      // Log HIPAA audit trail for search
      await this.logHIPAAAudit('SEARCH', 'MULTIPLE', 'SYSTEM', `Search criteria: ${JSON.stringify(criteria)}`);

      let patients = data.map(d => Patient.fromPersistence(d));

      // Apply age filtering if specified
      if (criteria.ageFrom !== undefined || criteria.ageTo !== undefined) {
        patients = patients.filter(patient => {
          const age = patient.personalInfo.age;
          if (criteria.ageFrom !== undefined && age < criteria.ageFrom) return false;
          if (criteria.ageTo !== undefined && age > criteria.ageTo) return false;
          return true;
        });
      }

      return {
        patients,
        total: count || 0
      };
    } catch (error) {
      throw new Error(`Lỗi tìm kiếm bệnh nhân: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get patient statistics
   */
  async getPatientStatistics(): Promise<{
    totalPatients: number;
    activePatients: number;
    newPatientsThisMonth: number;
    averageAge: number;
    genderDistribution: { male: number; female: number; other: number };
    fhirComplianceAverage: number;
  }> {
    try {
      // Get total and active patients
      const { count: totalPatients } = await this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      const { count: activePatients } = await this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('status', PatientStatus.ACTIVE);

      // Get new patients this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: newPatientsThisMonth } = await this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .gte('registration_date', startOfMonth.toISOString());

      // Get detailed data for calculations
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('date_of_birth, gender, fhir_compliance_score');

      if (error) {
        throw new Error(`Lỗi lấy thống kê: ${error.message}`);
      }

      // Calculate statistics
      let totalAge = 0;
      let maleCount = 0;
      let femaleCount = 0;
      let otherCount = 0;
      let totalFhirScore = 0;

      if (data) {
        for (const patient of data) {
          // Calculate age
          const birthDate = new Date(patient.date_of_birth);
          const age = new Date().getFullYear() - birthDate.getFullYear();
          totalAge += age;

          // Count gender distribution
          switch (patient.gender) {
            case 'male':
              maleCount++;
              break;
            case 'female':
              femaleCount++;
              break;
            default:
              otherCount++;
              break;
          }

          // Sum FHIR compliance scores
          totalFhirScore += patient.fhir_compliance_score || 0;
        }
      }

      const patientCount = data?.length || 0;

      return {
        totalPatients: totalPatients || 0,
        activePatients: activePatients || 0,
        newPatientsThisMonth: newPatientsThisMonth || 0,
        averageAge: patientCount > 0 ? Math.round(totalAge / patientCount) : 0,
        genderDistribution: {
          male: maleCount,
          female: femaleCount,
          other: otherCount
        },
        fhirComplianceAverage: patientCount > 0 ? Math.round(totalFhirScore / patientCount) : 0
      };
    } catch (error) {
      throw new Error(`Lỗi lấy thống kê bệnh nhân: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find patients with low FHIR compliance
   */
  async findPatientsWithLowFHIRCompliance(threshold: number = 80): Promise<Patient[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .lt('fhir_compliance_score', threshold)
        .eq('status', PatientStatus.ACTIVE);

      if (error) {
        throw new Error(`Lỗi tìm bệnh nhân có điểm FHIR thấp: ${error.message}`);
      }

      if (!data || data.length === 0) return [];

      return data.map(d => Patient.fromPersistence(d));
    } catch (error) {
      throw new Error(`Lỗi tìm bệnh nhân: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find patients without insurance
   */
  async findPatientsWithoutInsurance(): Promise<Patient[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .is('insurance_info', null)
        .eq('status', PatientStatus.ACTIVE);

      if (error) {
        throw new Error(`Lỗi tìm bệnh nhân không có bảo hiểm: ${error.message}`);
      }

      if (!data || data.length === 0) return [];

      return data.map(d => Patient.fromPersistence(d));
    } catch (error) {
      throw new Error(`Lỗi tìm bệnh nhân: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find patients with expired insurance
   */
  async findPatientsWithExpiredInsurance(): Promise<Patient[]> {
    try {
      const today = new Date().toISOString();
      
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .not('insurance_info', 'is', null)
        .lt('insurance_info->expiration_date', today)
        .eq('status', PatientStatus.ACTIVE);

      if (error) {
        throw new Error(`Lỗi tìm bệnh nhân có bảo hiểm hết hạn: ${error.message}`);
      }

      if (!data || data.length === 0) return [];

      return data.map(d => Patient.fromPersistence(d));
    } catch (error) {
      throw new Error(`Lỗi tìm bệnh nhân: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete patient (soft delete)
   */
  async delete(id: string): Promise<void> {
    try {
      // Get patient first for audit log
      const patient = await this.findById(id);
      if (!patient) {
        throw new Error('Không tìm thấy bệnh nhân để xóa');
      }

      // Soft delete by setting status to inactive
      const { error } = await this.supabase
        .from(this.tableName)
        .update({ 
          status: PatientStatus.INACTIVE,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Lỗi xóa bệnh nhân: ${error.message}`);
      }

      // Log HIPAA audit trail
      await this.logHIPAAAudit('DELETE', patient.getPatientId(), 'SYSTEM');
    } catch (error) {
      throw new Error(`Lỗi xóa bệnh nhân: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if patient exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const { count, error } = await this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('id', id);

      if (error) {
        throw new Error(`Lỗi kiểm tra tồn tại bệnh nhân: ${error.message}`);
      }

      return (count || 0) > 0;
    } catch (error) {
      throw new Error(`Lỗi kiểm tra bệnh nhân: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Log HIPAA audit trail
   */
  private async logHIPAAAudit(
    action: string,
    patientId: string,
    userId: string,
    details?: string
  ): Promise<void> {
    try {
      const auditData = {
        action,
        patient_id: patientId,
        user_id: userId,
        timestamp: new Date().toISOString(),
        details: details || null,
        ip_address: null, // Would be populated from request context
        user_agent: null  // Would be populated from request context
      };

      await this.supabase
        .from('hipaa_audit_log')
        .insert(auditData);
    } catch (error) {
      // Don't throw error for audit logging failures, but log them
      console.error('HIPAA Audit Log Error:', error);
    }
  }
}
