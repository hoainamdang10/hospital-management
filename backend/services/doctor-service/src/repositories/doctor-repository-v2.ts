/**
 * Doctor Repository v2.0 - Schema-Aware Implementation
 * Implements BaseRepository pattern with full architecture compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Microservices Architecture, FHIR
 */

import { BaseRepository, RepositoryConfig } from '@hospital/shared/dist/repositories/base-repository';
import { SupabaseClient } from '@supabase/supabase-js';
import logger from '@hospital/shared/dist/utils/logger';

// Doctor entity interface
export interface Doctor {
  doctor_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  specialization: string;
  license_number: string;
  department_id: string;
  years_of_experience: number;
  education: string;
  certifications: string[];
  languages_spoken: string[];
  consultation_fee: number;
  is_available: boolean;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface DoctorSearchFilters {
  specialization?: string;
  department_id?: string;
  is_available?: boolean;
  status?: string;
  min_experience?: number;
  max_consultation_fee?: number;
  languages?: string[];
}

export interface DoctorWithProfile extends Doctor {
  profile?: {
    id: string;
    email: string;
    full_name: string;
    phone_number: string;
    is_active: boolean;
  };
}

/**
 * Schema-aware Doctor Repository with full compliance validation
 */
export class DoctorRepositoryV2 extends BaseRepository<Doctor> {
  constructor() {
    const config: RepositoryConfig = {
      serviceName: 'doctor-service',
      schemaName: 'doctor_schema',
      enableFHIRValidation: true,
      enableAuditLogging: true,
      enablePerformanceMonitoring: true
    };
    
    super(config);
    
    logger.info('DoctorRepositoryV2 initialized with schema-aware configuration', {
      serviceName: config.serviceName,
      schemaName: config.schemaName,
      compliance: 'HIPAA+FHIR'
    });
  }

  /**
   * Find doctor by ID with FHIR compliance
   */
  async findById(doctorId: string): Promise<Doctor | null> {
    return this.executeFHIRQuery(
      'doctor_profiles',
      async (client: SupabaseClient) => {
        const { data, error } = await client
          .from('doctor_profiles')
          .select('*')
          .eq('doctor_id', doctorId)
          .eq('status', 'active')
          .single();

        if (error) {
          if (error.code === 'PGRST116') return null; // Not found
          throw error;
        }

        return this.mapSupabaseDoctorToDoctor(data);
      },
      {
        resourceType: 'Practitioner',
        providerId: doctorId,
        accessReason: 'Doctor profile lookup for healthcare operations'
      }
    );
  }

  /**
   * Find all doctors with pagination and filtering
   */
  async findAll(limit: number = 50, offset: number = 0): Promise<Doctor[]> {
    return this.executeQuery(
      'doctor_profiles',
      async (client: SupabaseClient) => {
        const { data, error } = await client
          .from('doctor_profiles')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        return data?.map(this.mapSupabaseDoctorToDoctor) || [];
      },
      {
        operation: 'SELECT_ALL_DOCTORS',
        auditData: [`limit:${limit}`, `offset:${offset}`]
      }
    );
  }

  /**
   * Search doctors with advanced filtering
   */
  async searchDoctors(
    filters: DoctorSearchFilters,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ doctors: Doctor[]; total: number }> {
    return this.executeQuery(
      'doctor_profiles',
      async (client: SupabaseClient) => {
        let query = client
          .from('doctor_profiles')
          .select('*', { count: 'exact' })
          .eq('status', 'active');

        // Apply filters
        if (filters.specialization) {
          query = query.eq('specialization', filters.specialization);
        }
        
        if (filters.department_id) {
          query = query.eq('department_id', filters.department_id);
        }
        
        if (filters.is_available !== undefined) {
          query = query.eq('is_available', filters.is_available);
        }
        
        if (filters.min_experience) {
          query = query.gte('years_of_experience', filters.min_experience);
        }
        
        if (filters.max_consultation_fee) {
          query = query.lte('consultation_fee', filters.max_consultation_fee);
        }
        
        if (filters.languages && filters.languages.length > 0) {
          query = query.overlaps('languages_spoken', filters.languages);
        }

        const { data, error, count } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        return {
          doctors: data?.map(this.mapSupabaseDoctorToDoctor) || [],
          total: count || 0
        };
      },
      {
        operation: 'SEARCH_DOCTORS',
        auditData: [
          `filters:${JSON.stringify(filters)}`,
          `limit:${limit}`,
          `offset:${offset}`
        ]
      }
    );
  }

  /**
   * Create new doctor with profile validation
   */
  async create(doctorData: Partial<Doctor>): Promise<Doctor> {
    // Validate required fields
    this.validateDoctorData(doctorData);
    
    return this.executeFHIRQuery(
      'doctor_profiles',
      async (client: SupabaseClient) => {
        // Generate doctor ID
        const doctorId = await this.generateDoctorId(doctorData.department_id!);
        
        const doctorRecord = {
          doctor_id: doctorId,
          user_id: doctorData.user_id,
          full_name: doctorData.full_name,
          email: doctorData.email,
          phone_number: doctorData.phone_number,
          specialization: doctorData.specialization,
          license_number: doctorData.license_number,
          department_id: doctorData.department_id,
          years_of_experience: doctorData.years_of_experience || 0,
          education: doctorData.education || '',
          certifications: doctorData.certifications || [],
          languages_spoken: doctorData.languages_spoken || ['Vietnamese'],
          consultation_fee: doctorData.consultation_fee || 0,
          is_available: doctorData.is_available ?? true,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data, error } = await client
          .from('doctor_profiles')
          .insert(doctorRecord)
          .select()
          .single();

        if (error) throw error;

        return this.mapSupabaseDoctorToDoctor(data);
      },
      {
        resourceType: 'Practitioner',
        providerId: doctorData.user_id,
        accessReason: 'Creating new doctor profile for healthcare system'
      }
    );
  }

  /**
   * Update doctor information
   */
  async update(doctorId: string, updateData: Partial<Doctor>): Promise<Doctor | null> {
    return this.executeFHIRQuery(
      'doctor_profiles',
      async (client: SupabaseClient) => {
        const updateRecord = {
          ...updateData,
          updated_at: new Date().toISOString()
        };

        // Remove fields that shouldn't be updated
        delete updateRecord.doctor_id;
        delete updateRecord.created_at;

        const { data, error } = await client
          .from('doctor_profiles')
          .update(updateRecord)
          .eq('doctor_id', doctorId)
          .eq('status', 'active')
          .select()
          .single();

        if (error) {
          if (error.code === 'PGRST116') return null; // Not found
          throw error;
        }

        return this.mapSupabaseDoctorToDoctor(data);
      },
      {
        resourceType: 'Practitioner',
        providerId: doctorId,
        accessReason: 'Updating doctor profile information'
      }
    );
  }

  /**
   * Soft delete doctor (set status to inactive)
   */
  async delete(doctorId: string): Promise<boolean> {
    return this.executeFHIRQuery(
      'doctor_profiles',
      async (client: SupabaseClient) => {
        const { error } = await client
          .from('doctor_profiles')
          .update({ 
            status: 'inactive',
            updated_at: new Date().toISOString()
          })
          .eq('doctor_id', doctorId);

        if (error) throw error;

        return true;
      },
      {
        resourceType: 'Practitioner',
        providerId: doctorId,
        accessReason: 'Deactivating doctor profile (soft delete)'
      }
    );
  }

  /**
   * Find doctor by user profile ID (cross-schema access)
   */
  async findByProfileId(profileId: string): Promise<Doctor | null> {
    return this.executeQuery(
      'doctor_profiles',
      async (client: SupabaseClient) => {
        const { data, error } = await client
          .from('doctor_profiles')
          .select('*')
          .eq('user_id', profileId)
          .eq('status', 'active')
          .single();

        if (error) {
          if (error.code === 'PGRST116') return null;
          throw error;
        }

        return this.mapSupabaseDoctorToDoctor(data);
      },
      {
        operation: 'FIND_BY_PROFILE_ID',
        recordId: profileId,
        auditData: ['cross_schema_lookup:auth_schema.profiles']
      }
    );
  }

  /**
   * Get doctor availability status
   */
  async getDoctorAvailability(doctorId: string): Promise<{
    isAvailable: boolean;
    nextAvailableSlot?: string;
    currentAppointments: number;
  }> {
    return this.executeQuery(
      'doctor_profiles',
      async (client: SupabaseClient) => {
        const { data: doctor, error } = await client
          .from('doctor_profiles')
          .select('is_available')
          .eq('doctor_id', doctorId)
          .single();

        if (error) throw error;

        // Note: In a real implementation, this would also check appointment_schema
        // through API Gateway communication, not direct database access
        
        return {
          isAvailable: doctor.is_available,
          nextAvailableSlot: undefined, // Would be fetched via API Gateway
          currentAppointments: 0 // Would be fetched via API Gateway
        };
      },
      {
        operation: 'CHECK_AVAILABILITY',
        recordId: doctorId
      }
    );
  }

  // Private helper methods
  private validateDoctorData(doctorData: Partial<Doctor>): void {
    const required = ['user_id', 'full_name', 'email', 'specialization', 'license_number', 'department_id'];
    
    for (const field of required) {
      if (!doctorData[field as keyof Doctor]) {
        throw new Error(`Trường bắt buộc '${field}' không được để trống`);
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (doctorData.email && !emailRegex.test(doctorData.email)) {
      throw new Error('Định dạng email không hợp lệ');
    }

    // Validate phone number (Vietnamese format)
    const phoneRegex = /^0[0-9]{9}$/;
    if (doctorData.phone_number && !phoneRegex.test(doctorData.phone_number)) {
      throw new Error('Số điện thoại phải có 10 chữ số và bắt đầu bằng 0');
    }

    // Validate license number format
    const licenseRegex = /^VN-[A-Z]{2}-[0-9]{4}$/;
    if (doctorData.license_number && !licenseRegex.test(doctorData.license_number)) {
      throw new Error('Số giấy phép hành nghề phải có định dạng VN-XX-XXXX');
    }
  }

  private async generateDoctorId(departmentId: string): Promise<string> {
    // Generate department-based doctor ID: DEPT-DOC-YYYYMM-XXX
    const now = new Date();
    const yearMonth = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0');
    
    // Get department code (first 4 characters)
    const deptCode = departmentId.substring(0, 4).toUpperCase();
    
    // Get next sequence number for this month
    const sequence = await this.getNextDoctorSequence(deptCode, yearMonth);
    
    return `${deptCode}-DOC-${yearMonth}-${sequence.toString().padStart(3, '0')}`;
  }

  private async getNextDoctorSequence(deptCode: string, yearMonth: string): Promise<number> {
    return this.executeQuery(
      'doctor_profiles',
      async (client: SupabaseClient) => {
        const { data, error } = await client
          .from('doctor_profiles')
          .select('doctor_id')
          .like('doctor_id', `${deptCode}-DOC-${yearMonth}-%`)
          .order('doctor_id', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const lastId = data[0].doctor_id;
          const lastSequence = parseInt(lastId.split('-').pop() || '0');
          return lastSequence + 1;
        }

        return 1; // First doctor for this department/month
      },
      {
        operation: 'GET_NEXT_SEQUENCE',
        auditData: [`deptCode:${deptCode}`, `yearMonth:${yearMonth}`]
      }
    );
  }

  private mapSupabaseDoctorToDoctor(data: any): Doctor {
    return {
      doctor_id: data.doctor_id,
      user_id: data.user_id,
      full_name: data.full_name,
      email: data.email,
      phone_number: data.phone_number,
      specialization: data.specialization,
      license_number: data.license_number,
      department_id: data.department_id,
      years_of_experience: data.years_of_experience,
      education: data.education,
      certifications: data.certifications || [],
      languages_spoken: data.languages_spoken || [],
      consultation_fee: data.consultation_fee,
      is_available: data.is_available,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }
}

export default DoctorRepositoryV2;
