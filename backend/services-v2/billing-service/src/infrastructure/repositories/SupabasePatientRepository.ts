/**
 * SupabasePatientRepository - Patient repository implementation for Billing Service
 * Provides patient data access for billing operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD
 */

import { Patient, IPatientRepository } from '@domain/entities/Patient';
import { logger } from '@infrastructure/logging/logger';
import { OptimizedSupabaseClient } from '@shared/infrastructure/database/optimized-supabase-client';

export interface PatientData {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  national_id: string;
  phone?: string;
  email?: string;
  address?: string;
  insurance_info?: any;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

/**
 * SupabasePatientRepository - Implementation for Supabase database
 */
export class SupabasePatientRepository implements IPatientRepository {
  constructor(
    private supabase: OptimizedSupabaseClient,
    private loggerInstance: typeof logger,
  ) {}

  /**
   * Find patient by ID
   */
  async findById(id: string): Promise<Patient | null> {
    try {
      this.loggerInstance.debug('Finding patient by ID', { patientId: id });

      const { data, error } = await this.supabase.getRawClient()
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      if (!data) {
        return null;
      }

      return this.mapToPatient(data as PatientData);

    } catch (error) {
      this.loggerInstance.error('Failed to find patient by ID', {
        patientId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Find patient by user ID
   */
  async findByUserId(userId: string): Promise<Patient | null> {
    try {
      this.loggerInstance.debug('Finding patient by user ID', { userId });

      const { data, error } = await this.supabase.getRawClient()
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      if (!data) {
        return null;
      }

      return this.mapToPatient(data as PatientData);

    } catch (error) {
      this.loggerInstance.error('Failed to find patient by user ID', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Find patient by national ID
   */
  async findByNationalId(nationalId: string): Promise<Patient | null> {
    try {
      this.loggerInstance.debug('Finding patient by national ID', { nationalId });

      const { data, error } = await this.supabase.getRawClient()
        .from('patients')
        .select('*')
        .eq('national_id', nationalId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      if (!data) {
        return null;
      }

      return this.mapToPatient(data as PatientData);

    } catch (error) {
      this.loggerInstance.error('Failed to find patient by national ID', {
        nationalId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Check if patient exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      this.loggerInstance.debug('Checking if patient exists', { patientId: id });

      const { data, error } = await this.supabase.getRawClient()
        .from('patients')
        .select('id')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return false;
        }
        throw error;
      }

      return data !== null;

    } catch (error) {
      this.loggerInstance.error('Failed to check patient existence', {
        patientId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get patient insurance information
   */
  async getInsuranceInfo(patientId: string): Promise<any | null> {
    try {
      this.loggerInstance.debug('Getting patient insurance info', { patientId });

      const { data, error } = await this.supabase.getRawClient()
        .from('patients')
        .select('insurance_info')
        .eq('id', patientId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data?.insurance_info || null;

    } catch (error) {
      this.loggerInstance.error('Failed to get patient insurance info', {
        patientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update patient insurance information
   */
  async updateInsuranceInfo(patientId: string, insuranceInfo: any): Promise<void> {
    try {
      this.loggerInstance.debug('Updating patient insurance info', { patientId });

      const { error } = await this.supabase.getRawClient()
        .from('patients')
        .update({
          insurance_info: insuranceInfo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', patientId);

      if (error) {
        throw error;
      }

      this.loggerInstance.info('Patient insurance info updated', { patientId });

    } catch (error) {
      this.loggerInstance.error('Failed to update patient insurance info', {
        patientId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Map database record to Patient entity
   */
  private mapToPatient(data: PatientData): Patient {
    return {
      id: data.id,
      userId: data.user_id,
      fullName: data.full_name,
      dateOfBirth: new Date(data.date_of_birth),
      gender: data.gender,
      nationalId: data.national_id,
      phone: data.phone,
      email: data.email,
      address: data.address,
      insuranceInfo: data.insurance_info,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      isActive: data.is_active,
    };
  }
}

// Default constructor for dependency injection
export function createSupabasePatientRepository(
  supabase: OptimizedSupabaseClient,
  loggerInstance: typeof logger,
): SupabasePatientRepository {
  return new SupabasePatientRepository(supabase, loggerInstance);
}
