/**
 * Supabase Appointment Read Model Repository - Infrastructure Layer
 * CQRS Read Model Repository implementation with Supabase
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IAppointmentReadModelRepository } from '../../domain/repositories/IAppointmentReadModelRepository';
import {
  AppointmentReadModel,
  CreateAppointmentReadModelData,
  PatientData,
  DoctorData,
  AppointmentReadModelFilters
} from '../../domain/read-models/AppointmentReadModel';

export class SupabaseAppointmentReadModelRepository implements IAppointmentReadModelRepository {
  private client: SupabaseClient;
  private readonly tableName = 'appointment_read_model';
  private readonly schema = 'appointments_schema';

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey, {
      db: { schema: this.schema }
    }) as unknown as SupabaseClient;
  }

  /**
   * Create new read model entry
   */
  async create(data: CreateAppointmentReadModelData): Promise<AppointmentReadModel> {
    const record = {
      appointment_id: data.appointmentId,
      patient_id: data.patientId,
      doctor_id: data.doctorId,
      appointment_date: data.appointmentDate.toISOString().split('T')[0],
      appointment_time: data.appointmentTime,
      duration_minutes: data.durationMinutes,
      type: data.type,
      priority: data.priority,
      status: data.status,
      payment_status: data.paymentStatus,
      room_id: data.roomId,
      department_id: data.departmentId,
      consultation_fee: data.consultationFee, // Billing reference only

      // Patient data
      patient_full_name: data.patientData?.patientFullName,
      patient_phone: data.patientData?.patientPhone,
      patient_email: data.patientData?.patientEmail,
      patient_date_of_birth: data.patientData?.patientDateOfBirth?.toISOString().split('T')[0],
      patient_gender: data.patientData?.patientGender,
      patient_national_id: data.patientData?.patientNationalId,
      patient_insurance_number: data.patientData?.patientInsuranceNumber,
      patient_insurance_type: data.patientData?.patientInsuranceType,
      patient_address: data.patientData?.patientAddress,

      // Doctor data
      doctor_full_name: data.doctorData?.doctorFullName,
      doctor_specialization: data.doctorData?.doctorSpecialization,
      doctor_department: data.doctorData?.doctorDepartment,
      doctor_license_number: data.doctorData?.doctorLicenseNumber,
      doctor_phone: data.doctorData?.doctorPhone,
      doctor_email: data.doctorData?.doctorEmail,

      // Appointment details
      reason: data.reason,
      chief_complaint: data.chiefComplaint,
      symptoms: data.symptoms || [],
      notes: data.notes,
      special_instructions: data.specialInstructions,
      required_equipment: data.requiredEquipment || []
    };

    const { data: result, error } = await this.client
      .from(this.tableName)
      .insert(record)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create appointment read model: ${error.message}`);
    }

    return this.toDomain(result);
  }

  /**
   * Update patient data for all appointments
   */
  async updatePatientData(patientId: string, patientData: PatientData): Promise<number> {
    const updates = {
      patient_full_name: patientData.patientFullName,
      patient_phone: patientData.patientPhone,
      patient_email: patientData.patientEmail,
      patient_date_of_birth: patientData.patientDateOfBirth?.toISOString().split('T')[0],
      patient_gender: patientData.patientGender,
      patient_national_id: patientData.patientNationalId,
      patient_insurance_number: patientData.patientInsuranceNumber,
      patient_insurance_type: patientData.patientInsuranceType,
      patient_address: patientData.patientAddress,
      synced_at: new Date().toISOString()
    };

    const { data, error } = await this.client
      .from(this.tableName)
      .update(updates)
      .eq('patient_id', patientId)
      .select('id');

    if (error) {
      throw new Error(`Failed to update patient data: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Update doctor data for all appointments
   */
  async updateDoctorData(doctorId: string, doctorData: DoctorData): Promise<number> {
    const updates = {
      doctor_full_name: doctorData.doctorFullName,
      doctor_specialization: doctorData.doctorSpecialization,
      doctor_department: doctorData.doctorDepartment,
      doctor_license_number: doctorData.doctorLicenseNumber,
      doctor_phone: doctorData.doctorPhone,
      doctor_email: doctorData.doctorEmail,
      synced_at: new Date().toISOString()
    };

    const { data, error } = await this.client
      .from(this.tableName)
      .update(updates)
      .eq('doctor_id', doctorId)
      .select('id');

    if (error) {
      throw new Error(`Failed to update doctor data: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Update appointment status
   */
  async updateStatus(appointmentId: string, status: string): Promise<void> {
    const { error } = await this.client
      .from(this.tableName)
      .update({ status })
      .eq('appointment_id', appointmentId);

    if (error) {
      throw new Error(`Failed to update appointment status: ${error.message}`);
    }
  }

  /**
   * Find by appointment ID
   */
  async findById(appointmentId: string): Promise<AppointmentReadModel | null> {
    // Check if it's UUID format (database id) or business format (appointment_id)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appointmentId);

    let query = this.client.from(this.tableName).select('*');

    if (isUUID) {
      query = query.eq('id', appointmentId);
    } else {
      query = query.eq('appointment_id', appointmentId);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find appointment: ${error.message}`);
    }

    return this.toDomain(data);
  }

  /**
   * Find by patient ID
   */
  async findByPatientId(patientId: string): Promise<AppointmentReadModel[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to find appointments by patient: ${error.message}`);
    }

    return (data || []).map(record => this.toDomain(record));
  }

  /**
   * Find by doctor ID
   */
  async findByDoctorId(doctorId: string): Promise<AppointmentReadModel[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('doctor_id', doctorId)
      .order('appointment_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to find appointments by doctor: ${error.message}`);
    }

    return (data || []).map(record => this.toDomain(record));
  }

  /**
   * Find by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<AppointmentReadModel[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .gte('appointment_date', startDate.toISOString().split('T')[0])
      .lte('appointment_date', endDate.toISOString().split('T')[0])
      .order('appointment_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to find appointments by date range: ${error.message}`);
    }

    return (data || []).map(record => this.toDomain(record));
  }

  /**
   * Find with filters
   */
  async findWithFilters(filters: AppointmentReadModelFilters): Promise<AppointmentReadModel[]> {
    let query = this.client.from(this.tableName).select('*');

    if (filters.patientId) {
      query = query.eq('patient_id', filters.patientId);
    }

    if (filters.doctorId) {
      query = query.eq('doctor_id', filters.doctorId);
    }

    if (filters.startDate) {
      query = query.gte('appointment_date', filters.startDate.toISOString().split('T')[0]);
    }

    if (filters.endDate) {
      query = query.lte('appointment_date', filters.endDate.toISOString().split('T')[0]);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters.departmentId) {
      query = query.eq('department_id', filters.departmentId);
    }

    query = query.order('appointment_date', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find appointments with filters: ${error.message}`);
    }

    return (data || []).map(record => this.toDomain(record));
  }

  /**
   * Count with filters
   */
  async countWithFilters(filters: AppointmentReadModelFilters): Promise<number> {
    let query = this.client.from(this.tableName).select('id', { count: 'exact', head: true });

    if (filters.patientId) {
      query = query.eq('patient_id', filters.patientId);
    }

    if (filters.doctorId) {
      query = query.eq('doctor_id', filters.doctorId);
    }

    if (filters.startDate) {
      query = query.gte('appointment_date', filters.startDate.toISOString().split('T')[0]);
    }

    if (filters.endDate) {
      query = query.lte('appointment_date', filters.endDate.toISOString().split('T')[0]);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters.departmentId) {
      query = query.eq('department_id', filters.departmentId);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count appointments: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Delete read model entry
   */
  async delete(appointmentId: string): Promise<void> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('appointment_id', appointmentId);

    if (error) {
      throw new Error(`Failed to delete appointment read model: ${error.message}`);
    }
  }

  /**
   * Map database record to domain model
   */
  private toDomain(record: any): AppointmentReadModel {
    return {
      id: record.id,
      appointmentId: record.appointment_id,
      patientId: record.patient_id,
      doctorId: record.doctor_id,
      appointmentDate: new Date(record.appointment_date),
      appointmentTime: record.appointment_time,
      durationMinutes: record.duration_minutes,
      type: record.type,
      priority: record.priority,
      status: record.status,
      paymentStatus: record.payment_status,
      roomId: record.room_id,
      departmentId: record.department_id,
      consultationFee: parseFloat(record.consultation_fee), // Billing reference only

      patientFullName: record.patient_full_name,
      patientPhone: record.patient_phone,
      patientEmail: record.patient_email,
      patientDateOfBirth: record.patient_date_of_birth ? new Date(record.patient_date_of_birth) : undefined,
      patientGender: record.patient_gender,
      patientNationalId: record.patient_national_id,
      patientInsuranceNumber: record.patient_insurance_number,
      patientInsuranceType: record.patient_insurance_type,
      patientAddress: record.patient_address,

      doctorFullName: record.doctor_full_name,
      doctorSpecialization: record.doctor_specialization,
      doctorDepartment: record.doctor_department,
      doctorLicenseNumber: record.doctor_license_number,
      doctorPhone: record.doctor_phone,
      doctorEmail: record.doctor_email,

      reason: record.reason,
      chiefComplaint: record.chief_complaint,
      symptoms: record.symptoms || [],
      notes: record.notes,
      specialInstructions: record.special_instructions,
      requiredEquipment: record.required_equipment || [],

      checkedInAt: record.checked_in_at ? new Date(record.checked_in_at) : undefined,
      startedAt: record.started_at ? new Date(record.started_at) : undefined,
      completedAt: record.completed_at ? new Date(record.completed_at) : undefined,
      cancelledAt: record.cancelled_at ? new Date(record.cancelled_at) : undefined,
      cancellationReason: record.cancellation_reason,

      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      syncedAt: new Date(record.synced_at)
    };
  }
}

