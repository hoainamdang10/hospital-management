import logger from "@hospital/shared/dist/utils/logger";
import { dbPool, supabaseAdmin } from "../config/database.config";
import {
  Appointment,
  AppointmentSearchFilters,
  AppointmentStats,
  AppointmentWithDetails,
  ConflictCheck,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from "../types/appointment.types";

export class AppointmentRepository {
  private supabase = supabaseAdmin; // Legacy fallback
  private pool = dbPool; // Primary connection pool

  // Remove local ID generation - now handled by database functions

  // Get all appointments with optional filters and pagination
  async getAllAppointments(
    filters: AppointmentSearchFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ appointments: AppointmentWithDetails[]; total: number }> {
    try {
      return await this.pool.executeQuery(async (client) => {
        let query = client.from("appointments").select("*", { count: "exact" });

        // Apply filters
        if (filters.doctor_id) {
          query = query.eq("doctor_id", filters.doctor_id);
        }

        if (filters.patient_id) {
          query = query.eq("patient_id", filters.patient_id);
        }

        if (filters.appointment_date) {
          query = query.eq("appointment_date", filters.appointment_date);
        }

        if (filters.date_from) {
          query = query.gte("appointment_date", filters.date_from);
        }

        if (filters.date_to) {
          query = query.lte("appointment_date", filters.date_to);
        }

        if (filters.status) {
          query = query.eq("status", filters.status);
        }

        if (filters.type) {
          query = query.eq("type", filters.type);
        }

        if (filters.search) {
          // Search in reason, notes, or joined patient/doctor names
          query = query.or(
            `reason.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
          );
        }

        // Apply pagination
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        // Order by appointment date and time
        query = query
          .order("appointment_date", { ascending: true })
          .order("appointment_time", { ascending: true });

        const { data, error, count } = await query;

        if (error) {
          logger.error("Error fetching appointments:", error);
          throw new Error(`Failed to fetch appointments: ${error.message}`);
        }

        // Fetch doctor and patient details separately for each appointment
        const transformedData = await Promise.all(
          (data || []).map(async (appointment: any) => {
            // Fetch doctor details
            let doctor = null;
            // Cross-service lookup removed: use API Gateway to fetch doctor details if needed

            // Fetch patient details
            let patient = null;
            // Cross-service lookup removed: use API Gateway to fetch patient details if needed

            return {
              ...appointment,
              doctor,
              patient,
            };
          })
        );

        return {
          appointments: transformedData as AppointmentWithDetails[],
          total: count || 0,
        };
      });
    } catch (error) {
      logger.error("Exception in getAllAppointments:", error);
      throw error;
    }
  }

  // Get appointment by ID
  async getAppointmentById(
    appointment_id: string
  ): Promise<AppointmentWithDetails | null> {
    try {
      const { data, error } = await this.supabase
        .from("appointments")
        .select("*")
        .eq("appointment_id", appointment_id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Appointment not found
        }
        logger.error("Error fetching appointment by ID:", error);
        throw new Error(`Failed to fetch appointment: ${error.message}`);
      }

      return data as AppointmentWithDetails;
    } catch (error) {
      logger.error("Exception in getAppointmentById:", error);
      throw error;
    }
  }

  // Get appointments by doctor ID
  async getAppointmentsByDoctorId(
    doctor_id: string,
    filters: Partial<AppointmentSearchFilters> = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ appointments: AppointmentWithDetails[]; total: number }> {
    const searchFilters = { ...filters, doctor_id: doctor_id };
    return this.getAllAppointments(searchFilters, page, limit);
  }

  // Get appointments by patient ID
  async getAppointmentsByPatientId(
    patient_id: string,
    filters: Partial<AppointmentSearchFilters> = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ appointments: AppointmentWithDetails[]; total: number }> {
    const searchFilters = { ...filters, patient_id: patient_id };
    return this.getAllAppointments(searchFilters, page, limit);
  }

  // Create new appointment
  async createAppointment(
    appointmentData: CreateAppointmentDto
  ): Promise<Appointment> {
    try {
      const { data, error } = await this.supabase.rpc("create_appointment", {
        appointment_data: {
          ...appointmentData,
          status: "scheduled",
        },
      });

      if (error) {
        logger.error("Database function error in createAppointment:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("Failed to create appointment - no data returned");
      }

      logger.info("Appointment created successfully via database function:", {
        appointment_id: data[0].appointment_id,
      });

      return data[0] as Appointment;
    } catch (error) {
      logger.error("Exception in createAppointment:", error);
      throw error;
    }
  }

  // Update appointment
  async updateAppointment(
    appointment_id: string,
    updateData: UpdateAppointmentDto
  ): Promise<Appointment> {
    try {
      const { data, error } = await this.supabase.rpc("update_appointment", {
        input_appointment_id: appointment_id,
        appointment_data: updateData,
      });

      if (error) {
        logger.error("Database function error in updateAppointment:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("Failed to update appointment - appointment not found");
      }

      logger.info("Appointment updated successfully via database function:", {
        appointment_id,
        updatedFields: Object.keys(updateData),
      });

      return data[0] as Appointment;
    } catch (error) {
      logger.error("Exception in updateAppointment:", error);
      throw error;
    }
  }

  // Cancel appointment (soft delete by setting status to cancelled)
  async cancelAppointment(
    appointment_id: string,
    reason?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status: "cancelled",
        updated_at: new Date().toISOString(),
      };

      if (reason) {
        updateData.notes = reason;
      }

      const { error } = await this.supabase
        .from("appointments")
        .update(updateData)
        .eq("appointment_id", appointment_id);

      if (error) {
        logger.error("Error cancelling appointment:", error);
        throw new Error(`Failed to cancel appointment: ${error.message}`);
      }

      logger.info("Appointment cancelled successfully:", { appointment_id });
      return true;
    } catch (error) {
      logger.error("Exception in cancelAppointment:", error);
      throw error;
    }
  }

  // Check for appointment conflicts
  async checkConflicts(
    doctor_id: string,
    appointmentDate: string,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string
  ): Promise<ConflictCheck> {
    try {
      let query = this.supabase
        .from("appointments")
        .select("appointment_id, appointment_time, duration_minutes, status")
        .eq("doctor_id", doctor_id)
        .eq("appointment_date", appointmentDate)
        .in("status", ["scheduled", "confirmed", "in_progress"]);

      if (excludeAppointmentId) {
        query = query.neq("appointment_id", excludeAppointmentId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error("Error checking appointment conflicts:", error);
        throw new Error(`Failed to check conflicts: ${error.message}`);
      }

      const conflicts =
        data?.filter((appointment) => {
          // Convert all times to Date objects for comparison
          const requestStartTime = new Date(`1970-01-01T${startTime}`);
          const requestEndTime = new Date(`1970-01-01T${endTime}`);
          const existingStartTime = new Date(
            `1970-01-01T${appointment.appointment_time}`
          );
          const existingEndTime = new Date(
            `1970-01-01T${appointment.appointment_time}`
          );
          existingEndTime.setMinutes(
            existingEndTime.getMinutes() + appointment.duration_minutes
          );

          // Check for time overlap
          return (
            (requestStartTime >= existingStartTime &&
              requestStartTime < existingEndTime) ||
            (requestEndTime > existingStartTime &&
              requestEndTime <= existingEndTime) ||
            (requestStartTime <= existingStartTime &&
              requestEndTime >= existingEndTime)
          );
        }) || [];

      return {
        has_conflict: conflicts.length > 0,
        conflicting_appointments:
          conflicts.length > 0 ? (conflicts as any[]) : undefined,
        message:
          conflicts.length > 0
            ? "Time slot conflicts with existing appointment"
            : undefined,
      };
    } catch (error) {
      logger.error("Exception in checkConflicts:", error);
      throw error;
    }
  }

  // Check if appointment exists
  async appointmentExists(appointment_id: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from("appointments")
        .select("appointment_id")
        .eq("appointment_id", appointment_id)
        .single();

      if (error && error.code !== "PGRST116") {
        logger.error("Error checking appointment existence:", error);
        throw new Error(
          `Failed to check appointment existence: ${error.message}`
        );
      }

      return !!data;
    } catch (error) {
      logger.error("Exception in appointmentExists:", error);
      throw error;
    }
  }

  // Get appointment statistics
  async getAppointmentStats(): Promise<AppointmentStats> {
    try {
      const { data, error } = await this.supabase
        .from("appointments")
        .select("status, type, appointment_date, created_at");

      if (error) {
        logger.error("Error fetching appointment stats:", error);
        throw new Error(`Failed to fetch appointment stats: ${error.message}`);
      }

      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats: AppointmentStats = {
        total: data?.length || 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        byStatus: {
          scheduled: 0,
          confirmed: 0,
          in_progress: 0,
          completed: 0,
          cancelled: 0,
          no_show: 0,
        },
        byType: {
          consultation: 0,
          follow_up: 0,
          emergency: 0,
          telemedicine: 0,
          surgery: 0,
          procedure: 0,
        },
      };

      data?.forEach((appointment) => {
        // Count by status
        if (appointment.status in stats.byStatus) {
          stats.byStatus[appointment.status as keyof typeof stats.byStatus]++;
        }

        // Count by type
        if (appointment.type in stats.byType) {
          stats.byType[appointment.type as keyof typeof stats.byType]++;
        }

        // Count by date
        const appointmentDate = new Date(appointment.appointment_date);
        const createdDate = new Date(appointment.created_at);

        if (appointment.appointment_date === today) {
          stats.today++;
        }

        if (appointmentDate >= weekStart) {
          stats.thisWeek++;
        }

        if (createdDate >= monthStart) {
          stats.thisMonth++;
        }
      });

      return stats;
    } catch (error) {
      logger.error("Exception in getAppointmentStats:", error);
      throw error;
    }
  }

  // Get upcoming appointments for a doctor
  async getUpcomingAppointments(
    doctor_id: string,
    days: number = 7
  ): Promise<AppointmentWithDetails[]> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      const futureDateStr = futureDate.toISOString().split("T")[0];

      const { data, error } = await this.supabase
        .from("appointments")
        .select(
          `
          *,
          patients!patient_id (
            patient_id,
            gender,
            profile:profiles!profile_id (
              full_name,
              date_of_birth,
              phone_number,
              email
            )
          )
        `
        )
        .eq("doctor_id", doctor_id)
        .gte("appointment_date", today)
        .lte("appointment_date", futureDateStr)
        .in("status", ["scheduled", "confirmed"])
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (error) {
        logger.error("Error fetching upcoming appointments:", error);
        throw new Error(
          `Failed to fetch upcoming appointments: ${error.message}`
        );
      }

      // Transform data
      const transformedData =
        data?.map((appointment) => ({
          ...appointment,
          patient: appointment.patients
            ? {
                patient_id: appointment.patients.patient_id,
                full_name: appointment.patients.profile?.full_name,
                date_of_birth: appointment.patients.profile?.date_of_birth,
                gender: appointment.patients.gender,
                phone_number: appointment.patients.profile?.phone_number,
                email: appointment.patients.profile?.email,
              }
            : undefined,
        })) || [];

      return transformedData as AppointmentWithDetails[];
    } catch (error) {
      logger.error("Exception in getUpcomingAppointments:", error);
      throw error;
    }
  }

  // CALENDAR INTEGRATION METHODS

  // Get calendar view for appointments
  async getCalendarView(
    date: string,
    doctor_id?: string,
    view: "day" | "week" | "month" = "month"
  ): Promise<any> {
    try {
      let startDate: string;
      let endDate: string;
      const inputDate = new Date(date);

      // Calculate date range based on view
      switch (view) {
        case "day":
          startDate = date;
          endDate = date;
          break;
        case "week":
          const weekStart = new Date(inputDate);
          weekStart.setDate(inputDate.getDate() - inputDate.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          startDate = weekStart.toISOString().split("T")[0];
          endDate = weekEnd.toISOString().split("T")[0];
          break;
        case "month":
          const monthStart = new Date(
            inputDate.getFullYear(),
            inputDate.getMonth(),
            1
          );
          const monthEnd = new Date(
            inputDate.getFullYear(),
            inputDate.getMonth() + 1,
            0
          );
          startDate = monthStart.toISOString().split("T")[0];
          endDate = monthEnd.toISOString().split("T")[0];
          break;
      }

      let query = this.supabase
        .from("appointments")
        .select("*")
        .gte("appointment_date", startDate)
        .lte("appointment_date", endDate)
        .in("status", ["scheduled", "confirmed", "in_progress", "completed"]);

      if (doctor_id) {
        query = query.eq("doctor_id", doctor_id);
      }

      const { data, error } = await query
        .order("appointment_date")
        .order("appointment_time");

      if (error) {
        logger.error("Error fetching calendar view:", error);
        throw new Error(`Failed to fetch calendar view: ${error.message}`);
      }

      // Group appointments by date
      const calendar: { [date: string]: any[] } = {};

      data?.forEach((appointment) => {
        const appointmentDate = appointment.appointment_date;
        if (!calendar[appointmentDate]) {
          calendar[appointmentDate] = [];
        }

        calendar[appointmentDate].push({
          appointment_id: appointment.appointment_id,
          appointment_time: appointment.appointment_time,
          duration_minutes: appointment.duration_minutes,
          status: appointment.status,
          type: appointment.type,
          doctor: null,
          patient: null,
        });
      });

      return {
        view,
        startDate,
        endDate,
        calendar,
        totalAppointments: data?.length || 0,
      };
    } catch (error) {
      logger.error("Exception in getCalendarView:", error);
      throw error;
    }
  }

  // Get weekly schedule for a doctor
  async getWeeklySchedule(doctor_id: string, startDate?: string): Promise<any> {
    try {
      const weekStart = startDate ? new Date(startDate) : new Date();
      if (!startDate) {
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start from Sunday
      }

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const startDateStr = weekStart.toISOString().split("T")[0];
      const endDateStr = weekEnd.toISOString().split("T")[0];

      const { data, error } = await this.supabase
        .from("appointments")
        .select("*")
        .eq("doctor_id", doctor_id)
        .gte("appointment_date", startDateStr)
        .lte("appointment_date", endDateStr)
        .in("status", ["scheduled", "confirmed", "in_progress"])
        .order("appointment_date")
        .order("appointment_time");

      if (error) {
        logger.error("Error fetching weekly schedule:", error);
        throw new Error(`Failed to fetch weekly schedule: ${error.message}`);
      }

      // Create weekly schedule structure
      const weeklySchedule: { [day: string]: any[] } = {};
      const daysOfWeek = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      // Initialize all days
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStart);
        currentDate.setDate(weekStart.getDate() + i);
        const dateStr = currentDate.toISOString().split("T")[0];
        weeklySchedule[dateStr] = [];
      }

      // Populate with appointments
      data?.forEach((appointment) => {
        const appointmentDate = appointment.appointment_date;
        weeklySchedule[appointmentDate].push({
          appointment_id: appointment.appointment_id,
          appointment_time: appointment.appointment_time,
          duration_minutes: appointment.duration_minutes,
          status: appointment.status,
          type: appointment.type,
          reason: appointment.reason,
          patient: appointment.patients
            ? {
                patient_id: appointment.patients.patient_id,
                full_name: appointment.patients.profile?.full_name,
                phone_number: appointment.patients.profile?.phone_number,
              }
            : null,
        });
      });

      return {
        doctor_id,
        weekStart: startDateStr,
        weekEnd: endDateStr,
        schedule: weeklySchedule,
        totalAppointments: data?.length || 0,
      };
    } catch (error) {
      logger.error("Exception in getWeeklySchedule:", error);
      throw error;
    }
  }

  // Get available slots for a doctor on a specific date
  async getAvailableSlots(
    doctor_id: string,
    date: string,
    duration: number = 30
  ): Promise<any[]> {
    try {
      // Use the smart scheduling database function
      const { data, error } = await this.supabase.rpc(
        "find_optimal_time_slots",
        {
          input_doctor_id: doctor_id,
          input_date: date,
          duration_minutes: duration,
        }
      );

      if (error) {
        logger.error("Error fetching available slots:", error);
        throw new Error(`Failed to fetch available slots: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error("Exception in getAvailableSlots:", error);
      throw error;
    }
  }

  // Get appointment statistics for a specific doctor
  async getDoctorAppointmentStats(doctor_id: string): Promise<any> {
    try {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get all appointments for this doctor
      const { data: appointments, error } = await this.supabase
        .from("appointments")
        .select("appointment_id, status, type, appointment_date")
        .eq("doctor_id", doctor_id);

      if (error) {
        logger.error("Error fetching doctor appointment stats:", error);
        throw error;
      }

      const appointmentList = appointments || [];

      // Calculate statistics
      const total = appointmentList.length;
      const todayAppointments = appointmentList.filter(
        (a) => a.appointment_date === today
      ).length;
      const thisWeekAppointments = appointmentList.filter(
        (a) => new Date(a.appointment_date) >= thisWeekStart
      ).length;
      const thisMonthAppointments = appointmentList.filter(
        (a) => new Date(a.appointment_date) >= thisMonthStart
      ).length;

      // Group by status
      const byStatus = {
        scheduled: appointmentList.filter((a) => a.status === "scheduled")
          .length,
        confirmed: appointmentList.filter((a) => a.status === "confirmed")
          .length,
        in_progress: appointmentList.filter((a) => a.status === "in_progress")
          .length,
        completed: appointmentList.filter((a) => a.status === "completed")
          .length,
        cancelled: appointmentList.filter((a) => a.status === "cancelled")
          .length,
        no_show: appointmentList.filter((a) => a.status === "no_show").length,
      };

      // Group by type
      const byType = {
        consultation: appointmentList.filter((a) => a.type === "consultation")
          .length,
        follow_up: appointmentList.filter((a) => a.type === "follow_up").length,
        emergency: appointmentList.filter((a) => a.type === "emergency").length,
        telemedicine: appointmentList.filter((a) => a.type === "telemedicine")
          .length,
        surgery: appointmentList.filter((a) => a.type === "surgery").length,
        procedure: appointmentList.filter((a) => a.type === "procedure").length,
      };

      return {
        total_appointments: total,
        appointments_this_month: thisMonthAppointments,
        today_appointments: todayAppointments,
        this_week_appointments: thisWeekAppointments,
        by_status: byStatus,
        by_type: byType,
      };
    } catch (error) {
      logger.error("Exception in getDoctorAppointmentStats:", error);
      throw error;
    }
  }

  // Get unique patient count for a specific doctor
  async getDoctorPatientCount(doctor_id: string): Promise<number> {
    try {
      const { data: appointments, error } = await this.supabase
        .from("appointments")
        .select("patient_id")
        .eq("doctor_id", doctor_id);

      if (error) {
        logger.error("Error fetching doctor patient count:", error);
        throw error;
      }

      // Get unique patient IDs
      const uniquePatients = [
        ...new Set((appointments || []).map((a) => a.patient_id)),
      ];

      return uniquePatients.length;
    } catch (error) {
      logger.error("Exception in getDoctorPatientCount:", error);
      throw error;
    }
  }
}
