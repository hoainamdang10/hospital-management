/**
 * Supabase Appointment Repository - Infrastructure Layer
 * Repository implementation for appointment persistence with Supabase integration
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Repository Pattern, Healthcare Compliance, Supabase Integration
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { IAppointmentRepository, AppointmentSearchCriteria, AppointmentSearchResult } from '../../domain/repositories/appointment.repository';
import { Appointment } from '../../domain/aggregates/appointment.aggregate';
import { AppointmentId } from '../../domain/value-objects/appointment-id';
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
 * Supabase Appointment Repository
 * Implements appointment persistence using Supabase with healthcare compliance
 */
export class SupabaseAppointmentRepository implements IAppointmentRepository {
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
   * Save appointment to database
   */
  async save(appointment: Appointment): Promise<void> {
    try {
      this.logger.info('Saving appointment to database', {
        appointmentId: appointment.appointmentId.value,
        patientId: appointment.patient.patientId,
        providerId: appointment.provider.providerId,
        status: appointment.status
      });

      const appointmentData = appointment.toPersistence();

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

        throw new Error(`Lỗi lưu cuộc hẹn: ${error.message}`);
      }

      // Audit logging
      await this.auditService.logAppointmentDataChange(
        appointment.appointmentId.value,
        'SYSTEM',
        appointment.id ? 'Appointment updated' : 'Appointment created',
        {
          operation: appointment.id ? 'UPDATE' : 'CREATE',
          patientId: appointment.patient.patientId,
          providerId: appointment.provider.providerId,
          status: appointment.status,
          startTime: appointment.timeSlot.startTime.toISOString(),
          endTime: appointment.timeSlot.endTime.toISOString()
        }
      );

      this.logger.info('Appointment saved successfully', {
        appointmentId: appointment.appointmentId.value,
        databaseId: data.id
      });

    } catch (error) {
      this.logger.error('Error in save appointment', {
        appointmentId: appointment.appointmentId.value,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Find appointment by ID
   */
  async findById(id: string): Promise<Appointment | null> {
    try {
      this.logger.debug('Finding appointment by ID', { id });

      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }

        this.logger.error('Error finding appointment by ID', {
          id,
          error: error.message
        });

        throw new Error(`Lỗi tìm cuộc hẹn: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      const appointment = Appointment.fromPersistence(data);

      this.logger.debug('Appointment found by ID', {
        id,
        appointmentId: appointment.appointmentId.value
      });

      return appointment;

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
   * Find appointment by appointment ID
   */
  async findByAppointmentId(appointmentId: string): Promise<Appointment | null> {
    try {
      this.logger.debug('Finding appointment by appointment ID', { appointmentId });

      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }

        this.logger.error('Error finding appointment by appointment ID', {
          appointmentId,
          error: error.message
        });

        throw new Error(`Lỗi tìm cuộc hẹn: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      const appointment = Appointment.fromPersistence(data);

      this.logger.debug('Appointment found by appointment ID', {
        appointmentId,
        id: appointment.id
      });

      return appointment;

    } catch (error) {
      this.logger.error('Error in findByAppointmentId', {
        appointmentId,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Find appointments by patient ID
   */
  async findByPatientId(patientId: string): Promise<Appointment[]> {
    try {
      this.logger.debug('Finding appointments by patient ID', { patientId });

      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .eq('patient_id', patientId)
        .order('start_time', { ascending: false });

      if (error) {
        this.logger.error('Error finding appointments by patient ID', {
          patientId,
          error: error.message
        });

        throw new Error(`Lỗi tìm cuộc hẹn theo bệnh nhân: ${error.message}`);
      }

      const appointments = (data || []).map(item => Appointment.fromPersistence(item));

      this.logger.debug('Appointments found by patient ID', {
        patientId,
        count: appointments.length
      });

      return appointments;

    } catch (error) {
      this.logger.error('Error in findByPatientId', {
        patientId,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Find appointments by provider ID
   */
  async findByProviderId(providerId: string): Promise<Appointment[]> {
    try {
      this.logger.debug('Finding appointments by provider ID', { providerId });

      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .eq('provider_id', providerId)
        .order('start_time', { ascending: true });

      if (error) {
        this.logger.error('Error finding appointments by provider ID', {
          providerId,
          error: error.message
        });

        throw new Error(`Lỗi tìm cuộc hẹn theo bác sĩ: ${error.message}`);
      }

      const appointments = (data || []).map(item => Appointment.fromPersistence(item));

      this.logger.debug('Appointments found by provider ID', {
        providerId,
        count: appointments.length
      });

      return appointments;

    } catch (error) {
      this.logger.error('Error in findByProviderId', {
        providerId,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Find patient appointments in time range
   */
  async findPatientAppointmentsInTimeRange(
    patientId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Appointment[]> {
    try {
      this.logger.debug('Finding patient appointments in time range', {
        patientId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });

      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .eq('patient_id', patientId)
        .gte('start_time', startTime.toISOString())
        .lte('end_time', endTime.toISOString())
        .in('status', ['scheduled', 'confirmed', 'in_progress'])
        .order('start_time', { ascending: true });

      if (error) {
        this.logger.error('Error finding patient appointments in time range', {
          patientId,
          error: error.message
        });

        throw new Error(`Lỗi tìm cuộc hẹn theo thời gian: ${error.message}`);
      }

      const appointments = (data || []).map(item => Appointment.fromPersistence(item));

      this.logger.debug('Patient appointments found in time range', {
        patientId,
        count: appointments.length
      });

      return appointments;

    } catch (error) {
      this.logger.error('Error in findPatientAppointmentsInTimeRange', {
        patientId,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Find provider appointments in time range
   */
  async findProviderAppointmentsInTimeRange(
    providerId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Appointment[]> {
    try {
      this.logger.debug('Finding provider appointments in time range', {
        providerId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });

      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .eq('provider_id', providerId)
        .gte('start_time', startTime.toISOString())
        .lte('end_time', endTime.toISOString())
        .in('status', ['scheduled', 'confirmed', 'in_progress'])
        .order('start_time', { ascending: true });

      if (error) {
        this.logger.error('Error finding provider appointments in time range', {
          providerId,
          error: error.message
        });

        throw new Error(`Lỗi tìm cuộc hẹn theo thời gian: ${error.message}`);
      }

      const appointments = (data || []).map(item => Appointment.fromPersistence(item));

      this.logger.debug('Provider appointments found in time range', {
        providerId,
        count: appointments.length
      });

      return appointments;

    } catch (error) {
      this.logger.error('Error in findProviderAppointmentsInTimeRange', {
        providerId,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Find room appointments in time range
   */
  async findRoomAppointmentsInTimeRange(
    roomId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Appointment[]> {
    try {
      this.logger.debug('Finding room appointments in time range', {
        roomId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });

      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .eq('room_id', roomId)
        .gte('start_time', startTime.toISOString())
        .lte('end_time', endTime.toISOString())
        .in('status', ['scheduled', 'confirmed', 'in_progress'])
        .order('start_time', { ascending: true });

      if (error) {
        this.logger.error('Error finding room appointments in time range', {
          roomId,
          error: error.message
        });

        throw new Error(`Lỗi tìm cuộc hẹn theo phòng: ${error.message}`);
      }

      const appointments = (data || []).map(item => Appointment.fromPersistence(item));

      this.logger.debug('Room appointments found in time range', {
        roomId,
        count: appointments.length
      });

      return appointments;

    } catch (error) {
      this.logger.error('Error in findRoomAppointmentsInTimeRange', {
        roomId,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Search appointments with criteria
   */
  async searchAppointments(
    searchTerm?: string,
    criteria?: AppointmentSearchCriteria,
    page: number = 1,
    pageSize: number = 20,
    sortBy: string = 'start_time',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<AppointmentSearchResult> {
    try {
      this.logger.info('Searching appointments', {
        searchTerm,
        criteria,
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
        query = query.or(`appointment_id.ilike.%${searchTerm}%,reason.ilike.%${searchTerm}%,patient_name.ilike.%${searchTerm}%,provider_name.ilike.%${searchTerm}%`);
      }

      // Apply criteria filters
      if (criteria) {
        if (criteria.patientId) {
          query = query.eq('patient_id', criteria.patientId);
        }

        if (criteria.providerId) {
          query = query.eq('provider_id', criteria.providerId);
        }

        if (criteria.department) {
          query = query.eq('provider_department', criteria.department);
        }

        if (criteria.appointmentTypes && criteria.appointmentTypes.length > 0) {
          query = query.in('appointment_type', criteria.appointmentTypes);
        }

        if (criteria.statuses && criteria.statuses.length > 0) {
          query = query.in('status', criteria.statuses);
        }

        if (criteria.priorities && criteria.priorities.length > 0) {
          query = query.in('priority', criteria.priorities);
        }

        if (criteria.startDate) {
          query = query.gte('start_time', criteria.startDate.toISOString());
        }

        if (criteria.endDate) {
          query = query.lte('start_time', criteria.endDate.toISOString());
        }

        if (criteria.roomId) {
          query = query.eq('room_id', criteria.roomId);
        }
      }

      // Apply sorting
      query = query.order(this.mapSortField(sortBy), { ascending: sortOrder === 'asc' });

      // Apply pagination
      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        this.logger.error('Error searching appointments', {
          error: error.message,
          searchTerm,
          criteria,
          page,
          pageSize
        });

        throw new Error(`Lỗi tìm kiếm cuộc hẹn: ${error.message}`);
      }

      // Convert to domain objects
      const appointments = (data || []).map(item => Appointment.fromPersistence(item));

      const result: AppointmentSearchResult = {
        appointments,
        totalCount: count || 0
      };

      this.logger.info('Appointment search completed', {
        totalCount: result.totalCount,
        page,
        pageSize
      });

      return result;

    } catch (error) {
      this.logger.error('Error in searchAppointments', {
        searchTerm,
        criteria,
        page,
        pageSize,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Find appointments by date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    statuses?: string[]
  ): Promise<Appointment[]> {
    try {
      this.logger.debug('Finding appointments by date range', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        statuses
      });

      let query = this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString());

      if (statuses && statuses.length > 0) {
        query = query.in('status', statuses);
      }

      query = query.order('start_time', { ascending: true });

      const { data, error } = await query;

      if (error) {
        this.logger.error('Error finding appointments by date range', {
          error: error.message
        });

        throw new Error(`Lỗi tìm cuộc hẹn theo ngày: ${error.message}`);
      }

      const appointments = (data || []).map(item => Appointment.fromPersistence(item));

      this.logger.debug('Appointments found by date range', {
        count: appointments.length
      });

      return appointments;

    } catch (error) {
      this.logger.error('Error in findByDateRange', {
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Find emergency appointments
   */
  async findEmergencyAppointments(
    startDate?: Date,
    endDate?: Date
  ): Promise<Appointment[]> {
    try {
      this.logger.debug('Finding emergency appointments', {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      });

      let query = this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .or('appointment_type.eq.emergency,priority.eq.emergency');

      if (startDate) {
        query = query.gte('start_time', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('start_time', endDate.toISOString());
      }

      query = query.order('priority', { ascending: false })
                   .order('start_time', { ascending: true });

      const { data, error } = await query;

      if (error) {
        this.logger.error('Error finding emergency appointments', {
          error: error.message
        });

        throw new Error(`Lỗi tìm cuộc hẹn cấp cứu: ${error.message}`);
      }

      const appointments = (data || []).map(item => Appointment.fromPersistence(item));

      this.logger.debug('Emergency appointments found', {
        count: appointments.length
      });

      return appointments;

    } catch (error) {
      this.logger.error('Error in findEmergencyAppointments', {
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Find appointments needing reminders
   */
  async findAppointmentsNeedingReminders(): Promise<Appointment[]> {
    try {
      this.logger.debug('Finding appointments needing reminders');

      // Find appointments in next 24 hours that haven't been reminded recently
      const now = new Date();
      const next24Hours = new Date(now.getTime() + (24 * 60 * 60 * 1000));

      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .gte('start_time', now.toISOString())
        .lte('start_time', next24Hours.toISOString())
        .in('status', ['scheduled', 'confirmed'])
        .or('last_reminder_sent.is.null,last_reminder_sent.lt.' + new Date(now.getTime() - (60 * 60 * 1000)).toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        this.logger.error('Error finding appointments needing reminders', {
          error: error.message
        });

        throw new Error(`Lỗi tìm cuộc hẹn cần nhắc nhở: ${error.message}`);
      }

      const appointments = (data || []).map(item => Appointment.fromPersistence(item));

      this.logger.debug('Appointments needing reminders found', {
        count: appointments.length
      });

      return appointments;

    } catch (error) {
      this.logger.error('Error in findAppointmentsNeedingReminders', {
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Update appointment status
   */
  async updateStatus(appointmentId: AppointmentId, status: string, updatedBy: string): Promise<void> {
    try {
      this.logger.info('Updating appointment status', {
        appointmentId: appointmentId.value,
        status,
        updatedBy
      });

      const { error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('appointment_id', appointmentId.value);

      if (error) {
        this.logger.error('Error updating appointment status', {
          appointmentId: appointmentId.value,
          error: error.message
        });

        throw new Error(`Lỗi cập nhật trạng thái cuộc hẹn: ${error.message}`);
      }

      // Audit logging
      await this.auditService.logAppointmentDataChange(
        appointmentId.value,
        updatedBy,
        'Appointment status updated',
        {
          operation: 'STATUS_UPDATE',
          newStatus: status
        }
      );

      this.logger.info('Appointment status updated successfully', {
        appointmentId: appointmentId.value,
        status
      });

    } catch (error) {
      this.logger.error('Error in updateStatus', {
        appointmentId: appointmentId.value,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Delete appointment
   */
  async delete(appointmentId: AppointmentId): Promise<void> {
    try {
      this.logger.info('Deleting appointment', {
        appointmentId: appointmentId.value
      });

      const { error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .delete()
        .eq('appointment_id', appointmentId.value);

      if (error) {
        this.logger.error('Error deleting appointment', {
          appointmentId: appointmentId.value,
          error: error.message
        });

        throw new Error(`Lỗi xóa cuộc hẹn: ${error.message}`);
      }

      // Audit logging
      await this.auditService.logAppointmentDataChange(
        appointmentId.value,
        'SYSTEM',
        'Appointment deleted',
        {
          operation: 'DELETE'
        }
      );

      this.logger.info('Appointment deleted successfully', {
        appointmentId: appointmentId.value
      });

    } catch (error) {
      this.logger.error('Error in delete', {
        appointmentId: appointmentId.value,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Check if appointment exists
   */
  async exists(appointmentId: AppointmentId): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('id')
        .eq('appointment_id', appointmentId.value)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Lỗi kiểm tra tồn tại cuộc hẹn: ${error.message}`);
      }

      return !!data;

    } catch (error) {
      this.logger.error('Error in exists', {
        appointmentId: appointmentId.value,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Get appointment statistics
   */
  async getStatistics(
    startDate?: Date,
    endDate?: Date,
    department?: string
  ): Promise<any> {
    try {
      this.logger.debug('Getting appointment statistics', {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        department
      });

      let query = this.supabase
        .schema(this.schema)
        .from(this.tableName)
        .select('status, provider_department, appointment_type, priority, start_time, end_time');

      if (startDate) {
        query = query.gte('start_time', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('start_time', endDate.toISOString());
      }

      if (department) {
        query = query.eq('provider_department', department);
      }

      const { data, error } = await query;

      if (error) {
        this.logger.error('Error getting appointment statistics', {
          error: error.message
        });

        throw new Error(`Lỗi lấy thống kê cuộc hẹn: ${error.message}`);
      }

      // Calculate statistics
      const stats = this.calculateStatistics(data || []);

      this.logger.debug('Appointment statistics calculated', {
        totalAppointments: stats.totalAppointments
      });

      return stats;

    } catch (error) {
      this.logger.error('Error in getStatistics', {
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private mapSortField(sortBy: string): string {
    const fieldMap: { [key: string]: string } = {
      'startTime': 'start_time',
      'endTime': 'end_time',
      'status': 'status',
      'priority': 'priority',
      'appointmentType': 'appointment_type',
      'patientName': 'patient_name',
      'providerName': 'provider_name',
      'department': 'provider_department',
      'createdAt': 'created_at',
      'updatedAt': 'updated_at'
    };

    return fieldMap[sortBy] || 'start_time';
  }

  private calculateStatistics(data: any[]): any {
    const stats = {
      totalAppointments: data.length,
      scheduledAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      emergencyAppointments: 0,
      averageWaitTime: 0,
      departmentDistribution: {} as { [department: string]: number },
      statusDistribution: {} as { [status: string]: number }
    };

    let totalWaitTime = 0;
    let waitTimeCount = 0;

    data.forEach(appointment => {
      // Status distribution
      stats.statusDistribution[appointment.status] = 
        (stats.statusDistribution[appointment.status] || 0) + 1;

      // Count by status
      switch (appointment.status) {
        case 'scheduled':
          stats.scheduledAppointments++;
          break;
        case 'completed':
          stats.completedAppointments++;
          break;
        case 'cancelled':
          stats.cancelledAppointments++;
          break;
      }

      // Emergency appointments
      if (appointment.appointment_type === 'emergency' || appointment.priority === 'emergency') {
        stats.emergencyAppointments++;
      }

      // Department distribution
      if (appointment.provider_department) {
        stats.departmentDistribution[appointment.provider_department] = 
          (stats.departmentDistribution[appointment.provider_department] || 0) + 1;
      }

      // Calculate wait time for completed appointments
      if (appointment.status === 'completed' && appointment.start_time && appointment.end_time) {
        const startTime = new Date(appointment.start_time);
        const endTime = new Date(appointment.end_time);
        const waitTime = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // minutes
        
        totalWaitTime += waitTime;
        waitTimeCount++;
      }
    });

    // Calculate average wait time
    if (waitTimeCount > 0) {
      stats.averageWaitTime = Math.round(totalWaitTime / waitTimeCount);
    }

    return stats;
  }
}
