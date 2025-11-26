"use strict";
/**
 * Supabase Appointment Read Model Repository - Infrastructure Layer
 * CQRS Read Model Repository implementation with Supabase
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAppointmentReadModelRepository = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
class SupabaseAppointmentReadModelRepository {
    constructor(supabaseUrl, supabaseKey) {
        this.tableName = "appointment_read_model";
        this.schema = "appointments_schema";
        this.client = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            db: { schema: this.schema },
        });
    }
    /**
     * Create new read model entry
     */
    async create(data) {
        // Helper to keep the most advanced status when reprocessing duplicated events
        const statusRank = (value) => {
            if (!value)
                return 0;
            const v = value.toUpperCase();
            const map = {
                CANCELLED: 100,
                COMPLETED: 90,
                CONFIRMED: 80,
                SCHEDULED: 50,
                PENDING: 40,
            };
            return map[v] ?? 10;
        };
        const paymentRank = (value) => {
            if (!value)
                return 0;
            const v = value.toUpperCase();
            const map = {
                PAID: 100,
                REFUNDED: 90,
                PARTIAL: 80,
                PENDING: 40,
                FAILED: 30,
            };
            return map[v] ?? 10;
        };
        // Check existing read-model to avoid overwriting advanced states (idempotent upsert)
        const { data: existing } = await this.client
            .from(this.tableName)
            .select("*")
            .eq("appointment_id", data.appointmentId)
            .maybeSingle();
        const record = {
            appointment_id: data.appointmentId,
            patient_id: data.patientId,
            doctor_id: data.doctorId,
            appointment_date: data.appointmentDate.toISOString().split("T")[0],
            appointment_time: data.appointmentTime,
            duration_minutes: data.durationMinutes,
            type: data.type,
            priority: data.priority,
            status: statusRank(existing?.status) > statusRank(data.status)
                ? existing?.status
                : data.status,
            payment_status: paymentRank(existing?.payment_status) > paymentRank(data.paymentStatus)
                ? existing?.payment_status
                : data.paymentStatus,
            room_id: data.roomId,
            department_id: data.departmentId,
            consultation_fee: data.consultationFee, // Billing reference only
            // Patient data
            patient_full_name: data.patientData?.patientFullName,
            patient_phone: data.patientData?.patientPhone,
            patient_email: data.patientData?.patientEmail,
            patient_date_of_birth: data.patientData?.patientDateOfBirth
                ?.toISOString()
                .split("T")[0],
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
            required_equipment: data.requiredEquipment || [],
            synced_at: new Date().toISOString(),
        };
        const { data: result, error } = await this.client
            .from(this.tableName)
            .upsert(record, { onConflict: "appointment_id" })
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to upsert appointment read model: ${error.message}`);
        }
        return this.toDomain(result);
    }
    /**
     * Update patient data for all appointments
     */
    async updatePatientData(patientId, patientData) {
        const updates = {
            patient_full_name: patientData.patientFullName,
            patient_phone: patientData.patientPhone,
            patient_email: patientData.patientEmail,
            patient_date_of_birth: patientData.patientDateOfBirth
                ?.toISOString()
                .split("T")[0],
            patient_gender: patientData.patientGender,
            patient_national_id: patientData.patientNationalId,
            patient_insurance_number: patientData.patientInsuranceNumber,
            patient_insurance_type: patientData.patientInsuranceType,
            patient_address: patientData.patientAddress,
            synced_at: new Date().toISOString(),
        };
        const { data, error } = await this.client
            .from(this.tableName)
            .update(updates)
            .eq("patient_id", patientId)
            .select("id");
        if (error) {
            throw new Error(`Failed to update patient data: ${error.message}`);
        }
        return data?.length || 0;
    }
    /**
     * Update doctor data for all appointments
     */
    async updateDoctorData(doctorId, doctorData) {
        const updates = {
            doctor_full_name: doctorData.doctorFullName,
            doctor_specialization: doctorData.doctorSpecialization,
            doctor_department: doctorData.doctorDepartment,
            doctor_license_number: doctorData.doctorLicenseNumber,
            doctor_phone: doctorData.doctorPhone,
            doctor_email: doctorData.doctorEmail,
            synced_at: new Date().toISOString(),
        };
        const { data, error } = await this.client
            .from(this.tableName)
            .update(updates)
            .eq("doctor_id", doctorId)
            .select("id");
        if (error) {
            throw new Error(`Failed to update doctor data: ${error.message}`);
        }
        return data?.length || 0;
    }
    /**
     * Update appointment status
     */
    async updateStatus(appointmentId, status) {
        const { error } = await this.client
            .from(this.tableName)
            .update({ status })
            .eq("appointment_id", appointmentId);
        if (error) {
            throw new Error(`Failed to update appointment status: ${error.message}`);
        }
    }
    /**
     * Update payment status
     */
    async updatePaymentStatus(appointmentId, paymentStatus) {
        const { error } = await this.client
            .from(this.tableName)
            .update({ payment_status: paymentStatus })
            .eq("appointment_id", appointmentId);
        if (error) {
            throw new Error(`Failed to update appointment payment status: ${error.message}`);
        }
    }
    /**
     * Update appointment schedule (date/time/duration) after reschedule
     */
    async updateSchedule(appointmentId, appointmentDate, appointmentTime, durationMinutes, status) {
        const updates = {
            appointment_date: appointmentDate.toISOString().split("T")[0],
            appointment_time: appointmentTime,
            duration_minutes: durationMinutes,
            synced_at: new Date().toISOString(),
        };
        if (status) {
            updates.status = status;
        }
        const { error } = await this.client
            .from(this.tableName)
            .update(updates)
            .eq("appointment_id", appointmentId);
        if (error) {
            throw new Error(`Failed to update appointment schedule: ${error.message}`);
        }
    }
    /**
     * Find by appointment ID
     */
    async findById(appointmentId) {
        // Prefer querying by business appointment_id to align with API usage;
        // fall back to database UUID id to avoid breaking existing flows.
        const { data, error } = await this.client
            .from(this.tableName)
            .select("*")
            .eq("appointment_id", appointmentId)
            .single();
        if (!error) {
            return this.toDomain(data);
        }
        if (error.code !== "PGRST116") {
            throw new Error(`Failed to find appointment: ${error.message}`);
        }
        const { data: byDbId, error: fallbackError } = await this.client
            .from(this.tableName)
            .select("*")
            .eq("id", appointmentId)
            .single();
        if (fallbackError) {
            if (fallbackError.code === "PGRST116") {
                return null;
            }
            throw new Error(`Failed to find appointment: ${fallbackError.message}`);
        }
        return this.toDomain(byDbId);
    }
    /**
     * Find by patient ID
     */
    async findByPatientId(patientId) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select("*")
            .eq("patient_id", patientId)
            .order("appointment_date", { ascending: false });
        if (error) {
            throw new Error(`Failed to find appointments by patient: ${error.message}`);
        }
        return (data || []).map((record) => this.toDomain(record));
    }
    /**
     * Find by doctor ID
     */
    async findByDoctorId(doctorId) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select("*")
            .eq("doctor_id", doctorId)
            .order("appointment_date", { ascending: false });
        if (error) {
            throw new Error(`Failed to find appointments by doctor: ${error.message}`);
        }
        return (data || []).map((record) => this.toDomain(record));
    }
    /**
     * Find by date range
     */
    async findByDateRange(startDate, endDate) {
        const { data, error } = await this.client
            .from(this.tableName)
            .select("*")
            .gte("appointment_date", startDate.toISOString().split("T")[0])
            .lte("appointment_date", endDate.toISOString().split("T")[0])
            .order("appointment_date", { ascending: true });
        if (error) {
            throw new Error(`Failed to find appointments by date range: ${error.message}`);
        }
        return (data || []).map((record) => this.toDomain(record));
    }
    /**
     * Find with filters
     */
    async findWithFilters(filters) {
        let query = this.client.from(this.tableName).select("*");
        if (filters.patientId) {
            query = query.eq("patient_id", filters.patientId);
        }
        if (filters.doctorId) {
            query = query.eq("doctor_id", filters.doctorId);
        }
        if (filters.startDate) {
            query = query.gte("appointment_date", filters.startDate.toISOString().split("T")[0]);
        }
        if (filters.endDate) {
            query = query.lte("appointment_date", filters.endDate.toISOString().split("T")[0]);
        }
        if (filters.status) {
            query = query.eq("status", filters.status);
        }
        if (filters.type) {
            query = query.eq("type", filters.type);
        }
        if (filters.priority) {
            query = query.eq("priority", filters.priority);
        }
        if (filters.departmentId) {
            query = query.eq("department_id", filters.departmentId);
        }
        query = query.order("appointment_date", { ascending: false });
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
        return (data || []).map((record) => this.toDomain(record));
    }
    /**
     * Count with filters
     */
    async countWithFilters(filters) {
        let query = this.client
            .from(this.tableName)
            .select("id", { count: "exact", head: true });
        if (filters.patientId) {
            query = query.eq("patient_id", filters.patientId);
        }
        if (filters.doctorId) {
            query = query.eq("doctor_id", filters.doctorId);
        }
        if (filters.startDate) {
            query = query.gte("appointment_date", filters.startDate.toISOString().split("T")[0]);
        }
        if (filters.endDate) {
            query = query.lte("appointment_date", filters.endDate.toISOString().split("T")[0]);
        }
        if (filters.status) {
            query = query.eq("status", filters.status);
        }
        if (filters.type) {
            query = query.eq("type", filters.type);
        }
        if (filters.priority) {
            query = query.eq("priority", filters.priority);
        }
        if (filters.departmentId) {
            query = query.eq("department_id", filters.departmentId);
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
    async delete(appointmentId) {
        const { error } = await this.client
            .from(this.tableName)
            .delete()
            .eq("appointment_id", appointmentId);
        if (error) {
            throw new Error(`Failed to delete appointment read model: ${error.message}`);
        }
    }
    /**
     * Map database record to domain model
     */
    toDomain(record) {
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
            patientDateOfBirth: record.patient_date_of_birth
                ? new Date(record.patient_date_of_birth)
                : undefined,
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
            checkedInAt: record.checked_in_at
                ? new Date(record.checked_in_at)
                : undefined,
            startedAt: record.started_at ? new Date(record.started_at) : undefined,
            completedAt: record.completed_at
                ? new Date(record.completed_at)
                : undefined,
            cancelledAt: record.cancelled_at
                ? new Date(record.cancelled_at)
                : undefined,
            cancellationReason: record.cancellation_reason,
            createdAt: new Date(record.created_at),
            updatedAt: new Date(record.updated_at),
            syncedAt: new Date(record.synced_at),
        };
    }
}
exports.SupabaseAppointmentReadModelRepository = SupabaseAppointmentReadModelRepository;
//# sourceMappingURL=SupabaseAppointmentReadModelRepository.js.map