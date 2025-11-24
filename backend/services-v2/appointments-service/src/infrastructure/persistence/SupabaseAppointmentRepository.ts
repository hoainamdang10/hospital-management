/**
 * Supabase Appointment Repository - Infrastructure Layer
 * V3 Clean Architecture + DDD Implementation
 * Matches 100% with scheduling_schema database
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { OutboxRepository } from "../outbox/OutboxRepository";
import {
  Appointment,
  AppointmentType,
  AppointmentPriority,
  AppointmentStatus,
  AppointmentProps,
} from "../../domain/aggregates/Appointment.aggregate";
import { AppointmentId } from "../../domain/value-objects/AppointmentId.vo";
import { TimeSlot } from "../../domain/value-objects/TimeSlot.vo";
import { AppointmentDetails } from "../../domain/value-objects/AppointmentDetails.vo";
import { TenantId } from "../../domain/value-objects/TenantId.vo";
import {
  IAppointmentRepository,
  AppointmentSearchCriteria,
  AppointmentSearchResult,
  AppointmentConflictCheck,
  AppointmentStatistics,
} from "../../domain/repositories/IAppointmentRepository";
import { IDomainEventPublisher } from "@shared/domain/events/IDomainEventPublisher";
import { DomainEvent } from "@shared/domain/base/domain-event";

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
  consultation_fee: number; // Billing reference only - billing-service owns payment lifecycle
  payment_status?: string; // Payment tracking (Flow 3 - Prepaid Model)
  payment_deadline?: string; // Payment timeout deadline
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
  private readonly supabase: SupabaseClient<any, "appointments_schema">;
  private readonly schema: string = "appointments_schema";
  private readonly tableName: string = "appointments";
  private readonly outboxRepo: OutboxRepository;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    private readonly eventPublisher?: IDomainEventPublisher,
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
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
    }) as SupabaseClient<any, "appointments_schema">;

    this.outboxRepo = new OutboxRepository(supabaseUrl, supabaseKey, 5);
  }

  /**
   * Save appointment (create or update)
   */
  async save(appointment: Appointment): Promise<void> {
    const record = this.toPersistence(appointment);

    console.log(
      "[Repository] Saving appointment record:",
      JSON.stringify(record, null, 2),
    );

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
  private async publishDomainEvents(appointment: Appointment): Promise<void> {
    const events = appointment.getUncommittedEvents();
    if (events.length === 0) {
      return;
    }

    try {
      // ===== ENRICHMENT: Fetch read model for names =====
      let readModel: any = null;

      try {
        const { data, error } = await this.supabase
          .from("appointment_read_model")
          .select(
            "patient_full_name, patient_email, patient_phone, doctor_full_name, doctor_specialization, doctor_department, doctor_email, duration_minutes, consultation_fee",
          )
          .eq("appointment_id", appointment.getAppointmentId().value)
          .single();

        if (!error && data) {
          readModel = data;
          console.debug(
            "[SupabaseAppointmentRepository] Read model fetched for enrichment",
            {
              appointmentId: appointment.getAppointmentId().value,
              hasPatientName: !!data.patient_full_name,
              hasDoctorName: !!data.doctor_full_name,
            },
          );
        }
      } catch (readModelError) {
        console.warn(
          "[SupabaseAppointmentRepository] Failed to fetch read model for enrichment (non-critical)",
          {
            appointmentId: appointment.getAppointmentId().value,
            error:
              readModelError instanceof Error
                ? readModelError.message
                : "Unknown",
          },
        );
        // Continue without enrichment - events still published with IDs
      }

      // ===== ENRICH EVENTS BEFORE PUBLISHING =====
      for (const event of events) {
        // Enrich AppointmentConfirmedEvent with read model data
        if (event.eventType === "AppointmentConfirmed" && readModel) {
          (event as any).patientName = readModel.patient_full_name;
          (event as any).doctorName = readModel.doctor_full_name;
          (event as any).departmentName = readModel.doctor_department;
          (event as any).durationMinutes = readModel.duration_minutes;
          (event as any).consultationFee = readModel.consultation_fee;

          console.debug(
            "[SupabaseAppointmentRepository] Event enriched with read model data",
            {
              eventType: event.eventType,
              patientName: readModel.patient_full_name,
              doctorName: readModel.doctor_full_name,
            },
          );
        }

        // Enrich other events if needed (AppointmentScheduled, AppointmentCancelled, etc.)
        if (
          (event.eventType === "AppointmentScheduled" ||
            event.eventType === "AppointmentCancelled") &&
          readModel
        ) {
          (event as any).patientName = readModel.patient_full_name;
          (event as any).doctorName = readModel.doctor_full_name;
          (event as any).departmentName = readModel.doctor_department;
        }
      }

      // Enqueue to Outbox for reliable delivery
      await Promise.all(
        events.map((event: DomainEvent) =>
          this.outboxRepo.enqueue({
            eventType: `appointments.${event.getRoutingKey()}`,
            aggregateType: event.aggregateType,
            aggregateId: event.aggregateId,
            payload: event.toJSON(),
            dedupKey: event.eventId,
          }),
        ),
      );

      // Optional: also publish directly if configured (backward compatibility)
      if (this.eventPublisher) {
        await this.eventPublisher.publishBatch(events);
      }

      // Mark events as committed after successful publishing
      appointment.markEventsAsCommitted();

      console.info("[SupabaseAppointmentRepository] Domain events published", {
        appointmentId: appointment.getAppointmentId().value,
        eventCount: events.length,
        eventTypes: events.map((event: DomainEvent) => event.eventType),
        enriched: !!readModel,
        viaOutbox: true,
      });
    } catch (error) {
      console.error(
        "[SupabaseAppointmentRepository] Failed to publish domain events",
        {
          appointmentId: appointment.getAppointmentId().value,
          error: error instanceof Error ? error.message : "Unknown error",
          eventCount: events.length,
        },
      );

      // Don't throw - event publishing failure shouldn't fail the transaction
      // Events will be retried on next save or can be published via outbox pattern
    }
  }

  /**
   * Find appointment by AppointmentId
   */
  async findById(appointmentId: AppointmentId): Promise<Appointment | null> {
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
  async findByAppointmentId(
    appointmentId: string,
  ): Promise<Appointment | null> {
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
  async findByPatientId(
    patientId: string,
    limit?: number,
    offset?: number,
  ): Promise<Appointment[]> {
    let query = this.supabase
      .from(this.tableName)
      .select("*")
      .eq("patient_id", patientId)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 10) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find appointments: ${error.message}`);
    }

    return data.map((record) => this.toDomain(record));
  }

  /**
   * Find appointments by doctor ID
   */
  async findByDoctorId(
    doctorId: string,
    limit?: number,
    offset?: number,
  ): Promise<Appointment[]> {
    let query = this.supabase
      .from(this.tableName)
      .select("*")
      .eq("doctor_id", doctorId)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 10) - 1);

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
  async findByDoctorAndDate(
    doctorId: string,
    date: Date,
  ): Promise<Appointment[]> {
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
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    limit?: number,
    offset?: number,
  ): Promise<Appointment[]> {
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    let query = this.supabase
      .from(this.tableName)
      .select("*")
      .gte("appointment_date", startDateStr)
      .lte("appointment_date", endDateStr)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 10) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find appointments: ${error.message}`);
    }

    return data.map((record) => this.toDomain(record));
  }

  /**
   * Delete appointment
   */
  async delete(appointmentId: AppointmentId): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq("appointment_id", appointmentId.value);

    if (error) {
      throw new Error(`Failed to delete appointment: ${error.message}`);
    }
  }

  // ===== Additional methods to satisfy IAppointmentRepository interface =====

  async findByIdString(id: string): Promise<Appointment | null> {
    // Check if it's UUID format (database id) or business format (appointment_id)
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );

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
    } else {
      // Find by business ID (appointment_id column)
      return this.findByAppointmentId(id);
    }
  }

  async findByProviderId(
    providerId: string,
    limit?: number,
    offset?: number,
  ): Promise<Appointment[]> {
    return this.findByDoctorId(providerId);
  }

  async search(
    criteria: AppointmentSearchCriteria,
  ): Promise<AppointmentSearchResult> {
    let query = this.supabase
      .from(this.tableName)
      .select("*", { count: "exact" });

    // Apply filters
    if (criteria.patientId) query = query.eq("patient_id", criteria.patientId);
    if (criteria.providerId) query = query.eq("doctor_id", criteria.providerId);
    if (criteria.department)
      query = query.eq("department_id", criteria.department);
    if (criteria.status && criteria.status.length > 0) {
      query = query.in(
        "status",
        criteria.status.map((s) => s.toUpperCase()),
      );
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
    if (criteria.roomId) query = query.eq("room_id", criteria.roomId);

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
    } else {
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

  async checkConflicts(
    providerId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string,
  ): Promise<AppointmentConflictCheck> {
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

  async findUpcomingByPatientId(
    patientId: string,
    limit?: number,
  ): Promise<Appointment[]> {
    const now = new Date().toISOString();

    let query = this.supabase
      .from(this.tableName)
      .select("*")
      .eq("patient_id", patientId)
      .gte("start_at_utc", now)
      .not("status", "in", "(CANCELLED,NO_SHOW,RESCHEDULED)")
      .order("start_at_utc", { ascending: true });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find upcoming appointments: ${error.message}`);
    }

    return (data || []).map((record) => this.toDomain(record));
  }

  async findUpcomingByProviderId(
    providerId: string,
    limit?: number,
  ): Promise<Appointment[]> {
    const now = new Date().toISOString();

    let query = this.supabase
      .from(this.tableName)
      .select("*")
      .eq("doctor_id", providerId)
      .gte("start_at_utc", now)
      .not("status", "in", "(CANCELLED,NO_SHOW,RESCHEDULED)")
      .order("start_at_utc", { ascending: true });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find upcoming appointments: ${error.message}`);
    }

    return (data || []).map((record) => this.toDomain(record));
  }

  async findByStatus(
    status: string,
    limit?: number,
    offset?: number,
  ): Promise<Appointment[]> {
    let query = this.supabase
      .from(this.tableName)
      .select("*")
      .eq("status", status.toUpperCase())
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 10) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(
        `Failed to find appointments by status: ${error.message}`,
      );
    }

    return (data || []).map((record) => this.toDomain(record));
  }

  async findRequiringReminders(
    reminderType: "24h" | "2h" | "30min",
  ): Promise<Appointment[]> {
    const now = new Date();
    let targetTime: Date;

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
      throw new Error(
        `Failed to find appointments requiring reminders: ${error.message}`,
      );
    }

    return (data || []).map((record) => this.toDomain(record));
  }

  async findOverdue(): Promise<Appointment[]> {
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
  async findExpiredUnpaidAppointments(): Promise<Appointment[]> {
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("payment_status", "PENDING")
      .not("payment_deadline", "is", null)
      .lt("payment_deadline", now)
      .order("payment_deadline", { ascending: true });

    if (error) {
      throw new Error(
        `Failed to find expired unpaid appointments: ${error.message}`,
      );
    }

    return (data || []).map((record) => this.toDomain(record));
  }

  /**
   * Find past appointments that should be auto-completed
   * Query: status IN ('CONFIRMED', 'SCHEDULED') AND appointment_datetime < cutoffTime
   */
  async findPastAppointments(cutoffTime: Date): Promise<Appointment[]> {
    const cutoffDateStr = cutoffTime.toISOString().split("T")[0];
    const cutoffTimeStr = cutoffTime.toTimeString().split(" ")[0];

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .in("status", ["CONFIRMED", "SCHEDULED", "ARRIVED", "IN_PROGRESS"])
      .or(
        `appointment_date.lt.${cutoffDateStr},and(appointment_date.eq.${cutoffDateStr},appointment_time.lt.${cutoffTimeStr})`,
      )
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (error) {
      throw new Error(`Failed to find past appointments: ${error.message}`);
    }

    return (data || []).map((record) => this.toDomain(record));
  }

  async getStatistics(
    dateFrom?: Date,
    dateTo?: Date,
    providerId?: string,
    department?: string,
  ): Promise<AppointmentStatistics> {
    let query = this.supabase.from(this.tableName).select("*");

    if (dateFrom) {
      const dateStr = dateFrom.toISOString().split("T")[0];
      query = query.gte("appointment_date", dateStr);
    }
    if (dateTo) {
      const dateStr = dateTo.toISOString().split("T")[0];
      query = query.lte("appointment_date", dateStr);
    }
    if (providerId) query = query.eq("doctor_id", providerId);
    if (department) query = query.eq("department_id", department);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }

    const appointments = data || [];
    const totalAppointments = appointments.length;
    const scheduledAppointments = appointments.filter(
      (a) => a.status === "SCHEDULED",
    ).length;
    const confirmedAppointments = appointments.filter(
      (a) => a.confirmed_at !== null,
    ).length;
    const completedAppointments = appointments.filter(
      (a) => a.status === "COMPLETED",
    ).length;
    const cancelledAppointments = appointments.filter(
      (a) => a.status === "CANCELLED",
    ).length;
    const noShowAppointments = appointments.filter(
      (a) => a.status === "NO_SHOW",
    ).length;

    const totalDuration = appointments.reduce(
      (sum, a) => sum + (a.duration_minutes || 0),
      0,
    );
    const averageDuration =
      totalAppointments > 0 ? totalDuration / totalAppointments : 0;

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
      departmentStats,
    };
  }

  async count(criteria: Partial<AppointmentSearchCriteria>): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select("*", { count: "exact", head: true });

    if (criteria.patientId) query = query.eq("patient_id", criteria.patientId);
    if (criteria.providerId) query = query.eq("doctor_id", criteria.providerId);
    if (criteria.department)
      query = query.eq("department_id", criteria.department);
    if (criteria.status && criteria.status.length > 0) {
      query = query.in(
        "status",
        criteria.status.map((s) => s.toUpperCase()),
      );
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

  async exists(appointmentId: AppointmentId): Promise<boolean> {
    const appointment = await this.findById(appointmentId);
    return appointment !== null;
  }

  async findByIds(appointmentIds: AppointmentId[]): Promise<Appointment[]> {
    if (appointmentIds.length === 0) return [];

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

  async findByTimeSlot(
    providerId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<Appointment[]> {
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
      throw new Error(
        `Failed to find appointments by time slot: ${error.message}`,
      );
    }

    return (data || []).map((record) => this.toDomain(record));
  }

  async findFollowUpAppointments(
    originalAppointmentId: string,
  ): Promise<Appointment[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("parent_appointment_id", originalAppointmentId)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (error) {
      throw new Error(
        `Failed to find follow-up appointments: ${error.message}`,
      );
    }

    return (data || []).map((record) => this.toDomain(record));
  }

  async getPatientHistory(
    patientId: string,
    limit?: number,
    offset?: number,
  ): Promise<{
    appointments: Appointment[];
    totalCount: number;
    completedCount: number;
    cancelledCount: number;
    noShowCount: number;
  }> {
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

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 10) - 1);

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

  async getProviderSchedule(
    providerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Appointment[]> {
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

  async findByDepartment(
    department: string,
    dateFrom?: Date,
    dateTo?: Date,
    limit?: number,
    offset?: number,
  ): Promise<Appointment[]> {
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

    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + (limit || 10) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(
        `Failed to find appointments by department: ${error.message}`,
      );
    }

    return (data || []).map((record) => this.toDomain(record));
  }

  async findEmergencyAppointments(limit?: number): Promise<Appointment[]> {
    let query = this.supabase
      .from(this.tableName)
      .select("*")
      .eq("priority", "EMERGENCY")
      .not("status", "in", "(COMPLETED,CANCELLED,NO_SHOW)")
      .order("created_at", { ascending: true });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      throw new Error(
        `Failed to find emergency appointments: ${error.message}`,
      );
    }

    return (data || []).map((record) => this.toDomain(record));
  }

  async findRequiringPreparation(
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<Appointment[]> {
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
      throw new Error(
        `Failed to find appointments requiring preparation: ${error.message}`,
      );
    }

    return (data || []).map((record) => this.toDomain(record));
  }

  async bulkUpdate(appointments: Appointment[]): Promise<void> {
    const records = appointments.map((apt) => this.toPersistence(apt));

    const { error } = await this.supabase
      .from(this.tableName)
      .upsert(records, { onConflict: "id" });

    if (error) {
      throw new Error(`Failed to bulk update appointments: ${error.message}`);
    }
  }

  async getDailySummary(
    date: Date,
    providerId?: string,
  ): Promise<{
    totalAppointments: number;
    scheduledAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    averageDuration: number;
    busyPeriods: { startTime: Date; endTime: Date; appointmentCount: number }[];
  }> {
    const dateStr = date.toISOString().split("T")[0];

    let query = this.supabase
      .from(this.tableName)
      .select("*")
      .eq("appointment_date", dateStr);

    if (providerId) query = query.eq("doctor_id", providerId);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get daily summary: ${error.message}`);
    }

    const appointments = data || [];
    const totalAppointments = appointments.length;
    const scheduledAppointments = appointments.filter(
      (a) => a.status === "SCHEDULED",
    ).length;
    const completedAppointments = appointments.filter(
      (a) => a.status === "COMPLETED",
    ).length;
    const cancelledAppointments = appointments.filter(
      (a) => a.status === "CANCELLED",
    ).length;

    const totalDuration = appointments.reduce(
      (sum, a) => sum + (a.duration_minutes || 0),
      0,
    );
    const averageDuration =
      totalAppointments > 0 ? totalDuration / totalAppointments : 0;

    // Calculate busy periods (simplified - group by hour)
    const busyPeriods: {
      startTime: Date;
      endTime: Date;
      appointmentCount: number;
    }[] = [];

    return {
      totalAppointments,
      scheduledAppointments,
      completedAppointments,
      cancelledAppointments,
      averageDuration,
      busyPeriods,
    };
  }

  async findAvailableTimeSlots(
    providerId: string,
    date: Date,
    duration: number,
  ): Promise<{ startTime: Date; endTime: Date }[]> {
    // Step 1: Get provider's schedule from provider_schedules table
    const { data: scheduleData, error: scheduleError } = await this.supabase
      .from("provider_schedules")
      .select("*")
      .eq("provider_id", providerId)
      .single();

    if (scheduleError || !scheduleData) {
      console.warn(
        `[FindSlots] No schedule found for provider ${providerId}:`,
        scheduleError?.message,
      );
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
      console.log(
        `[FindSlots] ${dayOfWeek} is not a working day for provider ${providerId}`,
      );
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
      throw new Error(
        `Failed to find booked appointments: ${apptError.message}`,
      );
    }

    // Step 5: Build list of busy intervals (already booked)
    const busyIntervals: { start: Date; end: Date }[] = [];

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
    const availableSlots: { startTime: Date; endTime: Date }[] = [];
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

    console.log(
      `[FindSlots] Found ${availableSlots.length} available slots for provider ${providerId} on ${dateStr}`,
    );
    return availableSlots;
  }

  /**
   * Parse time string (HH:MM) on a specific date
   */
  private parseTimeOnDate(date: Date, timeStr: string): Date {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  /**
   * Merge overlapping time intervals
   */
  private mergeIntervals(
    intervals: { start: Date; end: Date }[],
  ): { start: Date; end: Date }[] {
    if (intervals.length === 0) return [];

    // Sort by start time
    const sorted = intervals.sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    );
    const merged: { start: Date; end: Date }[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = merged[merged.length - 1];

      // If current overlaps with last, merge them
      if (current.start.getTime() <= last.end.getTime()) {
        last.end = new Date(
          Math.max(last.end.getTime(), current.end.getTime()),
        );
      } else {
        // No overlap, add as new interval
        merged.push(current);
      }
    }

    return merged;
  }

  async getUtilizationRate(
    providerId?: string,
    department?: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<number> {
    let query = this.supabase.from(this.tableName).select("*");

    if (providerId) query = query.eq("doctor_id", providerId);
    if (department) query = query.eq("department_id", department);
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
    const bookedSlots = appointments.filter(
      (a) => a.status !== "CANCELLED",
    ).length;
    const noShowCount = appointments.filter(
      (a) => a.status === "NO_SHOW",
    ).length;
    const cancelledCount = appointments.filter(
      (a) => a.status === "CANCELLED",
    ).length;

    const utilizationRate =
      totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;
    const noShowRate = totalSlots > 0 ? (noShowCount / totalSlots) * 100 : 0;
    const cancellationRate =
      totalSlots > 0 ? (cancelledCount / totalSlots) * 100 : 0;

    // Return only utilization rate as specified by interface
    return utilizationRate;
  }

  /**
   * Convert domain aggregate to database record
   */
  private toPersistence(appointment: Appointment): DatabaseAppointmentRecord {
    const props = (appointment as any).props; // Access private props

    // Calculate UTC timestamps from timeSlot
    const startAtUtc =
      props.timeSlot.startAtUtc ||
      this.toUtcFromLocal(
        props.timeSlot.appointmentDate,
        props.timeSlot.appointmentTime,
      );
    const endAtUtc =
      props.timeSlot.endAtUtc ||
      new Date(startAtUtc.getTime() + props.durationMinutes * 60 * 1000);

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
   * Convert local (service timezone) date/time to UTC Date.
   * Assumes input time is expressed in local clinic timezone (default Asia/Ho_Chi_Minh, UTC+7).
   */
  private toUtcFromLocal(dateStr: string, timeStr: string): Date {
    const offsetMinutes = Number(
      process.env.APPOINTMENT_TIMEZONE_OFFSET_MINUTES || "420",
    ); // default +07:00
    // Build ISO with explicit offset to avoid Node default timezone surprises
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const abs = Math.abs(offsetMinutes);
    const hh = String(Math.floor(abs / 60)).padStart(2, "0");
    const mm = String(abs % 60).padStart(2, "0");
    const isoWithOffset = `${dateStr}T${timeStr}${sign}${hh}:${mm}`;
    return new Date(isoWithOffset);
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
      new Date(record.end_at_utc),
    );

    const details = AppointmentDetails.create(
      record.reason,
      record.chief_complaint,
      record.symptoms,
      record.notes,
      record.special_instructions,
    );

    // Build complete props object for reconstitution
    const props: AppointmentProps = {
      appointmentId,
      tenantId,
      patientId: record.patient_id,
      doctorId: record.doctor_id,
      timeSlot,
      durationMinutes: record.duration_minutes,
      type: record.type.toLowerCase() as AppointmentType,
      priority: record.priority.toLowerCase() as AppointmentPriority,
      status: record.status.toLowerCase() as AppointmentStatus,
      details,
      roomId: record.room_id,
      departmentId: record.department_id,
      requiredEquipment: record.required_equipment,
      consultationFee: record.consultation_fee, // Billing reference only
      // Payment tracking (Flow 3 - Prepaid Model) - backward compatible
      paymentStatus: record.payment_status?.toLowerCase() as
        | "pending"
        | "paid"
        | "refunded"
        | undefined,
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
    return Appointment.reconstitute(props, record.id);
  }

  // ==================== MISSING METHODS - CRITICAL ====================

  /**
   * Update appointment (alias for save - uses aggregate pattern)
   * Used by event consumers for status changes and updates
   */
  async update(appointment: Appointment): Promise<void> {
    return this.save(appointment);
  }

  /**
   * Create appointment (alias for save - uses aggregate pattern)
   * Used by event consumers when creating new appointments
   */
  async create(appointment: Appointment): Promise<void> {
    return this.save(appointment);
  }

  /**
   * Find appointments by department ID
   * Used by department event consumers for department operations
   */
  async findByDepartmentId(departmentId: string): Promise<Appointment[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*")
        .eq("department_id", departmentId);

      if (error) {
        throw new Error(
          `Failed to find appointments by department ID: ${error.message}`,
        );
      }

      return (data || []).map((record) => this.toDomain(record));
    } catch (error) {
      console.error("Failed to find appointments by department ID:", error);
      throw error;
    }
  }

  /**
   * Find appointments by department and date
   * Used by department event consumers for daily operations
   */
  async findByDepartmentAndDate(
    departmentId: string,
    date: Date,
  ): Promise<Appointment[]> {
    try {
      const dateStr = date.toISOString().split("T")[0];

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*")
        .eq("department_id", departmentId)
        .eq("appointment_date", dateStr);

      if (error) {
        throw new Error(
          `Failed to find appointments by department and date: ${error.message}`,
        );
      }

      return (data || []).map((record) => this.toDomain(record));
    } catch (error) {
      console.error(
        "Failed to find appointments by department and date:",
        error,
      );
      throw error;
    }
  }

  /**
   * Check staff availability for appointment
   * Used by staff event consumers for availability checks
   */
  async checkStaffAvailability(
    staffId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<boolean> {
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
    } catch (error) {
      console.error("Failed to check staff availability:", error);
      throw error;
    }
  }

  // ==================== PATIENT HISTORY METHODS (APPOINTMENT SERVICE CONTEXT) ====================

  /**
   * Update patient appointment history
   * Patient history management is core to appointment service
   */
  async updatePatientHistory(data: {
    patientId: string;
    appointmentId: string;
    visitType: string;
    diagnosis?: string;
    treatment?: string;
    notes?: string;
    updatedAt: Date;
  }): Promise<void> {
    try {
      console.log(
        `Updating patient history for patient: ${data.patientId}, appointment: ${data.appointmentId}`,
      );

      // Store patient history in appointments_schema.patient_history table
      const { error } = await this.supabase.from("patient_history").upsert(
        {
          patient_id: data.patientId,
          appointment_id: data.appointmentId,
          visit_type: data.visitType,
          diagnosis: data.diagnosis,
          treatment: data.treatment,
          notes: data.notes,
          updated_at: data.updatedAt,
          created_at: new Date(),
        },
        {
          onConflict: "appointment_id",
        },
      );

      if (error) {
        throw new Error(`Failed to update patient history: ${error.message}`);
      }

      console.log(
        `Successfully updated patient history for appointment: ${data.appointmentId}`,
      );
    } catch (error) {
      console.error("Failed to update patient history:", error);
      throw error;
    }
  }

  /**
   * Update patient vital signs profile for appointments
   * Vital signs are linked to appointments (pre-op, post-op)
   */
  async updatePatientVitalSignsProfile(data: {
    patientId: string;
    appointmentId: string;
    vitalSigns: {
      bloodPressure?: string;
      heartRate?: number;
      temperature?: number;
      weight?: number;
      height?: number;
    };
    recordedAt: Date;
    recordedBy: string;
  }): Promise<void> {
    try {
      console.log(
        `Updating vital signs for patient: ${data.patientId}, appointment: ${data.appointmentId}`,
      );

      // Store vital signs in appointments_schema.vital_signs table
      const { error } = await this.supabase.from("vital_signs").upsert(
        {
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
        },
        {
          onConflict: "appointment_id",
        },
      );

      if (error) {
        throw new Error(`Failed to update vital signs: ${error.message}`);
      }

      console.log(
        `Successfully updated vital signs for appointment: ${data.appointmentId}`,
      );
    } catch (error) {
      console.error("Failed to update vital signs:", error);
      throw error;
    }
  }

  /**
   * Add appointment to urgent care list
   * Urgent care appointments are appointment types managed by appointment service
   */
  async addToUrgentCareList(
    appointmentId: string,
    priority: "urgent" | "emergency",
  ): Promise<void> {
    try {
      console.log(
        `Adding appointment ${appointmentId} to urgent care list with priority: ${priority}`,
      );

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

      console.log(
        `Successfully added appointment ${appointmentId} to urgent care list`,
      );
    } catch (error) {
      console.error("Failed to add to urgent care list:", error);
      throw error;
    }
  }

  // ==================== MISSING METHODS FROM INTERFACE ====================

  /**
   * Update appointment status
   * Loads aggregate, updates status, saves back
   */
  async updateStatus(
    appointmentId: AppointmentId,
    status: string,
  ): Promise<void> {
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
        throw new Error(
          `Failed to update appointment status: ${error.message}`,
        );
      }

      console.log(
        `Successfully updated appointment ${appointmentId.value} status to ${status}`,
      );
    } catch (error) {
      console.error("Failed to update appointment status:", error);
      throw error;
    }
  }

  /**
   * Update billing rates for appointments
   * Updates all appointments of a specific service type
   */
  async updateBillingRates(data: {
    serviceType: string;
    newRate: number;
    effectiveDate: Date;
  }): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .update({
          estimated_cost: data.newRate,
          updated_at: new Date().toISOString(),
        })
        .eq("type", data.serviceType)
        .gte(
          "appointment_date",
          data.effectiveDate.toISOString().split("T")[0],
        );

      if (error) {
        throw new Error(`Failed to update billing rates: ${error.message}`);
      }

      console.log(
        `Successfully updated billing rates for ${data.serviceType} to ${data.newRate}`,
      );
    } catch (error) {
      console.error("Failed to update billing rates:", error);
      throw error;
    }
  }

  /**
   * Find appointments by service type and date
   */
  async findByServiceTypeAndDate(
    serviceType: string,
    date: Date,
  ): Promise<Appointment[]> {
    try {
      const dateStr = date.toISOString().split("T")[0];
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*")
        .eq("type", serviceType)
        .eq("appointment_date", dateStr);

      if (error) {
        throw new Error(
          `Failed to find appointments by service type and date: ${error.message}`,
        );
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Convert to Appointment aggregates
      return data.map((row) => this.toDomain(row));
    } catch (error) {
      console.error(
        "Failed to find appointments by service type and date:",
        error,
      );
      throw error;
    }
  }

  /**
   * Find pending appointments by service type
   */
  async findPendingByServiceType(serviceType: string): Promise<Appointment[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*")
        .eq("type", serviceType)
        .eq("status", "pending");

      if (error) {
        throw new Error(
          `Failed to find pending appointments by service type: ${error.message}`,
        );
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Convert to Appointment aggregates
      return data.map((row) => this.toDomain(row));
    } catch (error) {
      console.error(
        "Failed to find pending appointments by service type:",
        error,
      );
      throw error;
    }
  }

  // ... rest of the code remains the same ...
  /**
   * Update patient insurance coverage
   * Updates all future appointments for a patient
   */
  async updatePatientInsuranceCoverage(data: {
    patientId: string;
    insuranceProvider: string;
    policyNumber: string;
    coverageType: string;
    validFrom: Date;
    validUntil: Date;
  }): Promise<void> {
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
        throw new Error(
          `Failed to update patient insurance coverage: ${error.message}`,
        );
      }

      console.log(
        `Successfully updated insurance coverage for patient ${data.patientId}`,
      );
    } catch (error) {
      console.error("Failed to update patient insurance coverage:", error);
      throw error;
    }
  }

  /**
   * Update patient scheduling preferences
   * Note: This would typically be stored in a separate patient_preferences table
   */
  async updatePatientSchedulingPreferences(data: {
    patientId: string;
    preferredDays: string[];
    preferredTimes: string[];
    preferredProviders: string[];
    specialRequirements: string[];
  }): Promise<void> {
    try {
      // For now, log the preference update
      // In a real implementation, this would update a patient_preferences table
      console.log(
        `Updating scheduling preferences for patient ${data.patientId}:`,
        data,
      );

      // TODO: Implement patient preferences table update
      console.log(
        "Patient scheduling preferences updated (placeholder implementation)",
      );
    } catch (error) {
      console.error("Failed to update patient scheduling preferences:", error);
      throw error;
    }
  }
}
