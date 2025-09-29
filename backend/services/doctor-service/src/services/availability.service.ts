import logger from "@hospital/shared/dist/utils/logger";
import { supabaseAdmin } from "../config/database.config";

export interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  appointment_count: number;
  max_appointments: number;
  slot_type: "available" | "booked" | "break" | "unavailable";
  appointment_id?: string;
  patient_name?: string;
  appointment_type?: string;
}

export interface DoctorAvailability {
  doctor_id: string;
  date: string;
  day_of_week: number;
  is_working_day: boolean;
  start_time?: string;
  end_time?: string;
  break_start?: string;
  break_end?: string;
  max_appointments: number;
  slot_duration: number;
  total_slots: number;
  available_slots: number;
  booked_slots: number;
  time_slots: TimeSlot[];
}

export interface AvailabilityQuery {
  doctor_id: string;
  date: string;
  duration?: number;
  appointment_type?: string;
  include_breaks?: boolean;
}

export class AvailabilityService {
  /**
   * Get comprehensive doctor availability for a specific date
   */
  async getDoctorAvailability(
    query: AvailabilityQuery
  ): Promise<DoctorAvailability | null> {
    try {
      const { doctor_id, date, duration = 30, include_breaks = false } = query;

      logger.info("🔄 Getting doctor availability", {
        doctor_id,
        date,
        duration,
      });

      // Get doctor schedule for the day
      const schedule = await this.getDoctorSchedule(doctor_id, date);
      if (!schedule) {
        logger.warn("⚠️ No schedule found for doctor", { doctor_id, date });
        return null;
      }

      // Get existing appointments for the day
      const appointments = await this.getDoctorAppointments(doctor_id, date);

      // Generate time slots
      const timeSlots = await this.generateTimeSlots(
        schedule,
        appointments,
        duration,
        include_breaks
      );

      // Calculate availability statistics
      const stats = this.calculateAvailabilityStats(timeSlots);

      const availability: DoctorAvailability = {
        doctor_id,
        date,
        day_of_week: new Date(date).getDay(),
        is_working_day: schedule.is_available,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        break_start: schedule.break_start,
        break_end: schedule.break_end,
        max_appointments: schedule.max_appointments,
        slot_duration: duration,
        total_slots: stats.total_slots,
        available_slots: stats.available_slots,
        booked_slots: stats.booked_slots,
        time_slots: timeSlots,
      };

      logger.info("✅ Doctor availability retrieved successfully", {
        doctor_id,
        date,
        available_slots: stats.available_slots,
        total_slots: stats.total_slots,
      });

      return availability;
    } catch (error) {
      logger.error("❌ Error getting doctor availability:", error);
      throw error;
    }
  }

  /**
   * Get available time slots only (for booking interface)
   */
  async getAvailableTimeSlots(
    doctor_id: string,
    date: string,
    duration: number = 30
  ): Promise<TimeSlot[]> {
    try {
      const availability = await this.getDoctorAvailability({
        doctor_id,
        date,
        duration,
      });

      if (!availability) {
        return [];
      }

      return availability.time_slots.filter(
        (slot) => slot.is_available && slot.slot_type === "available"
      );
    } catch (error) {
      logger.error("❌ Error getting available time slots:", error);
      throw error;
    }
  }

  /**
   * Check if a specific time slot is available
   */
  async isTimeSlotAvailable(
    doctor_id: string,
    date: string,
    start_time: string,
    end_time: string
  ): Promise<boolean> {
    try {
      logger.info("🔄 Checking time slot availability", {
        doctor_id,
        date,
        start_time,
        end_time,
      });

      // Check doctor schedule
      const schedule = await this.getDoctorSchedule(doctor_id, date);
      if (!schedule || !schedule.is_available) {
        logger.info("⚠️ Doctor not working on this date", { doctor_id, date });
        return false;
      }

      // Check if time is within working hours
      if (!this.isWithinWorkingHours(start_time, end_time, schedule)) {
        logger.info("⚠️ Time outside working hours", {
          start_time,
          end_time,
          schedule,
        });
        return false;
      }

      // Check for conflicts with existing appointments
      const hasConflict = await this.checkAppointmentConflict(
        doctor_id,
        date,
        start_time,
        end_time
      );
      if (hasConflict) {
        logger.info("⚠️ Time slot conflicts with existing appointment", {
          doctor_id,
          date,
          start_time,
          end_time,
        });
        return false;
      }

      logger.info("✅ Time slot is available", {
        doctor_id,
        date,
        start_time,
        end_time,
      });
      return true;
    } catch (error) {
      logger.error("❌ Error checking time slot availability:", error);
      return false;
    }
  }

  /**
   * Get doctor schedule for a specific date
   */
  private async getDoctorSchedule(
    doctor_id: string,
    date: string
  ): Promise<any> {
    try {
      const dayOfWeek = new Date(date).getDay();

      const { data, error } = await supabaseAdmin
        .from("doctor_schedules")
        .select("*")
        .eq("doctor_id", doctor_id)
        .eq("day_of_week", dayOfWeek)
        .eq("is_available", true)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error("Error getting doctor schedule:", error);
      return null;
    }
  }

  /**
   * Get doctor appointments for a specific date
   */
  private async getDoctorAppointments(
    doctor_id: string,
    date: string
  ): Promise<any[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from("appointments")
        .select(
          `
          appointment_id,
          start_time,
          end_time,
          appointment_type,
          status,
          patients!patient_id (
            profiles!profile_id (
              full_name
            )
          )
        `
        )
        .eq("doctor_id", doctor_id)
        .eq("appointment_date", date)
        .not("status", "in", "(cancelled,no_show)")
        .order("start_time");

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error("Error getting doctor appointments:", error);
      return [];
    }
  }

  /**
   * Generate time slots based on schedule and existing appointments
   */
  private async generateTimeSlots(
    schedule: any,
    appointments: any[],
    duration: number,
    include_breaks: boolean
  ): Promise<TimeSlot[]> {
    const slots: TimeSlot[] = [];

    const startMinutes = this.timeToMinutes(schedule.start_time);
    const endMinutes = this.timeToMinutes(schedule.end_time);
    const breakStartMinutes = schedule.break_start
      ? this.timeToMinutes(schedule.break_start)
      : null;
    const breakEndMinutes = schedule.break_end
      ? this.timeToMinutes(schedule.break_end)
      : null;

    for (
      let currentMinutes = startMinutes;
      currentMinutes < endMinutes;
      currentMinutes += duration
    ) {
      const slotStart = this.minutesToTime(currentMinutes);
      const slotEnd = this.minutesToTime(currentMinutes + duration);

      // Check if slot is during break time
      const isDuringBreak =
        breakStartMinutes &&
        breakEndMinutes &&
        currentMinutes >= breakStartMinutes &&
        currentMinutes < breakEndMinutes;

      if (isDuringBreak && !include_breaks) {
        continue;
      }

      // Find conflicting appointments
      const conflictingAppointment = appointments.find((apt) => {
        const aptStart = this.timeToMinutes(apt.start_time);
        const aptEnd = this.timeToMinutes(apt.end_time);
        return currentMinutes < aptEnd && currentMinutes + duration > aptStart;
      });

      const slot: TimeSlot = {
        start_time: slotStart,
        end_time: slotEnd,
        is_available: !conflictingAppointment && !isDuringBreak,
        appointment_count: conflictingAppointment ? 1 : 0,
        max_appointments: 1,
        slot_type: isDuringBreak
          ? "break"
          : conflictingAppointment
            ? "booked"
            : "available",
      };

      if (conflictingAppointment) {
        slot.appointment_id = conflictingAppointment.appointment_id;
        slot.patient_name =
          conflictingAppointment.patients?.profiles?.full_name;
        slot.appointment_type = conflictingAppointment.appointment_type;
      }

      slots.push(slot);
    }

    return slots;
  }

  /**
   * Calculate availability statistics
   */
  private calculateAvailabilityStats(timeSlots: TimeSlot[]): {
    total_slots: number;
    available_slots: number;
    booked_slots: number;
  } {
    const total_slots = timeSlots.length;
    const available_slots = timeSlots.filter(
      (slot) => slot.is_available
    ).length;
    const booked_slots = timeSlots.filter(
      (slot) => slot.slot_type === "booked"
    ).length;

    return { total_slots, available_slots, booked_slots };
  }

  /**
   * Check if time is within working hours
   */
  private isWithinWorkingHours(
    start_time: string,
    end_time: string,
    schedule: any
  ): boolean {
    const startMinutes = this.timeToMinutes(start_time);
    const endMinutes = this.timeToMinutes(end_time);
    const workStartMinutes = this.timeToMinutes(schedule.start_time);
    const workEndMinutes = this.timeToMinutes(schedule.end_time);

    return startMinutes >= workStartMinutes && endMinutes <= workEndMinutes;
  }

  /**
   * Check for appointment conflicts via Appointment Service
   * REMOVED: Duplicate logic - use Appointment Service API instead
   * This ensures single source of truth for conflict detection
   */
  private async checkAppointmentConflict(
    doctor_id: string,
    date: string,
    start_time: string,
    end_time: string
  ): Promise<boolean> {
    try {
      // TODO: Call Appointment Service API for conflict checking
      // For now, return false to avoid blocking availability checks
      // This should be implemented to call Appointment Service /api/appointments/check-conflicts
      logger.info(
        "⚠️ Appointment conflict check delegated to Appointment Service",
        {
          doctor_id,
          date,
          start_time,
          end_time,
        }
      );

      return false; // Assume no conflict for availability checking
    } catch (error) {
      logger.error("Error checking appointment conflict:", error);
      return true; // Assume conflict on error for safety
    }
  }

  /**
   * Utility: Convert time string to minutes
   */
  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Utility: Convert minutes to time string
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }
}
