/**
 * Supabase Provider Staff Repository Implementation
 * Clean Architecture + DDD Implementation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IProviderStaffRepository } from '../../application/repositories/IProviderStaffRepository';
import { ProviderStaff, ProviderStaffPersistenceProps, StaffType } from '../../domain/aggregates/ProviderStaff';
import { StaffId } from '../../domain/value-objects/StaffId';
import { PersonalInfo } from '../../domain/value-objects/PersonalInfo';
import { ProfessionalInfo } from '../../domain/value-objects/ProfessionalInfo';

export class SupabaseProviderStaffRepository implements IProviderStaffRepository {
  private supabaseClient: SupabaseClient;
  private readonly tableName = 'staff_profiles'; // ✅ Match database table name
  private readonly schemaName = 'provider_schema';

  constructor(
    supabaseUrl: string,
    supabaseKey: string
  ) {
    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: this.schemaName,
      },
      global: {
        headers: {
          'X-Client-Info': 'provider-staff-service',
        },
      },
    }) as any;
  }

  /**
   * Find staff by ID (business identifier)
   */
  async findById(staffId: StaffId): Promise<ProviderStaff | null> {
    try {
      const { data, error } = await this.supabaseClient
        .from(this.tableName)
        .select('*')
        .eq('staff_id', staffId.value) // Query by business ID (STF-YYYYMM-XXX)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Error finding staff: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      return this.toDomain(data as ProviderStaffPersistenceProps);
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  }

  /**
   * Save new staff member
   */
  async save(staff: ProviderStaff): Promise<void> {
    try {
      const persistenceData = staff.toPersistence();

      const { error } = await this.supabaseClient
        .from(this.tableName)
        .insert(persistenceData);

      if (error) {
        throw new Error(`Error saving staff: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in save:', error);
      throw error;
    }
  }

  /**
   * Update existing staff member
   */
  async update(staff: ProviderStaff): Promise<void> {
    try {
      const persistenceData = staff.toPersistence();

      const { error } = await this.supabaseClient
        .from(this.tableName)
        .update(persistenceData)
        .eq('id', staff.id);

      if (error) {
        throw new Error(`Error updating staff: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  /**
   * Delete staff member
   */
  async delete(staffId: StaffId): Promise<void> {
    try {
      const { error} = await this.supabaseClient
        .from(this.tableName)
        .delete()
        .eq('id', staffId.value);

      if (error) {
        throw new Error(`Error deleting staff: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  /**
   * Find all staff members
   */
  async findAll(): Promise<ProviderStaff[]> {
    try {
      const { data, error } = await this.supabaseClient
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error finding all staff: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map(item => this.toDomain(item as ProviderStaffPersistenceProps));
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  /**
   * Find staff by type
   */
  async findByType(staffType: string): Promise<ProviderStaff[]> {
    try {
      const { data, error } = await this.supabaseClient
        .from(this.tableName)
        .select('*')
        .eq('staff_type', staffType)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error finding staff by type: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map(item => this.toDomain(item as ProviderStaffPersistenceProps));
    } catch (error) {
      console.error('Error in findByType:', error);
      throw error;
    }
  }

  /**
   * Check if staff exists
   */
  async exists(staffId: StaffId): Promise<boolean> {
    try {
      const staff = await this.findById(staffId);
      return staff !== null;
    } catch (error) {
      console.error('Error in exists:', error);
      return false;
    }
  }

  /**
   * Convert persistence data to domain model
   * Maps from staff_profiles table schema to domain model
   */
  private toDomain(data: ProviderStaffPersistenceProps): ProviderStaff {
    const personalInfo = PersonalInfo.create({
      fullName: data.personal_info.full_name,
      citizenId: data.personal_info.citizen_id,
      dateOfBirth: data.personal_info.date_of_birth ? new Date(data.personal_info.date_of_birth) : undefined,
      gender: data.personal_info.gender as 'male' | 'female' | 'other' | undefined,
      phoneNumber: data.personal_info.phone_number,
      email: data.personal_info.email,
      address: data.personal_info.address
    });

    const professionalInfo = ProfessionalInfo.create({
      licenseNumber: data.professional_info.license_number,
      specialization: data.professional_info.specialization,
      yearsOfExperience: data.professional_info.years_of_experience,
      qualifications: data.professional_info.qualifications,
      certifications: data.professional_info.certifications
    });

    return ProviderStaff.reconstitute(
      data.id, // Technical ID (UUID)
      data.staff_id, // Business ID (STF-YYYYMM-XXX)
      personalInfo,
      professionalInfo,
      data.staff_type as StaffType,
      data.is_active,
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }
}

