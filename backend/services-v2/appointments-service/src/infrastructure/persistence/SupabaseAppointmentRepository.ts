/**
 * Supabase Appointment Repository - Infrastructure Layer
 * V3 Clean Architecture + DDD Implementation
 * Matches 100% with scheduling_schema database
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Appointment, AppointmentType, AppointmentPriority, AppointmentStatus, PaymentStatus, AppointmentProps } from '../../domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../domain/value-objects/AppointmentId.vo';
import { TimeSlot } from '../../domain/value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../../domain/value-objects/AppointmentDetails.vo';
import { TenantId } from '../../domain/value-objects/TenantId.vo';
import {
  IAppointmentRepository,
  AppointmentSearchCriteria,
  AppointmentSearchResult,
  AppointmentConflictCheck,
  AppointmentStatistics
} from '../../domain/repositories/IAppointmentRepository';

interface DatabaseAppointmentRecord {
  id: string;
  appointment_id: string;
  tenant_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  start_at_utc: string;
  end_at_utc: string;
  duration_minutes: number;
  type: string;
  priority: string;
  status: string;
  reason?: string;
  chief_complaint?: string;
  symptoms?: string[];
  notes?: string;
  special_instructions?: string;
  room_id?: string;
  department_id?: string;
  required_equipment?: string[];
  consultation_fee: number;
  additional_fees?: number;
  payment_status: string;
  payment_method?: string;
  checked_in_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  follow_up_appointment_id?: string;
  parent_appointment_id?: string;
  series_id?: string;
  reminder_sent: boolean;
  reminder_sent_at?: string;
  confirmation_required: boolean;
  confirmed_at?: string;
  confirmed_by?: string;
  version: number;
  created_by: string;
  last_modified_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase Appointment Repository
 * Implements persistence for Appointment aggregate
 */
export class SupabaseAppointmentRepository implements IAppointmentRepository {
  private readonly supabase: SupabaseClient<any, 'appointments_schema'>;
  private readonly schema: string = 'appointments_schema';
  private readonly tableName: string = 'appointments';

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'appointments_schema',
      },
      global: {
        headers: {
          'X-Client-Info': 'appointments-service',
        },
      },
    }) as SupabaseClient<any, 'appointments_schema'>;
  }

  /**
   * Save appointment (create or update)
   */
  async save(appointment: Appointment): Promise<void> {
    const record = this.toPersistence(appointment);

    const { error } = await this.supabase
      .from(this.tableName)
      .upsert(record, { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to save appointment: ${error.message}`);
    }
  }

  /**
   * Find appointment by AppointmentId
   */
  async findById(appointmentId: AppointmentId): Promise<Appointment | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('appointment_id', appointmentId.value)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to find appointment: ${error.message}`);
    }

    return this.toDomain(data);
  }

  /**
   * Find appointment by appointment_id
   */
  async findByAppointmentId(appointmentId: string): Promise<Appointment | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('appointment_id', appointmentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find appointment: ${error.message}`);
    }

    return this.toDomain(data);
  }

  /**
   * Find appointments by patient ID
   */
  async findByPatientId(patientId: string, limit?: number, offset?: number): Promise<Appointment[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 10) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find appointments: ${error.message}`);
    }

    return data.map(record => this.toDomain(record));
  }

  /**
   * Find appointments by doctor ID
   */
  async findByDoctorId(doctorId: string, limit?: number, offset?: number): Promise<Appointment[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('doctor_id', doctorId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 10) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find appointments: ${error.message}`);
    }

    return data.map(record => this.toDomain(record));
  }

  /**
   * Find appointments by date range
   */
  async findByDateRange(startDate: Date, endDate: Date, limit?: number, offset?: number): Promise<Appointment[]> {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .gte('appointment_date', startDateStr)
      .lte('appointment_date', endDateStr)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 10) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find appointments: ${error.message}`);
    }

    return data.map(record => this.toDomain(record));
  }

  /**
   * Delete appointment
   */
  async delete(appointmentId: AppointmentId): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('appointment_id', appointmentId.value);

    if (error) {
      throw new Error(`Failed to delete appointment: ${error.message}`);
    }
  }

  // ===== Additional methods to satisfy IAppointmentRepository interface =====

  async findByIdString(appointmentId: string): Promise<Appointment | null> {
    return this.findByAppointmentId(appointmentId);
  }

  async findByProviderId(providerId: string, limit?: number, offset?: number): Promise<Appointment[]> {
    return this.findByDoctorId(providerId);
  }

  async search(criteria: AppointmentSearchCriteria): Promise<AppointmentSearchResult> {
    let query = this.supabase.from(this.tableName).select('*', { count: 'exact' });

    // Apply filters
    if (criteria.patientId) query = query.eq('patient_id', criteria.patientId);
    if (criteria.providerId) query = query.eq('doctor_id', criteria.providerId);
    if (criteria.department) query = query.eq('department_id', criteria.department);
    if (criteria.status && criteria.status.length > 0) {
      query = query.in('status', criteria.status.map(s => s.toUpperCase()));
    }
    if (criteria.dateFrom) {
      const dateStr = criteria.dateFrom.toISOString().split('T')[0];
      query = query.gte('appointment_date', dateStr);
    }
    if (criteria.dateTo) {
      const dateStr = criteria.dateTo.toISOString().split('T')[0];
      query = query.lte('appointment_date', dateStr);
    }
    if (criteria.appointmentType) query = query.eq('type', criteria.appointmentType.toUpperCase());
    if (criteria.priority) query = query.eq('priority', criteria.priority.toUpperCase());
    if (criteria.roomId) query = query.eq('room_id', criteria.roomId);

    // Sorting
    const sortBy = criteria.sortBy || 'startTime';
    const sortOrder = criteria.sortOrder || 'asc';
    if (sortBy === 'startTime') {
      query = query.order('appointment_date', { ascending: sortOrder === 'asc' });
      query = query.order('appointment_time', { ascending: sortOrder === 'asc' });
    } else {
      query = query.order(sortBy === 'createdAt' ? 'created_at' : sortBy, { ascending: sortOrder === 'asc' });
    }

    // Pagination
    const limit = criteria.limit || 50;
    const offset = criteria.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to search appointments: ${error.message}`);
    }

    const appointments = (data || []).map(record => this.toDomain(record));
    const totalCount = count || 0;

    return {
      appointments,
      totalCount,
      hasMore: totalCount > offset + appointments.length
    };
  }

  async checkConflicts(providerId: string, startTime: Date, endTime: Date, excludeAppointmentId?: string): Promise<AppointmentConflictCheck> {
    const startUtc = startTime.toISOString();
    const endUtc = endTime.toISOString();

    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('doctor_id', providerId)
      .not('status', 'in', '(CANCELLED,NO_SHOW,RESCHEDULED)')
      .lt('start_at_utc', endUtc)
      .gt('end_at_utc', startUtc);

    if (excludeAppointmentId) {
      query = query.neq('appointment_id', excludeAppointmentId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to check conflicts: ${error.message}`);
    }

    const conflicts = (data || []).map(record => ({
      appointmentId: record.appointment_id,
      startTime: new Date(record.start_at_utc),
      endTime: new Date(record.end_at_utc),
      reason: `Overlaps with existing appointment ${record.appointment_id}`
    }));

    return {
      hasConflicts: conflicts.length > 0,
      conflicts
    };
  }

  async findUpcomingByPatientId(patientId: string, limit?: number): Promise<Appointment[]> {
    const now = new Date().toISOString();

    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('patient_id', patientId)
      .gte('start_at_utc', now)
      .not('status', 'in', '(CANCELLED,NO_SHOW,RESCHEDULED)')
      .order('start_at_utc', { ascending: true });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find upcoming appointments: ${error.message}`);
    }

    return (data || []).map(record => this.toDomain(record));
  }

  async findUpcomingByProviderId(providerId: string, limit?: number): Promise<Appointment[]> {
    const now = new Date().toISOString();

    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('doctor_id', providerId)
      .gte('start_at_utc', now)
      .not('status', 'in', '(CANCELLED,NO_SHOW,RESCHEDULED)')
      .order('start_at_utc', { ascending: true });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find upcoming appointments: ${error.message}`);
    }

    return (data || []).map(record => this.toDomain(record));
  }

  async findByStatus(status: string, limit?: number, offset?: number): Promise<Appointment[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('status', status.toUpperCase())
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 10) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find appointments by status: ${error.message}`);
    }

    return (data || []).map(record => this.toDomain(record));
  }

  async findRequiringReminders(reminderType: '24h' | '2h' | '30min'): Promise<Appointment[]> {
    const now = new Date();
    let targetTime: Date;

    // Calculate target time based on reminder type
    switch (reminderType) {
      case '24h':
        targetTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case '2h':
        targetTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        break;
      case '30min':
        targetTime = new Date(now.getTime() + 30 * 60 * 1000);
        break;
    }

    const targetTimeStr = targetTime.toISOString();
    const nowStr = now.toISOString();

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('reminder_sent', false)
      .eq('status', 'SCHEDULED')
      .gte('start_at_utc', nowStr)
      .lte('start_at_utc', targetTimeStr);

    if (error) {
      throw new Error(`Failed to find appointments requiring reminders: ${error.message}`);
    }

    return (data || []).map(record => this.toDomain(record));
  }

  async findOverdue(): Promise<Appointment[]> {
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('status', 'SCHEDULED')
      .lt('start_at_utc', now)
      .order('start_at_utc', { ascending: true });

    if (error) {
      throw new Error(`Failed to find overdue appointments: ${error.message}`);
    }

    return (data || []).map(record => this.toDomain(record));
  }

  async getStatistics(dateFrom?: Date, dateTo?: Date, providerId?: string, department?: string): Promise<AppointmentStatistics> {
    let query = this.supabase.from(this.tableName).select('*');

    if (dateFrom) {
      const dateStr = dateFrom.toISOString().split('T')[0];
      query = query.gte('appointment_date', dateStr);
    }
    if (dateTo) {
      const dateStr = dateTo.toISOString().split('T')[0];
      query = query.lte('appointment_date', dateStr);
    }
    if (providerId) query = query.eq('doctor_id', providerId);
    if (department) query = query.eq('department_id', department);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }

    const appointments = data || [];
    const totalAppointments = appointments.length;
    const scheduledAppointments = appointments.filter(a => a.status === 'SCHEDULED').length;
    const confirmedAppointments = appointments.filter(a => a.confirmed_at !== null).length;
    const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length;
    const cancelledAppointments = appointments.filter(a => a.status === 'CANCELLED').length;
    const noShowAppointments = appointments.filter(a => a.status === 'NO_SHOW').length;

    const totalDuration = appointments.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
    const averageDuration = totalAppointments > 0 ? totalDuration / totalAppointments : 0;

    // Calculate busy hours (simplified)
    const busyHours: { hour: number; count: number }[] = [];
    const departmentStats: { department: string; count: number }[] = [];

    return {
      totalAppointments,
      scheduledAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      averageDuration,
      busyHours,
      departmentStats
    };
  }

  async count(criteria: Partial<AppointmentSearchCriteria>): Promise<number> {
    let query = this.supabase.from(this.tableName).select('*', { count: 'exact', head: true });

    if (criteria.patientId) query = query.eq('patient_id', criteria.patientId);
    if (criteria.providerId) query = query.eq('doctor_id', criteria.providerId);
    if (criteria.department) query = query.eq('department_id', criteria.department);
    if (criteria.status && criteria.status.length > 0) {
      query = query.in('status', criteria.status.map(s => s.toUpperCase()));
    }
    if (criteria.dateFrom) {
      const dateStr = criteria.dateFrom.toISOString().split('T')[0];
      query = query.gte('appointment_date', dateStr);
    }
    if (criteria.dateTo) {
      const dateStr = criteria.dateTo.toISOString().split('T')[0];
      query = query.lte('appointment_date', dateStr);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count appointments: ${error.message}`);
    }

    return count || 0;
  }

  async exists(appointmentId: AppointmentId): Promise<boolean> {
    const appointment = await this.findById(appointmentId);
    return appointment !== null;
  }

  async findByIds(appointmentIds: AppointmentId[]): Promise<Appointment[]> {
    if (appointmentIds.length === 0) return [];

    const ids = appointmentIds.map(id => id.value);
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .in('appointment_id', ids);

    if (error) {
      throw new Error(`Failed to find appointments by IDs: ${error.message}`);
    }

    return (data || []).map(record => this.toDomain(record));
  }

  async findByTimeSlot(providerId: string, startTime: Date, endTime: Date): Promise<Appointment[]> {
    const startUtc = startTime.toISOString();
    const endUtc = endTime.toISOString();

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('doctor_id', providerId)
      .gte('start_at_utc', startUtc)
      .lte('end_at_utc', endUtc)
      .order('start_at_utc', { ascending: true });

    if (error) {
      throw new Error(`Failed to find appointments by time slot: ${error.message}`);
    }

    return (data || []).map(record => this.toDomain(record));
  }

  async findFollowUpAppointments(originalAppointmentId: string): Promise<Appointment[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('parent_appointment_id', originalAppointmentId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) {
      throw new Error(`Failed to find follow-up appointments: ${error.message}`);
    }

    return (data || []).map(record => this.toDomain(record));
  }

  async getPatientHistory(patientId: string, limit?: number, offset?: number): Promise<{
    appointments: Appointment[];
    totalCount: number;
    completedCount: number;
    cancelledCount: number;
    noShowCount: number;
  }> {
    // Get total count
    const { count: totalCount } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId);

    // Get appointments
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 10) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get patient history: ${error.message}`);
    }

    const appointments = (data || []).map(record => this.toDomain(record));

    // Get counts by status
    const { count: completedCount } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId)
      .eq('status', 'COMPLETED');

    const { count: cancelledCount } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId)
      .eq('status', 'CANCELLED');

    const { count: noShowCount } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId)
      .eq('status', 'NO_SHOW');

    return {
      appointments,
      totalCount: totalCount || 0,
      completedCount: completedCount || 0,
      cancelledCount: cancelledCount || 0,
      noShowCount: noShowCount || 0
    };
  }

  async getProviderSchedule(providerId: string, startDate: Date, endDate: Date): Promise<Appointment[]> {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('doctor_id', providerId)
      .gte('appointment_date', startDateStr)
      .lte('appointment_date', endDateStr)
      .not('status', 'in', '(CANCELLED,NO_SHOW)')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) {
      throw new Error(`Failed to get provider schedule: ${error.message}`);
    }

    return (data || []).map(record => this.toDomain(record));
  }

  async findByDepartment(department: string, dateFrom?: Date, dateTo?: Date, limit?: number, offset?: number): Promise<Appointment[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('department_id', department);

    if (dateFrom) {
      const dateStr = dateFrom.toISOString().split('T')[0];
      query = query.gte('appointment_date', dateStr);
    }
    if (dateTo) {
      const dateStr = dateTo.toISOString().split('T')[0];
      query = query.lte('appointment_date', dateStr);
    }

    query = query.order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 10) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find appointments by department: ${error.message}`);
    }

    return (data || []).map(record => this.toDomain(record));
  }

  async findEmergencyAppointments(limit?: number): Promise<Appointment[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('priority', 'EMERGENCY')
      .not('status', 'in', '(COMPLETED,CANCELLED,NO_SHOW)')
      .order('created_at', { ascending: true });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find emergency appointments: ${error.message}`);
    }

    return (data || []).map(record => this.toDomain(record));
  }

  async findRequiringPreparation(dateFrom?: Date, dateTo?: Date): Promise<Appointment[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .not('required_equipment', 'is', null)
      .eq('status', 'SCHEDULED');

    if (dateFrom) {
      const dateStr = dateFrom.toISOString().split('T')[0];
      query = query.gte('appointment_date', dateStr);
    }
    if (dateTo) {
      const dateStr = dateTo.toISOString().split('T')[0];
      query = query.lte('appointment_date', dateStr);
    }

    query = query.order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find appointments requiring preparation: ${error.message}`);
    }

    return (data || []).map(record => this.toDomain(record));
  }

  async updateStatus(appointmentId: AppointmentId, status: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({ status: status.toUpperCase(), updated_at: new Date().toISOString() })
      .eq('appointment_id', appointmentId.value);

    if (error) {
      throw new Error(`Failed to update appointment status: ${error.message}`);
    }
  }

  async bulkUpdate(appointments: Appointment[]): Promise<void> {
    const records = appointments.map(apt => this.toPersistence(apt));

    const { error } = await this.supabase
      .from(this.tableName)
      .upsert(records, { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to bulk update appointments: ${error.message}`);
    }
  }

  async getDailySummary(date: Date, providerId?: string): Promise<{
    totalAppointments: number;
    scheduledAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    averageDuration: number;
    busyPeriods: { startTime: Date; endTime: Date; appointmentCount: number }[];
  }> {
    const dateStr = date.toISOString().split('T')[0];

    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('appointment_date', dateStr);

    if (providerId) query = query.eq('doctor_id', providerId);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get daily summary: ${error.message}`);
    }

    const appointments = data || [];
    const totalAppointments = appointments.length;
    const scheduledAppointments = appointments.filter(a => a.status === 'SCHEDULED').length;
    const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length;
    const cancelledAppointments = appointments.filter(a => a.status === 'CANCELLED').length;

    const totalDuration = appointments.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
    const averageDuration = totalAppointments > 0 ? totalDuration / totalAppointments : 0;

    // Calculate busy periods (simplified - group by hour)
    const busyPeriods: { startTime: Date; endTime: Date; appointmentCount: number }[] = [];

    return {
      totalAppointments,
      scheduledAppointments,
      completedAppointments,
      cancelledAppointments,
      averageDuration,
      busyPeriods
    };
  }

  async findAvailableTimeSlots(providerId: string, date: Date, duration: number): Promise<{ startTime: Date; endTime: Date }[]> {
    // This is a simplified implementation
    // In production, you would need to:
    // 1. Get provider's working hours
    // 2. Get all booked appointments for the day
    // 3. Calculate gaps between appointments
    // 4. Return slots that fit the duration

    const dateStr = date.toISOString().split('T')[0];

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('doctor_id', providerId)
      .eq('appointment_date', dateStr)
      .not('status', 'in', '(CANCELLED,NO_SHOW)')
      .order('start_at_utc', { ascending: true });

    if (error) {
      throw new Error(`Failed to find available time slots: ${error.message}`);
    }

    // For now, return empty array (TODO: implement slot calculation logic)
    return [];
  }

  async getUtilizationRate(providerId?: string, department?: string, dateFrom?: Date, dateTo?: Date): Promise<{
    totalSlots: number;
    bookedSlots: number;
    utilizationRate: number;
    noShowRate: number;
    cancellationRate: number;
  }> {
    let query = this.supabase.from(this.tableName).select('*');

    if (providerId) query = query.eq('doctor_id', providerId);
    if (department) query = query.eq('department_id', department);
    if (dateFrom) {
      const dateStr = dateFrom.toISOString().split('T')[0];
      query = query.gte('appointment_date', dateStr);
    }
    if (dateTo) {
      const dateStr = dateTo.toISOString().split('T')[0];
      query = query.lte('appointment_date', dateStr);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get utilization rate: ${error.message}`);
    }

    const appointments = data || [];
    const totalSlots = appointments.length;
    const bookedSlots = appointments.filter(a => a.status !== 'CANCELLED').length;
    const noShowCount = appointments.filter(a => a.status === 'NO_SHOW').length;
    const cancelledCount = appointments.filter(a => a.status === 'CANCELLED').length;

    const utilizationRate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;
    const noShowRate = totalSlots > 0 ? (noShowCount / totalSlots) * 100 : 0;
    const cancellationRate = totalSlots > 0 ? (cancelledCount / totalSlots) * 100 : 0;

    return {
      totalSlots,
      bookedSlots,
      utilizationRate,
      noShowRate,
      cancellationRate
    };
  }

  /**
   * Convert domain aggregate to database record
   */
  private toPersistence(appointment: Appointment): DatabaseAppointmentRecord {
    const props = (appointment as any).props; // Access private props

    // Calculate UTC timestamps from timeSlot
    const startAtUtc = props.timeSlot.startAtUtc || props.timeSlot.getStartTime();
    const endAtUtc = props.timeSlot.endAtUtc || props.timeSlot.getEndTime(props.durationMinutes);

    return {
      id: appointment.id,
      appointment_id: props.appointmentId.value,
      tenant_id: props.tenantId.value,
      patient_id: props.patientId,
      doctor_id: props.doctorId,
      appointment_date: props.timeSlot.appointmentDate,
      appointment_time: props.timeSlot.appointmentTime,
      start_at_utc: startAtUtc.toISOString(),
      end_at_utc: endAtUtc.toISOString(),
      duration_minutes: props.durationMinutes,
      type: props.type.toUpperCase(),
      priority: props.priority.toUpperCase(),
      status: props.status.toUpperCase(),
      reason: props.details.reason,
      chief_complaint: props.details.chiefComplaint,
      symptoms: props.details.symptoms,
      notes: props.details.notes,
      special_instructions: props.details.specialInstructions,
      room_id: props.roomId,
      department_id: props.departmentId,
      required_equipment: props.requiredEquipment,
      consultation_fee: props.consultationFee,
      additional_fees: props.additionalFees,
      payment_status: props.paymentStatus.toUpperCase(),
      payment_method: props.paymentMethod,
      checked_in_at: props.checkedInAt?.toISOString(),
      started_at: props.startedAt?.toISOString(),
      completed_at: props.completedAt?.toISOString(),
      cancelled_at: props.cancelledAt?.toISOString(),
      cancellation_reason: props.cancellationReason,
      cancelled_by: props.cancelledBy,
      follow_up_appointment_id: props.followUpAppointmentId,
      parent_appointment_id: props.parentAppointmentId,
      series_id: props.seriesId,
      reminder_sent: props.reminderSent,
      reminder_sent_at: props.reminderSentAt?.toISOString(),
      confirmation_required: props.confirmationRequired,
      confirmed_at: props.confirmedAt?.toISOString(),
      confirmed_by: props.confirmedBy,
      version: props.version,
      created_by: props.createdBy,
      last_modified_by: props.lastModifiedBy,
      created_at: props.createdAt.toISOString(),
      updated_at: props.updatedAt.toISOString()
    };
  }

  /**
   * Convert database record to domain aggregate
   */
  private toDomain(record: DatabaseAppointmentRecord): Appointment {
    const appointmentId = AppointmentId.create(record.appointment_id);
    const tenantId = TenantId.create(record.tenant_id);

    // Create TimeSlot with UTC timestamps
    const timeSlot = TimeSlot.createWithTimestamps(
      record.appointment_date,
      record.appointment_time,
      new Date(record.start_at_utc),
      new Date(record.end_at_utc)
    );

    const details = AppointmentDetails.create(
      record.reason,
      record.chief_complaint,
      record.symptoms,
      record.notes,
      record.special_instructions
    );

    // Build complete props object for reconstitution
    const props: AppointmentProps = {
      appointmentId,
      tenantId,
      patientId: record.patient_id,
      doctorId: record.doctor_id,
      timeSlot,
      durationMinutes: record.duration_minutes,
      type: record.type as AppointmentType,
      priority: record.priority as AppointmentPriority,
      status: record.status as AppointmentStatus,
      details,
      roomId: record.room_id,
      departmentId: record.department_id,
      requiredEquipment: record.required_equipment,
      consultationFee: record.consultation_fee,
      additionalFees: record.additional_fees,
      paymentStatus: record.payment_status as PaymentStatus,
      paymentMethod: record.payment_method,
      checkedInAt: record.checked_in_at ? new Date(record.checked_in_at) : undefined,
      startedAt: record.started_at ? new Date(record.started_at) : undefined,
      completedAt: record.completed_at ? new Date(record.completed_at) : undefined,
      cancelledAt: record.cancelled_at ? new Date(record.cancelled_at) : undefined,
      cancellationReason: record.cancellation_reason,
      cancelledBy: record.cancelled_by,
      followUpAppointmentId: record.follow_up_appointment_id,
      parentAppointmentId: record.parent_appointment_id,
      seriesId: record.series_id,
      reminderSent: record.reminder_sent,
      reminderSentAt: record.reminder_sent_at ? new Date(record.reminder_sent_at) : undefined,
      confirmationRequired: record.confirmation_required,
      confirmedAt: record.confirmed_at ? new Date(record.confirmed_at) : undefined,
      confirmedBy: record.confirmed_by,
      version: record.version,
      createdBy: record.created_by,
      lastModifiedBy: record.last_modified_by,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    };

    // Reconstitute with UUID from database
    return Appointment.reconstitute(props, record.id);
  }
}

