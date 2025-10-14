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
import { Appointment, AppointmentType, AppointmentPriority, AppointmentStatus, PaymentStatus } from '../../domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../domain/value-objects/AppointmentId.vo';
import { TimeSlot } from '../../domain/value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../../domain/value-objects/AppointmentDetails.vo';

export interface IAppointmentRepository {
  save(appointment: Appointment): Promise<void>;
  findById(id: string): Promise<Appointment | null>;
  findByAppointmentId(appointmentId: string): Promise<Appointment | null>;
  findByPatientId(patientId: string): Promise<Appointment[]>;
  findByDoctorId(doctorId: string): Promise<Appointment[]>;
  findByDateRange(startDate: string, endDate: string): Promise<Appointment[]>;
  delete(id: string): Promise<void>;
}

interface DatabaseAppointmentRecord {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
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
  private readonly supabase: SupabaseClient;
  private readonly schema: string = 'scheduling_schema';
  private readonly tableName: string = 'appointments';

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'scheduling_schema',
      },
      global: {
        headers: {
          'X-Client-Info': 'scheduling-service',
        },
      },
    });
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
   * Find appointment by UUID
   */
  async findById(id: string): Promise<Appointment | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
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
  async findByPatientId(patientId: string): Promise<Appointment[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false });

    if (error) {
      throw new Error(`Failed to find appointments: ${error.message}`);
    }

    return data.map(record => this.toDomain(record));
  }

  /**
   * Find appointments by doctor ID
   */
  async findByDoctorId(doctorId: string): Promise<Appointment[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('doctor_id', doctorId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) {
      throw new Error(`Failed to find appointments: ${error.message}`);
    }

    return data.map(record => this.toDomain(record));
  }

  /**
   * Find appointments by date range
   */
  async findByDateRange(startDate: string, endDate: string): Promise<Appointment[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });

    if (error) {
      throw new Error(`Failed to find appointments: ${error.message}`);
    }

    return data.map(record => this.toDomain(record));
  }

  /**
   * Delete appointment
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete appointment: ${error.message}`);
    }
  }

  /**
   * Convert domain aggregate to database record
   */
  private toPersistence(appointment: Appointment): DatabaseAppointmentRecord {
    const props = (appointment as any).props; // Access private props

    return {
      id: appointment.id,
      appointment_id: props.appointmentId.value,
      patient_id: props.patientId,
      doctor_id: props.doctorId,
      appointment_date: props.timeSlot.appointmentDate,
      appointment_time: props.timeSlot.appointmentTime,
      duration_minutes: props.durationMinutes,
      type: props.type,
      priority: props.priority,
      status: props.status,
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
      payment_status: props.paymentStatus,
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
    const timeSlot = TimeSlot.create(record.appointment_date, record.appointment_time);
    const details = AppointmentDetails.create(
      record.reason,
      record.chief_complaint,
      record.symptoms,
      record.notes,
      record.special_instructions
    );

    // Reconstruct appointment using create method
    const appointment = Appointment.create(
      appointmentId,
      record.patient_id,
      record.doctor_id,
      timeSlot,
      record.duration_minutes,
      record.type as AppointmentType,
      record.priority as AppointmentPriority,
      details,
      record.consultation_fee,
      record.created_by,
      record.room_id,
      record.department_id,
      record.required_equipment
    );

    // Set additional properties that are not in create method
    const props = (appointment as any).props;
    props.status = record.status as AppointmentStatus;
    props.paymentStatus = record.payment_status as PaymentStatus;
    props.paymentMethod = record.payment_method;
    props.additionalFees = record.additional_fees;
    props.checkedInAt = record.checked_in_at ? new Date(record.checked_in_at) : undefined;
    props.startedAt = record.started_at ? new Date(record.started_at) : undefined;
    props.completedAt = record.completed_at ? new Date(record.completed_at) : undefined;
    props.cancelledAt = record.cancelled_at ? new Date(record.cancelled_at) : undefined;
    props.cancellationReason = record.cancellation_reason;
    props.cancelledBy = record.cancelled_by;
    props.followUpAppointmentId = record.follow_up_appointment_id;
    props.parentAppointmentId = record.parent_appointment_id;
    props.seriesId = record.series_id;
    props.reminderSent = record.reminder_sent;
    props.reminderSentAt = record.reminder_sent_at ? new Date(record.reminder_sent_at) : undefined;
    props.confirmationRequired = record.confirmation_required;
    props.confirmedAt = record.confirmed_at ? new Date(record.confirmed_at) : undefined;
    props.confirmedBy = record.confirmed_by;
    props.lastModifiedBy = record.last_modified_by;
    props.createdAt = new Date(record.created_at);
    props.updatedAt = new Date(record.updated_at);

    // Set aggregate ID
    (appointment as any).id = record.id;

    return appointment;
  }
}

