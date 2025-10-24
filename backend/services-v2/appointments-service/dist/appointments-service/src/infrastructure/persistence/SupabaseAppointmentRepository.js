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
const TenantId_vo_1 = require("../../domain/value-objects/TenantId.vo");
/**
 * Supabase Appointment Repository
 * Implements persistence for Appointment aggregate
 */
class SupabaseAppointmentRepository {
    constructor(supabaseUrl, supabaseKey) {
        this.schema = 'appointments_schema';
        this.tableName = 'appointments';
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
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
        });
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
     * Find appointment by AppointmentId
     */
    async findById(appointmentId) {
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
    async findByPatientId(patientId, limit, offset) {
        let query = this.supabase
            .from(this.tableName)
            .select('*')
            .eq('patient_id', patientId)
            .order('appointment_date', { ascending: false })
            .order('appointment_time', { ascending: false });
        if (limit)
            query = query.limit(limit);
        if (offset)
            query = query.range(offset, offset + (limit || 10) - 1);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to find appointments: ${error.message}`);
        }
        return data.map(record => this.toDomain(record));
    }
    /**
     * Find appointments by doctor ID
     */
    async findByDoctorId(doctorId, limit, offset) {
        let query = this.supabase
            .from(this.tableName)
            .select('*')
            .eq('doctor_id', doctorId)
            .order('appointment_date', { ascending: true })
            .order('appointment_time', { ascending: true });
        if (limit)
            query = query.limit(limit);
        if (offset)
            query = query.range(offset, offset + (limit || 10) - 1);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to find appointments: ${error.message}`);
        }
        return data.map(record => this.toDomain(record));
    }
    /**
     * Find appointments by date range
     */
    async findByDateRange(startDate, endDate, limit, offset) {
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        let query = this.supabase
            .from(this.tableName)
            .select('*')
            .gte('appointment_date', startDateStr)
            .lte('appointment_date', endDateStr)
            .order('appointment_date', { ascending: true })
            .order('appointment_time', { ascending: true });
        if (limit)
            query = query.limit(limit);
        if (offset)
            query = query.range(offset, offset + (limit || 10) - 1);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to find appointments: ${error.message}`);
        }
        return data.map(record => this.toDomain(record));
    }
    /**
     * Delete appointment
     */
    async delete(appointmentId) {
        const { error } = await this.supabase
            .from(this.tableName)
            .delete()
            .eq('appointment_id', appointmentId.value);
        if (error) {
            throw new Error(`Failed to delete appointment: ${error.message}`);
        }
    }
    // ===== Additional methods to satisfy IAppointmentRepository interface =====
    async findByIdString(appointmentId) {
        return this.findByAppointmentId(appointmentId);
    }
    async findByProviderId(providerId, limit, offset) {
        return this.findByDoctorId(providerId);
    }
    async search(criteria) {
        let query = this.supabase.from(this.tableName).select('*', { count: 'exact' });
        // Apply filters
        if (criteria.patientId)
            query = query.eq('patient_id', criteria.patientId);
        if (criteria.providerId)
            query = query.eq('doctor_id', criteria.providerId);
        if (criteria.department)
            query = query.eq('department_id', criteria.department);
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
        if (criteria.appointmentType)
            query = query.eq('type', criteria.appointmentType.toUpperCase());
        if (criteria.priority)
            query = query.eq('priority', criteria.priority.toUpperCase());
        if (criteria.roomId)
            query = query.eq('room_id', criteria.roomId);
        // Sorting
        const sortBy = criteria.sortBy || 'startTime';
        const sortOrder = criteria.sortOrder || 'asc';
        if (sortBy === 'startTime') {
            query = query.order('appointment_date', { ascending: sortOrder === 'asc' });
            query = query.order('appointment_time', { ascending: sortOrder === 'asc' });
        }
        else {
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
    async checkConflicts(providerId, startTime, endTime, excludeAppointmentId) {
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
    async findUpcomingByPatientId(patientId, limit) {
        const now = new Date().toISOString();
        let query = this.supabase
            .from(this.tableName)
            .select('*')
            .eq('patient_id', patientId)
            .gte('start_at_utc', now)
            .not('status', 'in', '(CANCELLED,NO_SHOW,RESCHEDULED)')
            .order('start_at_utc', { ascending: true });
        if (limit)
            query = query.limit(limit);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to find upcoming appointments: ${error.message}`);
        }
        return (data || []).map(record => this.toDomain(record));
    }
    async findUpcomingByProviderId(providerId, limit) {
        const now = new Date().toISOString();
        let query = this.supabase
            .from(this.tableName)
            .select('*')
            .eq('doctor_id', providerId)
            .gte('start_at_utc', now)
            .not('status', 'in', '(CANCELLED,NO_SHOW,RESCHEDULED)')
            .order('start_at_utc', { ascending: true });
        if (limit)
            query = query.limit(limit);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to find upcoming appointments: ${error.message}`);
        }
        return (data || []).map(record => this.toDomain(record));
    }
    async findByStatus(status, limit, offset) {
        let query = this.supabase
            .from(this.tableName)
            .select('*')
            .eq('status', status.toUpperCase())
            .order('appointment_date', { ascending: false })
            .order('appointment_time', { ascending: false });
        if (limit)
            query = query.limit(limit);
        if (offset)
            query = query.range(offset, offset + (limit || 10) - 1);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to find appointments by status: ${error.message}`);
        }
        return (data || []).map(record => this.toDomain(record));
    }
    async findRequiringReminders(reminderType) {
        const now = new Date();
        let targetTime;
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
    async findOverdue() {
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
    async getStatistics(dateFrom, dateTo, providerId, department) {
        let query = this.supabase.from(this.tableName).select('*');
        if (dateFrom) {
            const dateStr = dateFrom.toISOString().split('T')[0];
            query = query.gte('appointment_date', dateStr);
        }
        if (dateTo) {
            const dateStr = dateTo.toISOString().split('T')[0];
            query = query.lte('appointment_date', dateStr);
        }
        if (providerId)
            query = query.eq('doctor_id', providerId);
        if (department)
            query = query.eq('department_id', department);
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
        const busyHours = [];
        const departmentStats = [];
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
    async count(criteria) {
        let query = this.supabase.from(this.tableName).select('*', { count: 'exact', head: true });
        if (criteria.patientId)
            query = query.eq('patient_id', criteria.patientId);
        if (criteria.providerId)
            query = query.eq('doctor_id', criteria.providerId);
        if (criteria.department)
            query = query.eq('department_id', criteria.department);
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
    async exists(appointmentId) {
        const appointment = await this.findById(appointmentId);
        return appointment !== null;
    }
    async findByIds(appointmentIds) {
        if (appointmentIds.length === 0)
            return [];
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
    async findByTimeSlot(providerId, startTime, endTime) {
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
    async findFollowUpAppointments(originalAppointmentId) {
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
    async getPatientHistory(patientId, limit, offset) {
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
        if (limit)
            query = query.limit(limit);
        if (offset)
            query = query.range(offset, offset + (limit || 10) - 1);
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
    async getProviderSchedule(providerId, startDate, endDate) {
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
    async findByDepartment(department, dateFrom, dateTo, limit, offset) {
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
        if (limit)
            query = query.limit(limit);
        if (offset)
            query = query.range(offset, offset + (limit || 10) - 1);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to find appointments by department: ${error.message}`);
        }
        return (data || []).map(record => this.toDomain(record));
    }
    async findEmergencyAppointments(limit) {
        let query = this.supabase
            .from(this.tableName)
            .select('*')
            .eq('priority', 'EMERGENCY')
            .not('status', 'in', '(COMPLETED,CANCELLED,NO_SHOW)')
            .order('created_at', { ascending: true });
        if (limit)
            query = query.limit(limit);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to find emergency appointments: ${error.message}`);
        }
        return (data || []).map(record => this.toDomain(record));
    }
    async findRequiringPreparation(dateFrom, dateTo) {
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
    async updateStatus(appointmentId, status) {
        const { error } = await this.supabase
            .from(this.tableName)
            .update({ status: status.toUpperCase(), updated_at: new Date().toISOString() })
            .eq('appointment_id', appointmentId.value);
        if (error) {
            throw new Error(`Failed to update appointment status: ${error.message}`);
        }
    }
    async bulkUpdate(appointments) {
        const records = appointments.map(apt => this.toPersistence(apt));
        const { error } = await this.supabase
            .from(this.tableName)
            .upsert(records, { onConflict: 'id' });
        if (error) {
            throw new Error(`Failed to bulk update appointments: ${error.message}`);
        }
    }
    async getDailySummary(date, providerId) {
        const dateStr = date.toISOString().split('T')[0];
        let query = this.supabase
            .from(this.tableName)
            .select('*')
            .eq('appointment_date', dateStr);
        if (providerId)
            query = query.eq('doctor_id', providerId);
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
        const busyPeriods = [];
        return {
            totalAppointments,
            scheduledAppointments,
            completedAppointments,
            cancelledAppointments,
            averageDuration,
            busyPeriods
        };
    }
    async findAvailableTimeSlots(providerId, date, duration) {
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
    async getUtilizationRate(providerId, department, dateFrom, dateTo) {
        let query = this.supabase.from(this.tableName).select('*');
        if (providerId)
            query = query.eq('doctor_id', providerId);
        if (department)
            query = query.eq('department_id', department);
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
    toPersistence(appointment) {
        const props = appointment.props; // Access private props
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
    toDomain(record) {
        const appointmentId = AppointmentId_vo_1.AppointmentId.create(record.appointment_id);
        const tenantId = TenantId_vo_1.TenantId.create(record.tenant_id);
        // Create TimeSlot with UTC timestamps
        const timeSlot = TimeSlot_vo_1.TimeSlot.createWithTimestamps(record.appointment_date, record.appointment_time, new Date(record.start_at_utc), new Date(record.end_at_utc));
        const details = AppointmentDetails_vo_1.AppointmentDetails.create(record.reason, record.chief_complaint, record.symptoms, record.notes, record.special_instructions);
        // Build complete props object for reconstitution
        const props = {
            appointmentId,
            tenantId,
            patientId: record.patient_id,
            doctorId: record.doctor_id,
            timeSlot,
            durationMinutes: record.duration_minutes,
            type: record.type,
            priority: record.priority,
            status: record.status,
            details,
            roomId: record.room_id,
            departmentId: record.department_id,
            requiredEquipment: record.required_equipment,
            consultationFee: record.consultation_fee,
            additionalFees: record.additional_fees,
            paymentStatus: record.payment_status,
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
        return Appointment_aggregate_1.Appointment.reconstitute(props, record.id);
    }
}
exports.SupabaseAppointmentRepository = SupabaseAppointmentRepository;
//# sourceMappingURL=SupabaseAppointmentRepository.js.map