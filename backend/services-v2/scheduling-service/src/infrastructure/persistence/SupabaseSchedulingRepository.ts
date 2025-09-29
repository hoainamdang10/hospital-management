/**
 * Supabase Scheduling Repository - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Implements appointment persistence with Supabase and Vietnamese healthcare optimization
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ISchedulingRepository } from '../../application/interfaces/ISchedulingRepository';
import { Appointment, AppointmentStatus } from '../../domain/aggregates/scheduling.aggregate';
import { AppointmentId, AppointmentType, AppointmentPriority } from '../../domain/value-objects/AppointmentId';
import { PatientInfo } from '../../domain/value-objects/PatientInfo';
import { ProviderInfo, ProviderType, ProviderStatus } from '../../domain/value-objects/ProviderInfo';
import { TimeSlot, TimeSlotStatus } from '../../domain/value-objects/TimeSlot';
import { AppointmentDetails, AppointmentReason } from '../../domain/value-objects/AppointmentDetails';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';
import { IAuditService } from '../../../shared/application/services/audit.service.interface';

export interface SupabaseAppointmentRepositoryConfig {
  supabase: SupabaseClient;
  logger: ILogger;
  auditService: IAuditService;
  schema: string;
  tableName: string;
}

/**
 * Supabase Scheduling Repository
 * Implements appointment persistence with Vietnamese healthcare compliance
 */
export class SupabaseSchedulingRepository implements ISchedulingRepository {
  private readonly supabase: SupabaseClient;
  private readonly logger: ILogger;
  private readonly auditService: IAuditService;
  private readonly schema: string;
  private readonly tableName: string;

  constructor(config: SupabaseAppointmentRepositoryConfig) {
    this.supabase = config.supabase;
    this.logger = config.logger;
    this.auditService = config.auditService;
    this.schema = config.schema || 'scheduling_schema';
    this.tableName = config.tableName || 'appointments';
  }

  /**
   * Save appointment aggregate
   */
  async save(appointment: Appointment): Promise<void> {
    try {
      this.logger.info('Saving appointment to database', {
        appointmentId: appointment.appointmentId.value,
        patientId: appointment.patient.patientId,
        providerId: appointment.provider.providerId,
        status: appointment.status
      });

      const appointmentData = this.toPersistence(appointment);

      // Use upsert to handle both create and update
      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .upsert(appointmentData, {
          onConflict: 'appointment_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        this.logger.error('Error saving appointment to database', {
          appointmentId: appointment.appointmentId.value,
          error: error.message,
          details: error.details
        });

        throw new Error(`Lỗi lưu lịch hẹn: ${error.message}`);
      }

      // HIPAA audit logging
      await this.auditService.logAppointmentAccess(
        'SAVE',
        appointment.appointmentId.value,
        'SYSTEM',
        'Appointment saved to database',
        {
          patientId: appointment.patient.patientId,
          providerId: appointment.provider.providerId,
          status: appointment.status
        }
      );

      this.logger.info('Appointment saved successfully', {
        appointmentId: appointment.appointmentId.value,
        id: data?.id
      });

    } catch (error) {
      this.logger.error('Error saving appointment', {
        appointmentId: appointment.appointmentId.value,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new Error(`Lỗi lưu lịch hẹn: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find appointment by ID
   */
  async findById(id: string): Promise<Appointment | null> {
    try {
      this.logger.info('Finding appointment by ID', { id });

      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Lỗi truy vấn database: ${error.message}`);
      }

      if (!data) return null;

      // HIPAA audit logging
      await this.auditService.logAppointmentAccess(
        'READ',
        data.appointment_id,
        'SYSTEM',
        'Appointment retrieved by ID',
        { id }
      );

      return this.toDomain(data);

    } catch (error) {
      this.logger.error('Error finding appointment by ID', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new Error(`Lỗi tìm lịch hẹn: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find appointment by appointment ID
   */
  async findByAppointmentId(appointmentId: string): Promise<Appointment | null> {
    try {
      const { data, error } = await this.client.query()
        .from(this.tableName)
        .select('*')
        .eq('appointment_id', appointmentId)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Lỗi truy vấn database: ${error.message}`);
      }

      return data ? this.toDomain(data) : null;

    } catch (error) {
      throw new Error(`Lỗi tìm appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find appointments by patient ID
   */
  async findByPatientId(patientId: string): Promise<Appointment[]> {
    return await this.findAggregatesWithFilters(
      { patient_id: patientId, deleted_at: null },
      'start_time',
      false // Most recent first
    );
  }

  /**
   * Find appointments by provider ID
   */
  async findByProviderId(providerId: string): Promise<Appointment[]> {
    return await this.findAggregatesWithFilters(
      { provider_id: providerId, deleted_at: null },
      'start_time',
      true // Chronological order
    );
  }

  /**
   * Find appointments by provider and date
   */
  async findByProviderAndDate(providerId: string, date: Date): Promise<Appointment[]> {
    try {
      this.logger.info('Finding appointments by provider and date', {
        providerId,
        date: date.toISOString()
      });

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .eq('provider_id', providerId)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .is('deleted_at', null)
        .order('start_time', { ascending: true });

      if (error) {
        throw new Error(`Lỗi truy vấn database: ${error.message}`);
      }

      const appointments = data ? data.map(item => this.toDomain(item)) : [];

      // HIPAA audit logging
      await this.auditService.logAppointmentAccess(
        'READ',
        'MULTIPLE',
        'SYSTEM',
        'Appointments retrieved by provider and date',
        { providerId, date: date.toISOString(), count: appointments.length }
      );

      return appointments;

    } catch (error) {
      this.logger.error('Error finding appointments by provider and date', {
        providerId,
        date: date.toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new Error(`Lỗi tìm lịch hẹn: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find appointments by provider and time range (for conflict checking)
   */
  async findByProviderAndTimeRange(providerId: string, startTime: Date, endTime: Date): Promise<Appointment[]> {
    try {
      this.logger.info('Finding appointments by provider and time range', {
        providerId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });

      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .eq('provider_id', providerId)
        .in('status', ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'])
        .is('deleted_at', null)
        .or(`and(start_time.lte.${endTime.toISOString()},end_time.gte.${startTime.toISOString()})`);

      if (error) {
        throw new Error(`Lỗi truy vấn database: ${error.message}`);
      }

      const appointments = data ? data.map(item => this.toDomain(item)) : [];

      this.logger.info('Found conflicting appointments', {
        providerId,
        conflictCount: appointments.length
      });

      return appointments;

    } catch (error) {
      this.logger.error('Error finding appointments by time range', {
        providerId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new Error(`Lỗi tìm lịch hẹn: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find appointments by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    try {
      const { data, error } = await this.client.query()
        .from(this.tableName)
        .select('*')
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .is('deleted_at', null)
        .order('start_time', { ascending: true });

      if (error) {
        throw new Error(`Lỗi truy vấn database: ${error.message}`);
      }

      return data ? data.map(item => this.toDomain(item)) : [];

    } catch (error) {
      throw new Error(`Lỗi tìm appointments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find appointments by status
   */
  async findByStatus(status: string): Promise<Appointment[]> {
    return await this.findAggregatesWithFilters(
      { status, deleted_at: null },
      'start_time',
      true
    );
  }

  /**
   * Find appointments by patient and date range
   */
  async findByPatientAndDateRange(patientId: string, startDate: Date, endDate: Date): Promise<Appointment[]> {
    try {
      const { data, error } = await this.client.query()
        .from(this.tableName)
        .select('*')
        .eq('patient_id', patientId)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .is('deleted_at', null)
        .order('start_time', { ascending: true });

      if (error) {
        throw new Error(`Lỗi truy vấn database: ${error.message}`);
      }

      return data ? data.map(item => this.toDomain(item)) : [];

    } catch (error) {
      throw new Error(`Lỗi tìm appointments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find appointments by provider and date range
   */
  async findByProviderAndDateRange(providerId: string, startDate: Date, endDate: Date): Promise<Appointment[]> {
    try {
      const { data, error } = await this.client.query()
        .from(this.tableName)
        .select('*')
        .eq('provider_id', providerId)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .is('deleted_at', null)
        .order('start_time', { ascending: true });

      if (error) {
        throw new Error(`Lỗi truy vấn database: ${error.message}`);
      }

      return data ? data.map(item => this.toDomain(item)) : [];

    } catch (error) {
      throw new Error(`Lỗi tìm appointments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find appointments by department and date
   */
  async findByDepartmentAndDate(departmentCode: string, date: Date): Promise<Appointment[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // This would require a join with provider table or storing department in appointments
      // For now, we'll use a simplified approach
      const { data, error } = await this.client.query()
        .from(this.tableName)
        .select('*')
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .is('deleted_at', null)
        .order('start_time', { ascending: true });

      if (error) {
        throw new Error(`Lỗi truy vấn database: ${error.message}`);
      }

      // Filter by department code in application layer
      // In production, this should be optimized with proper database schema
      const appointments = data ? data.map(item => this.toDomain(item)) : [];
      return appointments.filter(apt => apt.provider.departmentCode === departmentCode);

    } catch (error) {
      throw new Error(`Lỗi tìm appointments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find appointments by room and date
   */
  async findByRoomAndDate(roomId: string, date: Date): Promise<Appointment[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await this.client.query()
        .from(this.tableName)
        .select('*')
        .eq('room_id', roomId)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .is('deleted_at', null)
        .order('start_time', { ascending: true });

      if (error) {
        throw new Error(`Lỗi truy vấn database: ${error.message}`);
      }

      return data ? data.map(item => this.toDomain(item)) : [];

    } catch (error) {
      throw new Error(`Lỗi tìm appointments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find conflicting appointments - OPTIMIZED QUERY
   */
  async findConflicts(
    providerId: string, 
    startTime: Date, 
    endTime: Date, 
    excludeAppointmentId?: string
  ): Promise<Appointment[]> {
    try {
      // Optimized conflict detection query
      let query = this.client.query()
        .from(this.tableName)
        .select('*')
        .eq('provider_id', providerId)
        .in('status', ['scheduled', 'confirmed', 'in_progress'])
        .is('deleted_at', null)
        .or(`and(start_time.lte.${endTime.toISOString()},end_time.gte.${startTime.toISOString()})`);

      if (excludeAppointmentId) {
        query = query.neq('appointment_id', excludeAppointmentId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Lỗi truy vấn conflicts: ${error.message}`);
      }

      return data ? data.map(item => this.toDomain(item)) : [];

    } catch (error) {
      throw new Error(`Lỗi tìm conflicts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert domain aggregate to persistence format
   */
  protected toPersistence(appointment: Appointment): any {
    return appointment.toPersistence();
  }

  /**
   * Convert domain aggregate to persistence format
   */
  private toPersistence(appointment: Appointment): any {
    return {
      id: appointment.id,
      appointment_id: appointment.appointmentId.value,
      appointment_type: appointment.appointmentId.appointmentType,
      priority: appointment.appointmentId.priority,
      department_code: appointment.appointmentId.department,

      // Patient information
      patient_id: appointment.patient.patientId,
      patient_name: appointment.patient.fullName,
      patient_phone: appointment.patient.phone,
      patient_date_of_birth: appointment.patient.dateOfBirth,
      patient_national_id: appointment.patient.nationalId,
      patient_email: appointment.patient.email,
      patient_address: appointment.patient.address,
      patient_emergency_contact: appointment.patient.emergencyContact,
      patient_insurance_number: appointment.patient.insuranceNumber,
      patient_insurance_type: appointment.patient.insuranceType,

      // Provider information
      provider_id: appointment.provider.providerId,
      provider_name: appointment.provider.name,
      provider_department: appointment.provider.department,
      provider_specialization: appointment.provider.department,
      provider_license: appointment.provider.providerId,

      // Time slot information
      start_time: appointment.timeSlot.startTime.toISOString(),
      end_time: appointment.timeSlot.endTime.toISOString(),

      // Appointment details
      reason: appointment.details.reason,
      reason_code: appointment.details.reasonCode,
      symptoms: appointment.details.symptoms,
      notes: appointment.details.notes,
      preparation_instructions: appointment.details.preparationInstructions,
      estimated_duration: appointment.details.estimatedDuration,
      requires_preparation: appointment.details.requiresPreparation,
      is_follow_up: appointment.details.isFollowUp,
      urgency_level: appointment.details.urgencyLevel,

      // Appointment metadata
      status: appointment.status,
      room_id: appointment.roomId,
      created_at: appointment.createdAt.toISOString(),
      updated_at: appointment.updatedAt.toISOString(),
      created_by: appointment.createdBy,
      confirmed_at: appointment.confirmedAt?.toISOString(),
      cancelled_at: appointment.cancelledAt?.toISOString(),
      completed_at: appointment.completedAt?.toISOString(),
      cancellation_reason: appointment.cancellationReason,
      reminders_sent: appointment.remindersSent || 0,
      version: appointment.version || 0
    };
  }

  /**
   * Convert persistence data to domain aggregate
   */
  private toDomain(data: any): Appointment {
    // Reconstruct value objects
    const appointmentId = new AppointmentId({
      value: data.appointment_id,
      appointmentType: data.appointment_type as AppointmentType,
      priority: data.priority as AppointmentPriority,
      department: data.department_code,
      sequence: parseInt(data.appointment_id.split('-').pop() || '0')
    });

    const patientInfo = PatientInfo.create(
      data.patient_id,
      data.patient_name || 'Unknown Patient',
      data.patient_phone || '',
      data.patient_date_of_birth || '1990-01-01',
      data.patient_national_id || ''
    );

    const providerInfo = ProviderInfo.create(
      data.provider_id,
      data.provider_name || 'Unknown Provider',
      data.provider_specialization || 'General',
      data.department_code || 'GEN',
      data.provider_license || 'VN-XX-0000',
      ProviderType.DOCTOR,
      ProviderStatus.ACTIVE
    );

    const timeSlot = TimeSlot.create(
      new Date(data.start_time),
      new Date(data.end_time),
      TimeSlotStatus.BOOKED,
      data.provider_id,
      data.room_id
    );

    const appointmentDetails = AppointmentDetails.create(
      data.reason || 'General consultation',
      data.estimated_duration || 30,
      data.requires_preparation || false,
      data.is_follow_up || false,
      data.urgency_level || 'routine',
      data.reason_code as AppointmentReason,
      data.symptoms,
      data.notes
    );

    // Reconstruct appointment aggregate
    const appointment = Appointment.create(
      appointmentId,
      patientInfo,
      providerInfo,
      timeSlot,
      appointmentDetails,
      data.room_id || 'TBD',
      data.created_by || 'system'
    );

    // Set additional properties
    appointment.setId(data.id);
    appointment.setVersion(data.version || 0);
    if (data.confirmed_at) appointment.confirm(data.created_by || 'system');
    if (data.completed_at) appointment.complete(data.created_by || 'system');
    if (data.cancelled_at) appointment.cancel(data.cancellation_reason || 'Unknown', data.created_by || 'system');

    return appointment;
  }

  // Implement remaining interface methods with basic implementations
  async findAppointmentsForReminders(reminderTime: Date): Promise<Appointment[]> { return []; }
  async findOverdueAppointments(): Promise<Appointment[]> { return []; }
  async findByUrgencyLevel(urgencyLevel: 'routine' | 'urgent' | 'emergency'): Promise<Appointment[]> { return []; }
  async findFollowUpAppointments(originalAppointmentId: string): Promise<Appointment[]> { return []; }
  async search(filters: AppointmentSearchFilters): Promise<AppointmentSearchResult> { 
    return { appointments: [], totalCount: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPreviousPage: false };
  }
  async getStatistics(filters: AppointmentStatisticsFilters): Promise<AppointmentStatistics> { 
    return { 
      totalAppointments: 0, scheduledAppointments: 0, confirmedAppointments: 0, completedAppointments: 0,
      cancelledAppointments: 0, rescheduledAppointments: 0, noShowAppointments: 0, routineAppointments: 0,
      urgentAppointments: 0, emergencyAppointments: 0, consultationAppointments: 0, followUpAppointments: 0,
      surgeryAppointments: 0, diagnosticAppointments: 0, averageDuration: 0, totalDuration: 0,
      providerUtilization: {}, departmentDistribution: {}
    };
  }
  async delete(id: string): Promise<void> { await this.deleteAggregate(id); }
  async exists(id: string): Promise<boolean> { return await this.aggregateExists(id); }
  async count(filters: AppointmentCountFilters): Promise<number> { return 0; }
}
