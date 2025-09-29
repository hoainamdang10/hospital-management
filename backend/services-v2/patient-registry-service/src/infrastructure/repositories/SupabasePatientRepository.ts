/**
 * SupabasePatientRepository - Infrastructure Repository Implementation
 * V2 Clean Architecture + DDD Implementation
 * Supabase implementation of patient repository with Vietnamese healthcare context
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern, Vietnamese Healthcare Standards, HIPAA
 */

import { OptimizedSupabaseClient } from '../../../../shared/infrastructure/database/optimized-supabase-client';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { Patient } from '../../domain/aggregates/Patient';
import { PatientId } from '../../domain/value-objects/PatientId';
import { PersonalInfo } from '../../domain/value-objects/PersonalInfo';
import { ContactInfo } from '../../domain/value-objects/ContactInfo';
import { MedicalInfo } from '../../domain/value-objects/MedicalInfo';
import { InsuranceInfo } from '../../domain/entities/InsuranceInfo';
import { EmergencyContact } from '../../domain/entities/EmergencyContact';
import { PatientConsent } from '../../domain/entities/PatientConsent';
import { MedicalHistory } from '../../domain/entities/MedicalHistory';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { IAuditService } from '../../../../shared/application/services/audit.service.interface';

export interface SupabasePatientRepositoryConfig {
  supabase: OptimizedSupabaseClient;
  logger: ILogger;
  auditService: IAuditService;
  schema: string;
  tableName: string;
}

interface PatientRecord {
  id: string;
  user_id: string;
  personal_info: any;
  contact_info: any;
  medical_info: any;
  insurance_info?: any;
  emergency_contacts: any[];
  consents: any[];
  medical_history: any[];
  registration_date: string;
  last_visit_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase Patient Repository
 * Implements patient repository with Vietnamese healthcare compliance
 */
export class SupabasePatientRepository implements IPatientRepository {
  private readonly supabaseClient: OptimizedSupabaseClient;
  private readonly logger: ILogger;
  private readonly auditService: IAuditService;
  private readonly schema: string;
  private readonly tableName: string;

  constructor(config: SupabasePatientRepositoryConfig) {
    this.supabaseClient = config.supabase;
    this.logger = config.logger;
    this.auditService = config.auditService;
    this.schema = config.schema || 'patient_schema';
    this.tableName = config.tableName || 'patient_profiles';
  }

  /**
   * Find patient by ID
   */
  async findById(patientId: PatientId): Promise<Patient | null> {
    try {
      this.logger.debug('Finding patient by ID', { patientId: patientId.value });

      const { data, error } = await this.supabaseClient
        .from(this.tableName)
        .select('*')
        .eq('id', patientId.value)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      const patient = this.mapToPatient(data);

      // HIPAA audit logging
      await this.auditService.logDataAccess(
        'READ',
        'patient',
        patientId.value,
        'SYSTEM',
        'Patient retrieved by ID'
      );

      return patient;

    } catch (error) {
      this.logger.error('Error finding patient by ID', {
        patientId: patientId.value,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Find patient by user ID
   */
  async findByUserId(userId: string): Promise<Patient | null> {
    try {
      this.logger.debug('Finding patient by user ID', { userId });

      const { data, error } = await this.supabaseClient
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      const patient = this.mapToPatient(data);

      // HIPAA audit logging
      await this.auditService.logDataAccess(
        'READ',
        'patient',
        data.id,
        'SYSTEM',
        'Patient retrieved by user ID'
      );

      return patient;

    } catch (error) {
      this.logger.error('Error finding patient by user ID', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Find patient by national ID
   */
  async findByNationalId(nationalId: string): Promise<Patient | null> {
    try {
      this.logger.debug('Finding patient by national ID', { nationalId: '***' + nationalId.slice(-4) });

      const { data, error } = await this.supabaseClient
        .from(this.tableName)
        .select('*')
        .eq('personal_info->>nationalId', nationalId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      const patient = this.mapToPatient(data);

      // HIPAA audit logging
      await this.auditService.logDataAccess(
        'READ',
        'patient',
        data.id,
        'SYSTEM',
        'Patient retrieved by national ID'
      );

      return patient;

    } catch (error) {
      this.logger.error('Error finding patient by national ID', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Save patient
   */
  async save(patient: Patient): Promise<void> {
    try {
      this.logger.debug('Saving patient', { patientId: patient.id.value });

      const persistenceData = patient.toPersistence();

      // Check if patient exists
      const existingPatient = await this.findById(patient.id);
      
      if (existingPatient) {
        // Update existing patient
        const { error } = await this.supabaseClient
          .from(this.tableName)
          .update(persistenceData)
          .eq('id', patient.id.value);

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        // HIPAA audit logging
        await this.auditService.logDataAccess(
          'UPDATE',
          'patient',
          patient.id.value,
          'SYSTEM',
          'Patient updated'
        );

      } else {
        // Insert new patient
        const { error } = await this.supabaseClient
          .from(this.tableName)
          .insert(persistenceData);

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        // HIPAA audit logging
        await this.auditService.logDataAccess(
          'CREATE',
          'patient',
          patient.id.value,
          'SYSTEM',
          'Patient created'
        );
      }

      this.logger.info('Patient saved successfully', { patientId: patient.id.value });

    } catch (error) {
      this.logger.error('Error saving patient', {
        patientId: patient.id.value,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Delete patient (soft delete)
   */
  async delete(patientId: PatientId): Promise<void> {
    try {
      this.logger.debug('Soft deleting patient', { patientId: patientId.value });

      const { error } = await this.supabaseClient
        .from(this.tableName)
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId.value);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // HIPAA audit logging
      await this.auditService.logDataAccess(
        'DELETE',
        'patient',
        patientId.value,
        'SYSTEM',
        'Patient soft deleted'
      );

      this.logger.info('Patient soft deleted successfully', { patientId: patientId.value });

    } catch (error) {
      this.logger.error('Error soft deleting patient', {
        patientId: patientId.value,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Find patients with filters
   */
  async findWithFilters(filters: any, pagination?: any): Promise<{ patients: Patient[]; total: number }> {
    try {
      this.logger.debug('Finding patients with filters', { filters, pagination });

      let query = this.supabaseClient
        .from(this.tableName)
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      if (filters.registrationDateFrom) {
        query = query.gte('registration_date', filters.registrationDateFrom);
      }

      if (filters.registrationDateTo) {
        query = query.lte('registration_date', filters.registrationDateTo);
      }

      if (filters.city) {
        query = query.eq('contact_info->>city', filters.city);
      }

      if (filters.province) {
        query = query.eq('contact_info->>province', filters.province);
      }

      // Apply pagination
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        query = query.range(offset, offset + pagination.limit - 1);
      }

      // Apply sorting
      if (pagination?.sorting) {
        query = query.order(pagination.sorting.field, { 
          ascending: pagination.sorting.direction === 'asc' 
        });
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const patients = (data || []).map(record => this.mapToPatient(record));

      // HIPAA audit logging
      await this.auditService.logDataAccess(
        'READ',
        'patient_list',
        'multiple',
        'SYSTEM',
        `Retrieved ${patients.length} patients with filters`
      );

      return {
        patients,
        total: count || 0
      };

    } catch (error) {
      this.logger.error('Error finding patients with filters', {
        filters,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Search patients by term
   */
  async searchPatients(searchTerm: string, filters?: any, pagination?: any): Promise<{ patients: Patient[]; total: number }> {
    try {
      this.logger.debug('Searching patients', { searchTerm: '***', filters, pagination });

      // This is a simplified search - in production, you'd use full-text search
      let query = this.supabaseClient
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .or(`personal_info->>fullName.ilike.%${searchTerm}%,contact_info->>phoneNumber.ilike.%${searchTerm}%`);

      // Apply additional filters
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      // Apply pagination
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        query = query.range(offset, offset + pagination.limit - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const patients = (data || []).map(record => this.mapToPatient(record));

      // HIPAA audit logging
      await this.auditService.logDataAccess(
        'READ',
        'patient_search',
        'multiple',
        'SYSTEM',
        `Searched patients with term, found ${patients.length} results`
      );

      return {
        patients,
        total: count || 0
      };

    } catch (error) {
      this.logger.error('Error searching patients', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Map database record to Patient aggregate
   */
  private mapToPatient(record: PatientRecord): Patient {
    return Patient.fromPersistence(record);
  }

  /**
   * Get repository health status
   */
  async getHealthStatus(): Promise<any> {
    try {
      const { data, error } = await this.supabaseClient
        .from(this.tableName)
        .select('count(*)')
        .limit(1);

      return {
        isHealthy: !error,
        tableName: this.tableName,
        schema: this.schema,
        lastChecked: new Date().toISOString(),
        error: error?.message
      };

    } catch (error) {
      return {
        isHealthy: false,
        tableName: this.tableName,
        schema: this.schema,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
