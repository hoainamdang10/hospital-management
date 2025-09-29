/**
 * Supabase Doctor Repository - Infrastructure Layer
 * Repository implementation for doctor persistence with Supabase integration
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Repository Pattern, HIPAA, Supabase Integration
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { IDoctorRepository, DoctorSearchResult } from '../../domain/repositories/doctor.repository';
import { Doctor } from '../../domain/aggregates/doctor.aggregate';
import { DoctorId } from '../../domain/value-objects/doctor-id';
import { Specification } from '../../domain/specifications/provider-search.specification';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';
import { IAuditService } from '../../../shared/application/services/audit.service.interface';

export interface SupabaseDoctorRepositoryConfig {
  supabase: SupabaseClient;
  logger: ILogger;
  auditService: IAuditService;
  schema: string;
  tableName: string;
}

/**
 * Supabase Doctor Repository
 * Implements doctor persistence using Supabase with healthcare compliance
 */
export class SupabaseDoctorRepository implements IDoctorRepository {
  private readonly supabase: SupabaseClient;
  private readonly logger: ILogger;
  private readonly auditService: IAuditService;
  private readonly schema: string;
  private readonly tableName: string;

  constructor(config: SupabaseDoctorRepositoryConfig) {
    this.supabase = config.supabase;
    this.logger = config.logger;
    this.auditService = config.auditService;
    this.schema = config.schema || 'provider_schema';
    this.tableName = config.tableName || 'doctors';
  }

  /**
   * Save doctor to database
   */
  async save(doctor: Doctor): Promise<void> {
    try {
      this.logger.info('Saving doctor to database', {
        doctorId: doctor.doctorId.value,
        department: doctor.department,
        status: doctor.status
      });

      const doctorData = doctor.toPersistence();

      // Use upsert to handle both create and update
      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .upsert(doctorData, {
          onConflict: 'doctor_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        this.logger.error('Error saving doctor to database', {
          doctorId: doctor.doctorId.value,
          error: error.message,
          details: error.details
        });

        throw new Error(`Lỗi lưu thông tin bác sĩ: ${error.message}`);
      }

      // Audit logging
      await this.auditService.logDoctorDataChange(
        doctor.doctorId.value,
        'SYSTEM',
        doctor.id ? 'Doctor updated' : 'Doctor created',
        {
          operation: doctor.id ? 'UPDATE' : 'CREATE',
          department: doctor.department,
          status: doctor.status
        }
      );

      this.logger.info('Doctor saved successfully', {
        doctorId: doctor.doctorId.value,
        databaseId: data.id
      });

    } catch (error) {
      this.logger.error('Error in save doctor', {
        doctorId: doctor.doctorId.value,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Find doctor by ID
   */
  async findById(id: string): Promise<Doctor | null> {
    try {
      this.logger.debug('Finding doctor by ID', { id });

      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }

        this.logger.error('Error finding doctor by ID', {
          id,
          error: error.message
        });

        throw new Error(`Lỗi tìm bác sĩ: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      const doctor = Doctor.fromPersistence(data);

      this.logger.debug('Doctor found by ID', {
        id,
        doctorId: doctor.doctorId.value
      });

      return doctor;

    } catch (error) {
      this.logger.error('Error in findById', {
        id,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Find doctor by doctor ID
   */
  async findByDoctorId(doctorId: string): Promise<Doctor | null> {
    try {
      this.logger.debug('Finding doctor by doctor ID', { doctorId });

      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .eq('doctor_id', doctorId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }

        this.logger.error('Error finding doctor by doctor ID', {
          doctorId,
          error: error.message
        });

        throw new Error(`Lỗi tìm bác sĩ: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      const doctor = Doctor.fromPersistence(data);

      this.logger.debug('Doctor found by doctor ID', {
        doctorId,
        id: doctor.id
      });

      return doctor;

    } catch (error) {
      this.logger.error('Error in findByDoctorId', {
        doctorId,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Find doctor by email
   */
  async findByEmail(email: string): Promise<Doctor | null> {
    try {
      this.logger.debug('Finding doctor by email', { email: this.maskEmail(email) });

      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }

        this.logger.error('Error finding doctor by email', {
          email: this.maskEmail(email),
          error: error.message
        });

        throw new Error(`Lỗi tìm bác sĩ: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      const doctor = Doctor.fromPersistence(data);

      this.logger.debug('Doctor found by email', {
        email: this.maskEmail(email),
        doctorId: doctor.doctorId.value
      });

      return doctor;

    } catch (error) {
      this.logger.error('Error in findByEmail', {
        email: this.maskEmail(email),
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Find doctor by national ID
   */
  async findByNationalId(nationalId: string): Promise<Doctor | null> {
    try {
      this.logger.debug('Finding doctor by national ID', { 
        nationalId: this.maskNationalId(nationalId) 
      });

      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .eq('national_id', nationalId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }

        this.logger.error('Error finding doctor by national ID', {
          nationalId: this.maskNationalId(nationalId),
          error: error.message
        });

        throw new Error(`Lỗi tìm bác sĩ: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      const doctor = Doctor.fromPersistence(data);

      this.logger.debug('Doctor found by national ID', {
        nationalId: this.maskNationalId(nationalId),
        doctorId: doctor.doctorId.value
      });

      return doctor;

    } catch (error) {
      this.logger.error('Error in findByNationalId', {
        nationalId: this.maskNationalId(nationalId),
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Find doctors by department
   */
  async findByDepartment(department: string): Promise<Doctor[]> {
    try {
      this.logger.debug('Finding doctors by department', { department });

      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .eq('department', department)
        .order('full_name', { ascending: true });

      if (error) {
        this.logger.error('Error finding doctors by department', {
          department,
          error: error.message
        });

        throw new Error(`Lỗi tìm bác sĩ theo khoa: ${error.message}`);
      }

      const doctors = (data || []).map(item => Doctor.fromPersistence(item));

      this.logger.debug('Doctors found by department', {
        department,
        count: doctors.length
      });

      return doctors;

    } catch (error) {
      this.logger.error('Error in findByDepartment', {
        department,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Find active doctors
   */
  async findActiveDoctors(): Promise<Doctor[]> {
    try {
      this.logger.debug('Finding active doctors');

      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .eq('status', 'active')
        .order('full_name', { ascending: true });

      if (error) {
        this.logger.error('Error finding active doctors', {
          error: error.message
        });

        throw new Error(`Lỗi tìm bác sĩ đang hoạt động: ${error.message}`);
      }

      const doctors = (data || []).map(item => Doctor.fromPersistence(item));

      this.logger.debug('Active doctors found', {
        count: doctors.length
      });

      return doctors;

    } catch (error) {
      this.logger.error('Error in findActiveDoctors', {
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Search doctors with specification pattern
   */
  async searchDoctors(
    specification: Specification<any>,
    searchTerm?: string,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'full_name',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<DoctorSearchResult> {
    try {
      this.logger.info('Searching doctors', {
        searchTerm,
        page,
        pageSize,
        sortBy,
        sortOrder
      });

      // Build base query
      let query = this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('*', { count: 'exact' });

      // Apply search term if provided
      if (searchTerm && searchTerm.trim().length > 0) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,doctor_id.ilike.%${searchTerm}%`);
      }

      // Apply sorting
      query = query.order(this.mapSortField(sortBy), { ascending: sortOrder === 'asc' });

      // Apply pagination
      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        this.logger.error('Error searching doctors', {
          error: error.message,
          searchTerm,
          page,
          pageSize
        });

        throw new Error(`Lỗi tìm kiếm bác sĩ: ${error.message}`);
      }

      // Convert to domain objects
      const allDoctors = (data || []).map(item => Doctor.fromPersistence(item));

      // Apply specification filter (in-memory for complex business rules)
      const filteredDoctors = allDoctors.filter(doctor => {
        const candidate = this.mapDoctorToSearchCandidate(doctor);
        return specification.isSatisfiedBy(candidate);
      });

      // Calculate summary statistics
      const summary = await this.calculateSearchSummary(allDoctors);

      const result: DoctorSearchResult = {
        doctors: filteredDoctors,
        totalCount: count || 0,
        summary
      };

      this.logger.info('Doctor search completed', {
        totalCount: result.totalCount,
        filteredCount: filteredDoctors.length,
        page,
        pageSize
      });

      return result;

    } catch (error) {
      this.logger.error('Error in searchDoctors', {
        searchTerm,
        page,
        pageSize,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Delete doctor
   */
  async delete(doctorId: DoctorId): Promise<void> {
    try {
      this.logger.info('Deleting doctor', {
        doctorId: doctorId.value
      });

      const { error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .delete()
        .eq('doctor_id', doctorId.value);

      if (error) {
        this.logger.error('Error deleting doctor', {
          doctorId: doctorId.value,
          error: error.message
        });

        throw new Error(`Lỗi xóa bác sĩ: ${error.message}`);
      }

      // Audit logging
      await this.auditService.logDoctorDataChange(
        doctorId.value,
        'SYSTEM',
        'Doctor deleted',
        {
          operation: 'DELETE'
        }
      );

      this.logger.info('Doctor deleted successfully', {
        doctorId: doctorId.value
      });

    } catch (error) {
      this.logger.error('Error in delete', {
        doctorId: doctorId.value,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Check if doctor exists
   */
  async exists(doctorId: DoctorId): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('id')
        .eq('doctor_id', doctorId.value)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Lỗi kiểm tra tồn tại bác sĩ: ${error.message}`);
      }

      return !!data;

    } catch (error) {
      this.logger.error('Error in exists', {
        doctorId: doctorId.value,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private mapSortField(sortBy: string): string {
    const fieldMap: { [key: string]: string } = {
      'fullName': 'full_name',
      'department': 'department',
      'competencyScore': 'competency_score',
      'hireDate': 'hire_date',
      'lastActiveDate': 'last_active_date',
      'status': 'status'
    };

    return fieldMap[sortBy] || 'full_name';
  }

  private mapDoctorToSearchCandidate(doctor: Doctor): any {
    return {
      id: doctor.id!,
      fullName: doctor.personalInfo.fullName,
      providerType: 'doctor',
      department: doctor.department,
      specializations: doctor.credentials.specializations,
      yearsOfExperience: doctor.credentials.getYearsOfExperience(),
      isLicenseValid: doctor.credentials.isLicenseValid(),
      isAvailable: doctor.isActive(),
      competencyScore: doctor.competencyScore,
      canWorkNightShifts: doctor.workSchedule.nightShiftCapable,
      canWorkWeekends: doctor.workSchedule.weekendAvailability,
      canPerformSurgery: doctor.canTreatPatientType(0, 'surgery'),
      canTreatPediatric: doctor.credentials.specializations.includes('PEDIATRICS'),
      canWorkInEmergency: doctor.credentials.canWorkInEmergency(),
      maxPatientsPerShift: 20,
      currentPatientLoad: doctor.performanceMetrics.totalPatientsThisMonth,
      lastWorkDate: doctor.lastActiveDate,
      vacationDaysRemaining: doctor.workSchedule.getRemainingVacationDays(),
      isOnVacation: doctor.workSchedule.isOnVacation(new Date()),
      emergencyContactAvailable: !!doctor.personalInfo.emergencyContact.phone
    };
  }

  private async calculateSearchSummary(doctors: Doctor[]): Promise<any> {
    const activeDoctors = doctors.filter(d => d.isActive()).length;
    const inactiveDoctors = doctors.length - activeDoctors;
    
    const totalCompetencyScore = doctors.reduce((sum, d) => sum + d.competencyScore, 0);
    const averageCompetencyScore = doctors.length > 0 ? totalCompetencyScore / doctors.length : 0;

    const departmentDistribution: { [key: string]: number } = {};
    const specializationDistribution: { [key: string]: number } = {};

    doctors.forEach(doctor => {
      // Department distribution
      departmentDistribution[doctor.department] = (departmentDistribution[doctor.department] || 0) + 1;

      // Specialization distribution
      doctor.credentials.specializations.forEach(spec => {
        specializationDistribution[spec] = (specializationDistribution[spec] || 0) + 1;
      });
    });

    return {
      activeDoctors,
      inactiveDoctors,
      averageCompetencyScore: Math.round(averageCompetencyScore * 100) / 100,
      departmentDistribution,
      specializationDistribution
    };
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local.charAt(0)}***@${domain}`;
  }

  private maskNationalId(nationalId: string): string {
    return `${nationalId.substring(0, 3)}***${nationalId.substring(nationalId.length - 3)}`;
  }
}
