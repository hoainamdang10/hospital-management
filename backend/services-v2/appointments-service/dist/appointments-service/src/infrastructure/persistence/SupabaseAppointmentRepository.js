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
    constructor(supabaseUrl, supabaseKey, eventPublisher) {
        this.eventPublisher = eventPublisher;
        this.schema = "appointments_schema";
        this.tableName = "appointments";
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
            db: {
                schema: "appointments_schema",
            },
            global: {
                headers: {
                    "X-Client-Info": "appointments-service",
                },
            },
        });
    }
    /**
     * Save appointment (create or update)
     */
    async save(appointment) {
        const record = this.toPersistence(appointment);
        console.log("[Repository] Saving appointment record:", JSON.stringify(record, null, 2));
        const { error } = await this.supabase
            .from(this.tableName)
            .upsert(record, { onConflict: "id" });
        if (error) {
            console.error("[Repository] Database error:", error);
            throw new Error(`Failed to save appointment: ${error.message}`);
        }
        // Publish domain events after successful persistence
        await this.publishDomainEvents(appointment);
    }
    /**
     * Publish domain events from aggregate
     *
     * ✅ ENRICHMENT: Get data from appointment_read_model before publishing
     * This provides denormalized names for Notifications Service
     */
    async publishDomainEvents(appointment) {
        if (!this.eventPublisher) {
            console.debug("[SupabaseAppointmentRepository] Event publisher not configured, skipping event publishing");
            return;
        }
        const events = appointment.getUncommittedEvents();
        if (events.length === 0) {
            return;
        }
        try {
            // ===== ENRICHMENT: Fetch read model for names =====
            let readModel = null;
            try {
                const { data, error } = await this.supabase
                    .from("appointment_read_model")
                    .select("patient_full_name, patient_email, patient_phone, doctor_full_name, doctor_specialization, doctor_department, doctor_email, duration_minutes, consultation_fee")
                    .eq("appointment_id", appointment.getAppointmentId().value)
                    .single();
                if (!error && data) {
                    readModel = data;
                    console.debug("[SupabaseAppointmentRepository] Read model fetched for enrichment", {
                        appointmentId: appointment.getAppointmentId().value,
                        hasPatientName: !!data.patient_full_name,
                        hasDoctorName: !!data.doctor_full_name,
                    });
                }
            }
            catch (readModelError) {
                console.warn("[SupabaseAppointmentRepository] Failed to fetch read model for enrichment (non-critical)", {
                    appointmentId: appointment.getAppointmentId().value,
                    error: readModelError instanceof Error
                        ? readModelError.message
                        : "Unknown",
                });
                // Continue without enrichment - events still published with IDs
            }
            // ===== ENRICH EVENTS BEFORE PUBLISHING =====
            for (const event of events) {
                // Enrich AppointmentConfirmedEvent with read model data
                if (event.eventType === "AppointmentConfirmed" && readModel) {
                    event.patientName = readModel.patient_full_name;
                    event.doctorName = readModel.doctor_full_name;
                    event.departmentName = readModel.doctor_department;
                    event.durationMinutes = readModel.duration_minutes;
                    event.consultationFee = readModel.consultation_fee;
                    console.debug("[SupabaseAppointmentRepository] Event enriched with read model data", {
                        eventType: event.eventType,
                        patientName: readModel.patient_full_name,
                        doctorName: readModel.doctor_full_name,
                    });
                }
                // Enrich other events if needed (AppointmentScheduled, AppointmentCancelled, etc.)
                if ((event.eventType === "AppointmentScheduled" ||
                    event.eventType === "AppointmentCancelled") &&
                    readModel) {
                    event.patientName = readModel.patient_full_name;
                    event.doctorName = readModel.doctor_full_name;
                    event.departmentName = readModel.doctor_department;
                }
            }
            // Publish enriched events in batch
            await this.eventPublisher.publishBatch(events);
            // Mark events as committed after successful publishing
            appointment.markEventsAsCommitted();
            console.info("[SupabaseAppointmentRepository] Domain events published", {
                appointmentId: appointment.getAppointmentId().value,
                eventCount: events.length,
                eventTypes: events.map((event) => event.eventType),
                enriched: !!readModel,
            });
        }
        catch (error) {
            console.error("[SupabaseAppointmentRepository] Failed to publish domain events", {
                appointmentId: appointment.getAppointmentId().value,
                error: error instanceof Error ? error.message : "Unknown error",
                eventCount: events.length,
            });
            // Don't throw - event publishing failure shouldn't fail the transaction
            // Events will be retried on next save or can be published via outbox pattern
        }
    }
    /**
     * Find appointment by AppointmentId
     */
    async findById(appointmentId) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select("*")
            .eq("appointment_id", appointmentId.value)
            .single();
        if (error) {
            if (error.code === "PGRST116") {
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
            .select("*")
            .eq("appointment_id", appointmentId)
            .single();
        if (error) {
            if (error.code === "PGRST116") {
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
            .select("*")
            .eq("patient_id", patientId)
            .order("appointment_date", { ascending: false })
            .order("appointment_time", { ascending: false });
        if (limit)
            query = query.limit(limit);
        if (offset)
            query = query.range(offset, offset + (limit || 10) - 1);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to find appointments: ${error.message}`);
        }
        return data.map((record) => this.toDomain(record));
    }
    /**
     * Find appointments by doctor ID
     */
    async findByDoctorId(doctorId, limit, offset) {
        let query = this.supabase
            .from(this.tableName)
            .select("*")
            .eq("doctor_id", doctorId)
            .order("appointment_date", { ascending: true })
            .order("appointment_time", { ascending: true });
        if (limit)
            query = query.limit(limit);
        if (offset)
            query = query.range(offset, offset + (limit || 10) - 1);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to find appointments: ${error.message}`);
        }
        return data.map((record) => this.toDomain(record));
    }
    /**
     * Find appointments by doctor ID and specific date
     * Convenience method that wraps findByTimeSlot for a full day
     */
    async findByDoctorAndDate(doctorId, date) {
        // Calculate start and end of day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        // Delegate to findByTimeSlot
        return this.findByTimeSlot(doctorId, startOfDay, endOfDay);
    }
    /**
     * Find appointments by date range
     */
    async findByDateRange(startDate, endDate, limit, offset) {
        const startDateStr = startDate.toISOString().split("T")[0];
        const endDateStr = endDate.toISOString().split("T")[0];
        let query = this.supabase
            .from(this.tableName)
            .select("*")
            .gte("appointment_date", startDateStr)
            .lte("appointment_date", endDateStr)
            .order("appointment_date", { ascending: true })
            .order("appointment_time", { ascending: true });
        if (limit)
            query = query.limit(limit);
        if (offset)
            query = query.range(offset, offset + (limit || 10) - 1);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to find appointments: ${error.message}`);
        }
        return data.map((record) => this.toDomain(record));
    }
    /**
     * Delete appointment
     */
    async delete(appointmentId) {
        const { error } = await this.supabase
            .from(this.tableName)
            .delete()
            .eq("appointment_id", appointmentId.value);
        if (error) {
            throw new Error(`Failed to delete appointment: ${error.message}`);
        }
    }
    // ===== Additional methods to satisfy IAppointmentRepository interface =====
    async findByIdString(id) {
        // Check if it's UUID format (database id) or business format (appointment_id)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (isUUID) {
            // Find by database UUID (id column)
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select("*")
                .eq("id", id)
                .single();
            if (error) {
                if (error.code === "PGRST116") {
                    return null; // Not found
                }
                throw new Error(`Failed to find appointment by UUID: ${error.message}`);
            }
            return this.toDomain(data);
        }
        else {
            // Find by business ID (appointment_id column)
            return this.findByAppointmentId(id);
        }
    }
    async findByProviderId(providerId, limit, offset) {
        return this.findByDoctorId(providerId);
    }
    async search(criteria) {
        let query = this.supabase
            .from(this.tableName)
            .select("*", { count: "exact" });
        // Apply filters
        if (criteria.patientId)
            query = query.eq("patient_id", criteria.patientId);
        if (criteria.providerId)
            query = query.eq("doctor_id", criteria.providerId);
        if (criteria.department)
            query = query.eq("department_id", criteria.department);
        if (criteria.status && criteria.status.length > 0) {
            query = query.in("status", criteria.status.map((s) => s.toUpperCase()));
        }
        if (criteria.dateFrom) {
            const dateStr = criteria.dateFrom.toISOString().split("T")[0];
            query = query.gte("appointment_date", dateStr);
        }
        if (criteria.dateTo) {
            const dateStr = criteria.dateTo.toISOString().split("T")[0];
            query = query.lte("appointment_date", dateStr);
        }
        if (criteria.appointmentType)
            query = query.eq("type", criteria.appointmentType.toUpperCase());
        if (criteria.priority)
            query = query.eq("priority", criteria.priority.toUpperCase());
        if (criteria.roomId)
            query = query.eq("room_id", criteria.roomId);
        // Sorting
        const sortBy = criteria.sortBy || "startTime";
        const sortOrder = criteria.sortOrder || "asc";
        if (sortBy === "startTime") {
            query = query.order("appointment_date", {
                ascending: sortOrder === "asc",
            });
            query = query.order("appointment_time", {
                ascending: sortOrder === "asc",
            });
        }
        else {
            query = query.order(sortBy === "createdAt" ? "created_at" : sortBy, {
                ascending: sortOrder === "asc",
            });
        }
        // Pagination
        const limit = criteria.limit || 50;
        const offset = criteria.offset || 0;
        query = query.range(offset, offset + limit - 1);
        const { data, error, count } = await query;
        if (error) {
            throw new Error(`Failed to search appointments: ${error.message}`);
        }
        const appointments = (data || []).map((record) => this.toDomain(record));
        const totalCount = count || 0;
        return {
            appointments,
            totalCount,
            hasMore: totalCount > offset + appointments.length,
        };
    }
    async checkConflicts(providerId, startTime, endTime, excludeAppointmentId) {
        const startUtc = startTime.toISOString();
        const endUtc = endTime.toISOString();
        let query = this.supabase
            .from(this.tableName)
            .select("*")
            .eq("doctor_id", providerId)
            .not("status", "in", "(CANCELLED,NO_SHOW,RESCHEDULED)")
            .lt("start_at_utc", endUtc)
            .gt("end_at_utc", startUtc);
        if (excludeAppointmentId) {
            query = query.neq("appointment_id", excludeAppointmentId);
        }
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to check conflicts: ${error.message}`);
        }
        const conflicts = (data || []).map((record) => ({
            appointmentId: record.appointment_id,
            startTime: new Date(record.start_at_utc),
            endTime: new Date(record.end_at_utc),
            reason: `Overlaps with existing appointment ${record.appointment_id}`,
        }));
        return {
            hasConflicts: conflicts.length > 0,
            conflicts,
        };
    }
    async findUpcomingByPatientId(patientId, limit) {
        const now = new Date().toISOString();
        let query = this.supabase
            .from(this.tableName)
            .select("*")
            .eq("patient_id", patientId)
            .gte("start_at_utc", now)
            .not("status", "in", "(CANCELLED,NO_SHOW,RESCHEDULED)")
            .order("start_at_utc", { ascending: true });
        if (limit)
            query = query.limit(limit);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to find upcoming appointments: ${error.message}`);
        }
        return (data || []).map((record) => this.toDomain(record));
    }
    async findUpcomingByProviderId(providerId, limit) {
        const now = new Date().toISOString();
        let query = this.supabase
            .from(this.tableName)
            .select("*")
            .eq("doctor_id", providerId)
            .gte("start_at_utc", now)
            .not("status", "in", "(CANCELLED,NO_SHOW,RESCHEDULED)")
            .order("start_at_utc", { ascending: true });
        if (limit)
            query = query.limit(limit);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to find upcoming appointments: ${error.message}`);
        }
        return (data || []).map((record) => this.toDomain(record));
    }
    async findByStatus(status, limit, offset) {
        let query = this.supabase
            .from(this.tableName)
            .select("*")
            .eq("status", status.toUpperCase())
            .order("appointment_date", { ascending: false })
            .order("appointment_time", { ascending: false });
        if (limit)
            query = query.limit(limit);
        if (offset)
            query = query.range(offset, offset + (limit || 10) - 1);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to find appointments by status: ${error.message}`);
        }
        return (data || []).map((record) => this.toDomain(record));
    }
    async findRequiringReminders(reminderType) {
        const now = new Date();
        let targetTime;
        // Calculate target time based on reminder type
        switch (reminderType) {
            case "24h":
                targetTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                break;
            case "2h":
                targetTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                break;
            case "30min":
                targetTime = new Date(now.getTime() + 30 * 60 * 1000);
                break;
        }
        const targetTimeStr = targetTime.toISOString();
        const nowStr = now.toISOString();
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select("*")
            .eq("reminder_sent", false)
            .eq("status", "SCHEDULED")
            .gte("start_at_utc", nowStr)
            .lte("start_at_utc", targetTimeStr);
        if (error) {
            throw new Error(`Failed to find appointments requiring reminders: ${error.message}`);
        }
        return (data || []).map((record) => this.toDomain(record));
    }
    async findOverdue() {
        const now = new Date().toISOString();
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select("*")
            .eq("status", "SCHEDULED")
            .lt("start_at_utc", now)
            .order("start_at_utc", { ascending: true });
        if (error) {
            throw new Error(`Failed to find overdue appointments: ${error.message}`);
        }
        return (data || []).map((record) => this.toDomain(record));
    }
    /**
     * Find expired unpaid appointments
     * Flow 3 - Phase 1B: Payment Timeout Handling
     * Query: payment_status = 'PENDING' AND payment_deadline < NOW()
     */
    async findExpiredUnpaidAppointments() {
        const now = new Date().toISOString();
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select("*")
            .eq("payment_status", "PENDING")
            .not("payment_deadline", "is", null)
            .lt("payment_deadline", now)
            .order("payment_deadline", { ascending: true });
        if (error) {
            throw new Error(`Failed to find expired unpaid appointments: ${error.message}`);
        }
        return (data || []).map((record) => this.toDomain(record));
    }
    async getStatistics(dateFrom, dateTo, providerId, department) {
        let query = this.supabase.from(this.tableName).select("*");
        if (dateFrom) {
            const dateStr = dateFrom.toISOString().split("T")[0];
            query = query.gte("appointment_date", dateStr);
        }
        if (dateTo) {
            const dateStr = dateTo.toISOString().split("T")[0];
            query = query.lte("appointment_date", dateStr);
        }
        if (providerId)
            query = query.eq("doctor_id", providerId);
        if (department)
            query = query.eq("department_id", department);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to get statistics: ${error.message}`);
        }
        const appointments = data || [];
        const totalAppointments = appointments.length;
        const scheduledAppointments = appointments.filter((a) => a.status === "SCHEDULED").length;
        const confirmedAppointments = appointments.filter((a) => a.confirmed_at !== null).length;
        const completedAppointments = appointments.filter((a) => a.status === "COMPLETED").length;
        const cancelledAppointments = appointments.filter((a) => a.status === "CANCELLED").length;
        const noShowAppointments = appointments.filter((a) => a.status === "NO_SHOW").length;
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
            departmentStats,
        };
    }
    async count(criteria) {
        let query = this.supabase
            .from(this.tableName)
            .select("*", { count: "exact", head: true });
        if (criteria.patientId)
            query = query.eq("patient_id", criteria.patientId);
        if (criteria.providerId)
            query = query.eq("doctor_id", criteria.providerId);
        if (criteria.department)
            query = query.eq("department_id", criteria.department);
        if (criteria.status && criteria.status.length > 0) {
            query = query.in("status", criteria.status.map((s) => s.toUpperCase()));
        }
        if (criteria.dateFrom) {
            const dateStr = criteria.dateFrom.toISOString().split("T")[0];
            query = query.gte("appointment_date", dateStr);
        }
        if (criteria.dateTo) {
            const dateStr = criteria.dateTo.toISOString().split("T")[0];
            query = query.lte("appointment_date", dateStr);
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
        const ids = appointmentIds.map((id) => id.value);
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select("*")
            .in("appointment_id", ids);
        if (error) {
            throw new Error(`Failed to find appointments by IDs: ${error.message}`);
        }
        return (data || []).map((record) => this.toDomain(record));
    }
    async findByTimeSlot(providerId, startTime, endTime) {
        const startUtc = startTime.toISOString();
        const endUtc = endTime.toISOString();
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select("*")
            .eq("doctor_id", providerId)
            .gte("start_at_utc", startUtc)
            .lte("end_at_utc", endUtc)
            .order("start_at_utc", { ascending: true });
        if (error) {
            throw new Error(`Failed to find appointments by time slot: ${error.message}`);
        }
        return (data || []).map((record) => this.toDomain(record));
    }
    async findFollowUpAppointments(originalAppointmentId) {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select("*")
            .eq("parent_appointment_id", originalAppointmentId)
            .order("appointment_date", { ascending: true })
            .order("appointment_time", { ascending: true });
        if (error) {
            throw new Error(`Failed to find follow-up appointments: ${error.message}`);
        }
        return (data || []).map((record) => this.toDomain(record));
    }
    async getPatientHistory(patientId, limit, offset) {
        // Get total count
        const { count: totalCount } = await this.supabase
            .from(this.tableName)
            .select("*", { count: "exact", head: true })
            .eq("patient_id", patientId);
        // Get appointments
        let query = this.supabase
            .from(this.tableName)
            .select("*")
            .eq("patient_id", patientId)
            .order("appointment_date", { ascending: false })
            .order("appointment_time", { ascending: false });
        if (limit)
            query = query.limit(limit);
        if (offset)
            query = query.range(offset, offset + (limit || 10) - 1);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to get patient history: ${error.message}`);
        }
        const appointments = (data || []).map((record) => this.toDomain(record));
        // Get counts by status
        const { count: completedCount } = await this.supabase
            .from(this.tableName)
            .select("*", { count: "exact", head: true })
            .eq("patient_id", patientId)
            .eq("status", "COMPLETED");
        const { count: cancelledCount } = await this.supabase
            .from(this.tableName)
            .select("*", { count: "exact", head: true })
            .eq("patient_id", patientId)
            .eq("status", "CANCELLED");
        const { count: noShowCount } = await this.supabase
            .from(this.tableName)
            .select("*", { count: "exact", head: true })
            .eq("patient_id", patientId)
            .eq("status", "NO_SHOW");
        return {
            appointments,
            totalCount: totalCount || 0,
            completedCount: completedCount || 0,
            cancelledCount: cancelledCount || 0,
            noShowCount: noShowCount || 0,
        };
    }
    async getProviderSchedule(providerId, startDate, endDate) {
        const startDateStr = startDate.toISOString().split("T")[0];
        const endDateStr = endDate.toISOString().split("T")[0];
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select("*")
            .eq("doctor_id", providerId)
            .gte("appointment_date", startDateStr)
            .lte("appointment_date", endDateStr)
            .not("status", "in", "(CANCELLED,NO_SHOW)")
            .order("appointment_date", { ascending: true })
            .order("appointment_time", { ascending: true });
        if (error) {
            throw new Error(`Failed to get provider schedule: ${error.message}`);
        }
        return (data || []).map((record) => this.toDomain(record));
    }
    async findByDepartment(department, dateFrom, dateTo, limit, offset) {
        let query = this.supabase
            .from(this.tableName)
            .select("*")
            .eq("department_id", department);
        if (dateFrom) {
            const dateStr = dateFrom.toISOString().split("T")[0];
            query = query.gte("appointment_date", dateStr);
        }
        if (dateTo) {
            const dateStr = dateTo.toISOString().split("T")[0];
            query = query.lte("appointment_date", dateStr);
        }
        query = query
            .order("appointment_date", { ascending: true })
            .order("appointment_time", { ascending: true });
        if (limit)
            query = query.limit(limit);
        if (offset)
            query = query.range(offset, offset + (limit || 10) - 1);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to find appointments by department: ${error.message}`);
        }
        return (data || []).map((record) => this.toDomain(record));
    }
    async findEmergencyAppointments(limit) {
        let query = this.supabase
            .from(this.tableName)
            .select("*")
            .eq("priority", "EMERGENCY")
            .not("status", "in", "(COMPLETED,CANCELLED,NO_SHOW)")
            .order("created_at", { ascending: true });
        if (limit)
            query = query.limit(limit);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to find emergency appointments: ${error.message}`);
        }
        return (data || []).map((record) => this.toDomain(record));
    }
    async findRequiringPreparation(dateFrom, dateTo) {
        let query = this.supabase
            .from(this.tableName)
            .select("*")
            .not("required_equipment", "is", null)
            .eq("status", "SCHEDULED");
        if (dateFrom) {
            const dateStr = dateFrom.toISOString().split("T")[0];
            query = query.gte("appointment_date", dateStr);
        }
        if (dateTo) {
            const dateStr = dateTo.toISOString().split("T")[0];
            query = query.lte("appointment_date", dateStr);
        }
        query = query
            .order("appointment_date", { ascending: true })
            .order("appointment_time", { ascending: true });
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to find appointments requiring preparation: ${error.message}`);
        }
        return (data || []).map((record) => this.toDomain(record));
    }
    async bulkUpdate(appointments) {
        const records = appointments.map((apt) => this.toPersistence(apt));
        const { error } = await this.supabase
            .from(this.tableName)
            .upsert(records, { onConflict: "id" });
        if (error) {
            throw new Error(`Failed to bulk update appointments: ${error.message}`);
        }
    }
    async getDailySummary(date, providerId) {
        const dateStr = date.toISOString().split("T")[0];
        let query = this.supabase
            .from(this.tableName)
            .select("*")
            .eq("appointment_date", dateStr);
        if (providerId)
            query = query.eq("doctor_id", providerId);
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to get daily summary: ${error.message}`);
        }
        const appointments = data || [];
        const totalAppointments = appointments.length;
        const scheduledAppointments = appointments.filter((a) => a.status === "SCHEDULED").length;
        const completedAppointments = appointments.filter((a) => a.status === "COMPLETED").length;
        const cancelledAppointments = appointments.filter((a) => a.status === "CANCELLED").length;
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
            busyPeriods,
        };
    }
    async findAvailableTimeSlots(providerId, date, duration) {
        // Step 1: Get provider's schedule from provider_schedules table
        const { data: scheduleData, error: scheduleError } = await this.supabase
            .from("provider_schedules")
            .select("*")
            .eq("provider_id", providerId)
            .single();
        if (scheduleError || !scheduleData) {
            console.warn(`[FindSlots] No schedule found for provider ${providerId}:`, scheduleError?.message);
            return []; // No schedule = no available slots
        }
        // Step 2: Check if the date is a working day
        const dayOfWeek = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
        ][date.getDay()];
        const workingDays = scheduleData.working_days || [];
        if (!workingDays.includes(dayOfWeek)) {
            console.log(`[FindSlots] ${dayOfWeek} is not a working day for provider ${providerId}`);
            return []; // Not a working day
        }
        // Step 3: Parse working hours (e.g., '08:00' - '17:00')
        const workingHours = scheduleData.working_hours || {
            start: "08:00",
            end: "17:00",
        };
        const dayStart = this.parseTimeOnDate(date, workingHours.start);
        const dayEnd = this.parseTimeOnDate(date, workingHours.end);
        // Step 4: Get all booked appointments for the day (exclude cancelled/no-show)
        const dateStr = date.toISOString().split("T")[0];
        const { data: appointments, error: apptError } = await this.supabase
            .from(this.tableName)
            .select("start_at_utc, end_at_utc, duration_minutes")
            .eq("doctor_id", providerId)
            .eq("appointment_date", dateStr)
            .not("status", "in", "(CANCELLED,NO_SHOW)")
            .order("start_at_utc", { ascending: true });
        if (apptError) {
            throw new Error(`Failed to find booked appointments: ${apptError.message}`);
        }
        // Step 5: Build list of busy intervals (already booked)
        const busyIntervals = [];
        for (const appt of appointments || []) {
            const start = new Date(appt.start_at_utc);
            const end = appt.end_at_utc
                ? new Date(appt.end_at_utc)
                : new Date(start.getTime() + (appt.duration_minutes || 30) * 60 * 1000);
            busyIntervals.push({ start, end });
        }
        // Step 6: Merge overlapping intervals to avoid duplicates
        const mergedBusy = this.mergeIntervals(busyIntervals);
        // Step 7: Find available gaps that fit the duration
        const availableSlots = [];
        const slotDuration = duration * 60 * 1000; // Convert minutes to milliseconds
        let currentTime = dayStart;
        for (const busy of mergedBusy) {
            // If there's a gap before this busy interval
            if (currentTime < busy.start) {
                const gapDuration = busy.start.getTime() - currentTime.getTime();
                // Generate slots within this gap (e.g., every 30 minutes)
                const slotInterval = Math.min(slotDuration, 30 * 60 * 1000); // Default 30min slot intervals
                let slotStart = currentTime;
                while (slotStart.getTime() + slotDuration <= busy.start.getTime()) {
                    availableSlots.push({
                        startTime: new Date(slotStart),
                        endTime: new Date(slotStart.getTime() + slotDuration),
                    });
                    slotStart = new Date(slotStart.getTime() + slotInterval);
                }
            }
            // Move current time to end of this busy period
            currentTime = busy.end;
        }
        // Step 8: Check if there's a gap after the last appointment until end of day
        if (currentTime < dayEnd) {
            const slotInterval = Math.min(slotDuration, 30 * 60 * 1000);
            let slotStart = currentTime;
            while (slotStart.getTime() + slotDuration <= dayEnd.getTime()) {
                availableSlots.push({
                    startTime: new Date(slotStart),
                    endTime: new Date(slotStart.getTime() + slotDuration),
                });
                slotStart = new Date(slotStart.getTime() + slotInterval);
            }
        }
        console.log(`[FindSlots] Found ${availableSlots.length} available slots for provider ${providerId} on ${dateStr}`);
        return availableSlots;
    }
    /**
     * Parse time string (HH:MM) on a specific date
     */
    parseTimeOnDate(date, timeStr) {
        const [hours, minutes] = timeStr.split(":").map(Number);
        const result = new Date(date);
        result.setHours(hours, minutes, 0, 0);
        return result;
    }
    /**
     * Merge overlapping time intervals
     */
    mergeIntervals(intervals) {
        if (intervals.length === 0)
            return [];
        // Sort by start time
        const sorted = intervals.sort((a, b) => a.start.getTime() - b.start.getTime());
        const merged = [sorted[0]];
        for (let i = 1; i < sorted.length; i++) {
            const current = sorted[i];
            const last = merged[merged.length - 1];
            // If current overlaps with last, merge them
            if (current.start.getTime() <= last.end.getTime()) {
                last.end = new Date(Math.max(last.end.getTime(), current.end.getTime()));
            }
            else {
                // No overlap, add as new interval
                merged.push(current);
            }
        }
        return merged;
    }
    async getUtilizationRate(providerId, department, dateFrom, dateTo) {
        let query = this.supabase.from(this.tableName).select("*");
        if (providerId)
            query = query.eq("doctor_id", providerId);
        if (department)
            query = query.eq("department_id", department);
        if (dateFrom) {
            const dateStr = dateFrom.toISOString().split("T")[0];
            query = query.gte("appointment_date", dateStr);
        }
        if (dateTo) {
            const dateStr = dateTo.toISOString().split("T")[0];
            query = query.lte("appointment_date", dateStr);
        }
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to get utilization rate: ${error.message}`);
        }
        const appointments = data || [];
        const totalSlots = appointments.length;
        const bookedSlots = appointments.filter((a) => a.status !== "CANCELLED").length;
        const noShowCount = appointments.filter((a) => a.status === "NO_SHOW").length;
        const cancelledCount = appointments.filter((a) => a.status === "CANCELLED").length;
        const utilizationRate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;
        const noShowRate = totalSlots > 0 ? (noShowCount / totalSlots) * 100 : 0;
        const cancellationRate = totalSlots > 0 ? (cancelledCount / totalSlots) * 100 : 0;
        // Return only utilization rate as specified by interface
        return utilizationRate;
    }
    /**
     * Convert domain aggregate to database record
     */
    toPersistence(appointment) {
        const props = appointment.props; // Access private props
        // Calculate UTC timestamps from timeSlot
        const startAtUtc = props.timeSlot.startAtUtc || props.timeSlot.getStartTime();
        const endAtUtc = props.timeSlot.endAtUtc ||
            props.timeSlot.getEndTime(props.durationMinutes);
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
            consultation_fee: props.consultationFee, // Billing reference only
            payment_status: props.paymentStatus?.toUpperCase(), // Payment tracking (Flow 3)
            payment_deadline: props.paymentDeadline?.toISOString(),
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
            updated_at: props.updatedAt.toISOString(),
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
            type: record.type.toLowerCase(),
            priority: record.priority.toLowerCase(),
            status: record.status.toLowerCase(),
            details,
            roomId: record.room_id,
            departmentId: record.department_id,
            requiredEquipment: record.required_equipment,
            consultationFee: record.consultation_fee, // Billing reference only
            // Payment tracking (Flow 3 - Prepaid Model) - backward compatible
            paymentStatus: record.payment_status?.toLowerCase(),
            paymentDeadline: record.payment_deadline
                ? new Date(record.payment_deadline)
                : undefined,
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
            cancelledBy: record.cancelled_by,
            followUpAppointmentId: record.follow_up_appointment_id,
            parentAppointmentId: record.parent_appointment_id,
            seriesId: record.series_id,
            reminderSent: record.reminder_sent,
            reminderSentAt: record.reminder_sent_at
                ? new Date(record.reminder_sent_at)
                : undefined,
            confirmationRequired: record.confirmation_required,
            confirmedAt: record.confirmed_at
                ? new Date(record.confirmed_at)
                : undefined,
            confirmedBy: record.confirmed_by,
            version: record.version,
            createdBy: record.created_by,
            lastModifiedBy: record.last_modified_by,
            createdAt: new Date(record.created_at),
            updatedAt: new Date(record.updated_at),
        };
        // Reconstitute with UUID from database
        return Appointment_aggregate_1.Appointment.reconstitute(props, record.id);
    }
    // ==================== MISSING METHODS - CRITICAL ====================
    /**
     * Update appointment (alias for save - uses aggregate pattern)
     * Used by event consumers for status changes and updates
     */
    async update(appointment) {
        return this.save(appointment);
    }
    /**
     * Create appointment (alias for save - uses aggregate pattern)
     * Used by event consumers when creating new appointments
     */
    async create(appointment) {
        return this.save(appointment);
    }
    /**
     * Find appointments by department ID
     * Used by department event consumers for department operations
     */
    async findByDepartmentId(departmentId) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select("*")
                .eq("department_id", departmentId);
            if (error) {
                throw new Error(`Failed to find appointments by department ID: ${error.message}`);
            }
            return (data || []).map((record) => this.toDomain(record));
        }
        catch (error) {
            console.error("Failed to find appointments by department ID:", error);
            throw error;
        }
    }
    /**
     * Find appointments by department and date
     * Used by department event consumers for daily operations
     */
    async findByDepartmentAndDate(departmentId, date) {
        try {
            const dateStr = date.toISOString().split("T")[0];
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select("*")
                .eq("department_id", departmentId)
                .eq("appointment_date", dateStr);
            if (error) {
                throw new Error(`Failed to find appointments by department and date: ${error.message}`);
            }
            return (data || []).map((record) => this.toDomain(record));
        }
        catch (error) {
            console.error("Failed to find appointments by department and date:", error);
            throw error;
        }
    }
    /**
     * Check staff availability for appointment
     * Used by staff event consumers for availability checks
     */
    async checkStaffAvailability(staffId, startTime, endTime) {
        try {
            const startStr = startTime.toISOString();
            const endStr = endTime.toISOString();
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select("*")
                .eq("doctor_id", staffId)
                .gte("appointment_time", startStr)
                .lte("appointment_time", endStr)
                .in("status", ["confirmed", "in-progress"]);
            if (error) {
                throw new Error(`Failed to check staff availability: ${error.message}`);
            }
            return !data || data.length === 0;
        }
        catch (error) {
            console.error("Failed to check staff availability:", error);
            throw error;
        }
    }
    // ==================== PATIENT HISTORY METHODS (APPOINTMENT SERVICE CONTEXT) ====================
    /**
     * Update patient appointment history
     * Patient history management is core to appointment service
     */
    async updatePatientHistory(data) {
        try {
            console.log(`Updating patient history for patient: ${data.patientId}, appointment: ${data.appointmentId}`);
            // Store patient history in appointments_schema.patient_history table
            const { error } = await this.supabase.from("patient_history").upsert({
                patient_id: data.patientId,
                appointment_id: data.appointmentId,
                visit_type: data.visitType,
                diagnosis: data.diagnosis,
                treatment: data.treatment,
                notes: data.notes,
                updated_at: data.updatedAt,
                created_at: new Date(),
            }, {
                onConflict: "appointment_id",
            });
            if (error) {
                throw new Error(`Failed to update patient history: ${error.message}`);
            }
            console.log(`Successfully updated patient history for appointment: ${data.appointmentId}`);
        }
        catch (error) {
            console.error("Failed to update patient history:", error);
            throw error;
        }
    }
    /**
     * Update patient vital signs profile for appointments
     * Vital signs are linked to appointments (pre-op, post-op)
     */
    async updatePatientVitalSignsProfile(data) {
        try {
            console.log(`Updating vital signs for patient: ${data.patientId}, appointment: ${data.appointmentId}`);
            // Store vital signs in appointments_schema.vital_signs table
            const { error } = await this.supabase.from("vital_signs").upsert({
                patient_id: data.patientId,
                appointment_id: data.appointmentId,
                blood_pressure: data.vitalSigns.bloodPressure,
                heart_rate: data.vitalSigns.heartRate,
                temperature: data.vitalSigns.temperature,
                weight: data.vitalSigns.weight,
                height: data.vitalSigns.height,
                recorded_at: data.recordedAt,
                recorded_by: data.recordedBy,
                created_at: new Date(),
            }, {
                onConflict: "appointment_id",
            });
            if (error) {
                throw new Error(`Failed to update vital signs: ${error.message}`);
            }
            console.log(`Successfully updated vital signs for appointment: ${data.appointmentId}`);
        }
        catch (error) {
            console.error("Failed to update vital signs:", error);
            throw error;
        }
    }
    /**
     * Add appointment to urgent care list
     * Urgent care appointments are appointment types managed by appointment service
     */
    async addToUrgentCareList(appointmentId, priority) {
        try {
            console.log(`Adding appointment ${appointmentId} to urgent care list with priority: ${priority}`);
            // Add to urgent care queue in appointments_schema.urgent_care_queue table
            const { error } = await this.supabase.from("urgent_care_queue").insert({
                appointment_id: appointmentId,
                priority: priority,
                status: "pending",
                added_at: new Date(),
                created_at: new Date(),
            });
            if (error) {
                throw new Error(`Failed to add to urgent care list: ${error.message}`);
            }
            console.log(`Successfully added appointment ${appointmentId} to urgent care list`);
        }
        catch (error) {
            console.error("Failed to add to urgent care list:", error);
            throw error;
        }
    }
    // ==================== MISSING METHODS FROM INTERFACE ====================
    /**
     * Update appointment status
     * Loads aggregate, updates status, saves back
     */
    async updateStatus(appointmentId, status) {
        try {
            const appointment = await this.findById(appointmentId);
            if (!appointment) {
                throw new Error(`Appointment not found: ${appointmentId.value}`);
            }
            // TODO: Add proper domain method for status update
            // For now, use direct update (should be moved to domain)
            const { error } = await this.supabase
                .from(this.tableName)
                .update({
                status,
                updated_at: new Date().toISOString(),
            })
                .eq("id", appointmentId.value);
            if (error) {
                throw new Error(`Failed to update appointment status: ${error.message}`);
            }
            console.log(`Successfully updated appointment ${appointmentId.value} status to ${status}`);
        }
        catch (error) {
            console.error("Failed to update appointment status:", error);
            throw error;
        }
    }
    /**
     * Update billing rates for appointments
     * Updates all appointments of a specific service type
     */
    async updateBillingRates(data) {
        try {
            const { error } = await this.supabase
                .from(this.tableName)
                .update({
                estimated_cost: data.newRate,
                updated_at: new Date().toISOString(),
            })
                .eq("type", data.serviceType)
                .gte("appointment_date", data.effectiveDate.toISOString().split("T")[0]);
            if (error) {
                throw new Error(`Failed to update billing rates: ${error.message}`);
            }
            console.log(`Successfully updated billing rates for ${data.serviceType} to ${data.newRate}`);
        }
        catch (error) {
            console.error("Failed to update billing rates:", error);
            throw error;
        }
    }
    /**
     * Find appointments by service type and date
     */
    async findByServiceTypeAndDate(serviceType, date) {
        try {
            const dateStr = date.toISOString().split("T")[0];
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select("*")
                .eq("type", serviceType)
                .eq("appointment_date", dateStr);
            if (error) {
                throw new Error(`Failed to find appointments by service type and date: ${error.message}`);
            }
            if (!data || data.length === 0) {
                return [];
            }
            // Convert to Appointment aggregates
            return data.map((row) => this.toDomain(row));
        }
        catch (error) {
            console.error("Failed to find appointments by service type and date:", error);
            throw error;
        }
    }
    /**
     * Find pending appointments by service type
     */
    async findPendingByServiceType(serviceType) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select("*")
                .eq("type", serviceType)
                .eq("status", "pending");
            if (error) {
                throw new Error(`Failed to find pending appointments by service type: ${error.message}`);
            }
            if (!data || data.length === 0) {
                return [];
            }
            // Convert to Appointment aggregates
            return data.map((row) => this.toDomain(row));
        }
        catch (error) {
            console.error("Failed to find pending appointments by service type:", error);
            throw error;
        }
    }
    // ... rest of the code remains the same ...
    /**
     * Update patient insurance coverage
     * Updates all future appointments for a patient
     */
    async updatePatientInsuranceCoverage(data) {
        try {
            const { error } = await this.supabase
                .from(this.tableName)
                .update({
                insurance_provider: data.insuranceProvider,
                policy_number: data.policyNumber,
                coverage_type: data.coverageType,
                updated_at: new Date().toISOString(),
            })
                .eq("patient_id", data.patientId)
                .gte("appointment_date", data.validFrom.toISOString().split("T")[0])
                .lte("appointment_date", data.validUntil.toISOString().split("T")[0]);
            if (error) {
                throw new Error(`Failed to update patient insurance coverage: ${error.message}`);
            }
            console.log(`Successfully updated insurance coverage for patient ${data.patientId}`);
        }
        catch (error) {
            console.error("Failed to update patient insurance coverage:", error);
            throw error;
        }
    }
    /**
     * Update patient scheduling preferences
     * Note: This would typically be stored in a separate patient_preferences table
     */
    async updatePatientSchedulingPreferences(data) {
        try {
            // For now, log the preference update
            // In a real implementation, this would update a patient_preferences table
            console.log(`Updating scheduling preferences for patient ${data.patientId}:`, data);
            // TODO: Implement patient preferences table update
            console.log("Patient scheduling preferences updated (placeholder implementation)");
        }
        catch (error) {
            console.error("Failed to update patient scheduling preferences:", error);
            throw error;
        }
    }
}
exports.SupabaseAppointmentRepository = SupabaseAppointmentRepository;
//# sourceMappingURL=SupabaseAppointmentRepository.js.map