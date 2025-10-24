"use strict";
/**
 * Supabase Appointment Repository - Infrastructure Layer
 * V3 Clean Architecture + DDD Implementation
 * Matches 100% with scheduling_schema database
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAppointmentRepository = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const Appointment_aggregate_1 = require("../../domain/aggregates/Appointment.aggregate");
const AppointmentId_vo_1 = require("../../domain/value-objects/AppointmentId.vo");
const TimeSlot_vo_1 = require("../../domain/value-objects/TimeSlot.vo");
const AppointmentDetails_vo_1 = require("../../domain/value-objects/AppointmentDetails.vo");
/**
 * Supabase Appointment Repository
 * Implements persistence for Appointment aggregate
 */
class SupabaseAppointmentRepository {
    constructor(supabaseUrl, supabaseKey) {
        this.schema = 'scheduling_schema';
        this.tableName = 'appointments';
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    }
    /**
     * Save appointment (create or update)
     */
    async save(appointment) {
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
    async findById(id) {
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
    async findByAppointmentId(appointmentId) {
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
    async findByPatientId(patientId) {
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
    async findByDoctorId(doctorId) {
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
    async findByDateRange(startDate, endDate) {
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
    async delete(id) {
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
    toPersistence(appointment) {
        const props = appointment.props; // Access private props
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
    toDomain(record) {
        const appointmentId = AppointmentId_vo_1.AppointmentId.create(record.appointment_id);
        const timeSlot = TimeSlot_vo_1.TimeSlot.create(record.appointment_date, record.appointment_time);
        const details = AppointmentDetails_vo_1.AppointmentDetails.create(record.reason, record.chief_complaint, record.symptoms, record.notes, record.special_instructions);
        // Reconstruct appointment using create method
        const appointment = Appointment_aggregate_1.Appointment.create(appointmentId, record.patient_id, record.doctor_id, timeSlot, record.duration_minutes, record.type, record.priority, details, record.consultation_fee, record.created_by, record.room_id, record.department_id, record.required_equipment);
        // Set additional properties that are not in create method
        const props = appointment.props;
        props.status = record.status;
        props.paymentStatus = record.payment_status;
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
        appointment.id = record.id;
        return appointment;
    }
}
exports.SupabaseAppointmentRepository = SupabaseAppointmentRepository;
//# sourceMappingURL=SupabaseAppointmentRepository.js.map