// Receptionist Repository
// Hospital Management System - Phase 2B Implementation

import logger from "@hospital/shared/dist/utils/logger";
import { supabaseAdmin } from "../../../config/database.config";
import {
  CheckInData,
  CheckInError,
  DashboardStats,
  PaginatedResponse,
  PatientCheckIn,
  PatientSearchCriteria,
  PatientSearchResult,
  QueueError,
  QueueItem,
  QueueStatus,
  Receptionist,
} from "../types/receptionist.types";

export class ReceptionistRepository {
  // =====================================================
  // RECEPTIONIST MANAGEMENT
  // =====================================================

  async findById(receptionistId: string): Promise<Receptionist | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from("receptionist")
        .select("*")
        .eq("receptionist_id", receptionistId)
        .single();

      if (error) {
        logger.error("Error finding receptionist by ID:", error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error("Repository error in findById:", error);
      return null;
    }
  }

  async findByProfileId(profileId: string): Promise<Receptionist | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from("receptionist")
        .select("*")
        .eq("profile_id", profileId)
        .eq("is_active", true)
        .single();

      if (error) {
        logger.error("Error finding receptionist by profile ID:", error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error("Repository error in findByProfileId:", error);
      return null;
    }
  }

  async updateShiftSchedule(
    receptionistId: string,
    shiftSchedule: any
  ): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from("receptionist")
        .update({
          shift_schedule: shiftSchedule,
          updated_at: new Date().toISOString(),
        })
        .eq("receptionist_id", receptionistId);

      if (error) {
        logger.error("Error updating shift schedule:", error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error("Repository error in updateShiftSchedule:", error);
      return false;
    }
  }

  // =====================================================
  // CHECK-IN MANAGEMENT
  // =====================================================

  async createCheckIn(checkInData: CheckInData): Promise<PatientCheckIn> {
    try {
      // Validate appointment exists and is not already checked in
      const { data: existingCheckIn } = await supabaseAdmin
        .from("patient_check_ins")
        .select("check_in_id")
        .eq("appointment_id", checkInData.appointment_id)
        .single();

      if (existingCheckIn) {
        throw new CheckInError(
          "Bệnh nhân đã check-in cho lịch hẹn này",
          "ALREADY_CHECKED_IN"
        );
      }

      const { data, error } = await supabaseAdmin
        .from("patient_check_ins")
        .insert({
          patient_id: checkInData.patient_id,
          appointment_id: checkInData.appointment_id,
          receptionist_id: checkInData.receptionist_id,
          check_in_time: checkInData.check_in_time,
          insurance_verified: checkInData.insurance_verified,
          documents_complete: checkInData.documents_complete,
          notes: checkInData.notes,
          status: checkInData.status,
          priority_level: checkInData.priority_level || "normal",
          special_requirements: checkInData.special_requirements || [],
        })
        .select()
        .single();

      if (error) {
        logger.error("Error creating check-in:", error);
        throw new CheckInError("Lỗi khi tạo check-in", "CREATE_FAILED");
      }

      // Update appointment status to checked_in
      await this.updateAppointmentStatus(
        checkInData.appointment_id,
        "checked_in"
      );

      return data;
    } catch (error) {
      logger.error("Repository error in createCheckIn:", error);
      throw error;
    }
  }

  async updateCheckInStatus(
    checkInId: string,
    status: string
  ): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from("patient_check_ins")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("check_in_id", checkInId);

      if (error) {
        logger.error("Error updating check-in status:", error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error("Repository error in updateCheckInStatus:", error);
      return false;
    }
  }

  // =====================================================
  // QUEUE MANAGEMENT
  // =====================================================

  async getQueue(date?: string): Promise<QueueItem[]> {
    try {
      const targetDate = date || new Date().toISOString().split("T")[0];

      const { data, error } = await supabaseAdmin
        .from("appointments")
        .select(
          `
          appointment_id,
          patient_id,
          doctor_id,
          appointment_date,
          appointment_time,
          status,
          type,
          patients:patient_id (
            patient_id,
            profiles:profile_id (
              full_name
            )
          ),
          doctors:doctor_id (
            doctor_id,
            profiles:profile_id (
              full_name
            ),
            specialty
          ),
          patient_check_ins (
            check_in_time,
            status,
            priority_level,
            special_requirements
          )
        `
        )
        .eq("appointment_date", targetDate)
        .in("status", ["scheduled", "checked_in", "in_progress"])
        .order("appointment_time", { ascending: true });

      if (error) {
        logger.error("Error getting queue:", error);
        return [];
      }

      // Transform data to QueueItem format với priority sorting
      const queueItems: QueueItem[] = data
        .map((appointment: any, index: number) => ({
          id: appointment.appointment_id,
          patient_id: appointment.patient_id,
          appointment_id: appointment.appointment_id,
          patient_name: appointment.patients?.profiles?.full_name || "Unknown",
          doctor_name: appointment.doctors?.profiles?.full_name || "Unknown",
          appointment_time: appointment.appointment_time,
          status: appointment.status,
          check_in_time: appointment.patient_check_ins?.[0]?.check_in_time,
          queue_number: 0, // Will be calculated after sorting
          estimated_wait_time: 0, // Will be calculated after sorting
          priority_level:
            appointment.patient_check_ins?.[0]?.priority_level || "normal",
          special_requirements:
            appointment.patient_check_ins?.[0]?.special_requirements || [],
          department: appointment.doctors?.specialty,
        }))
        .sort((a, b) => {
          // Sort by priority first, then by appointment time
          const priorityOrder = { emergency: 0, urgent: 1, normal: 2 };
          const aPriority =
            priorityOrder[a.priority_level as keyof typeof priorityOrder];
          const bPriority =
            priorityOrder[b.priority_level as keyof typeof priorityOrder];

          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }

          return a.appointment_time.localeCompare(b.appointment_time);
        })
        .map((item, index) => ({
          ...item,
          queue_number: index + 1,
          estimated_wait_time: this.calculateEstimatedWaitTime(
            index,
            item.priority_level
          ),
        }));

      return queueItems;
    } catch (error) {
      logger.error("Repository error in getQueue:", error);
      return [];
    }
  }

  async getQueueStatus(date?: string): Promise<QueueStatus> {
    try {
      const queueItems = await this.getQueue(date);

      const totalPatients = queueItems.length;
      const waitingPatients = queueItems.filter(
        (item) => item.status === "checked_in"
      ).length;
      const inProgressPatients = queueItems.filter(
        (item) => item.status === "in_progress"
      ).length;
      const completedPatients = queueItems.filter(
        (item) => item.status === "completed"
      ).length;

      const waitTimes = queueItems
        .filter((item) => item.estimated_wait_time > 0)
        .map((item) => item.estimated_wait_time);

      const averageWaitTime =
        waitTimes.length > 0
          ? Math.round(
              waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length
            )
          : 0;

      const longestWaitTime = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;

      return {
        total_patients: totalPatients,
        waiting_patients: waitingPatients,
        in_progress_patients: inProgressPatients,
        completed_patients: completedPatients,
        average_wait_time: averageWaitTime,
        longest_wait_time: longestWaitTime,
        queue_items: queueItems,
        last_updated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Repository error in getQueueStatus:", error);
      throw new QueueError(
        "Lỗi khi lấy trạng thái hàng đợi",
        "QUEUE_STATUS_ERROR"
      );
    }
  }

  async callNextPatient(
    doctorId: string,
    roomNumber?: string
  ): Promise<QueueItem | null> {
    try {
      const queue = await this.getQueue();

      // Find next patient for this doctor
      const nextPatient = queue.find(
        (item) =>
          item.status === "checked_in" && item.appointment_id.includes(doctorId) // Simplified check - should be improved
      );

      if (!nextPatient) {
        return null;
      }

      // Update appointment status to in_progress
      await this.updateAppointmentStatus(
        nextPatient.appointment_id,
        "in_progress"
      );

      // Update check-in status
      const { data: checkIn } = await supabaseAdmin
        .from("patient_check_ins")
        .select("check_in_id")
        .eq("appointment_id", nextPatient.appointment_id)
        .single();

      if (checkIn) {
        await this.updateCheckInStatus(checkIn.check_in_id, "called");
      }

      return {
        ...nextPatient,
        status: "in_progress",
        room_number: roomNumber,
      };
    } catch (error) {
      logger.error("Repository error in callNextPatient:", error);
      return null;
    }
  }

  // =====================================================
  // APPOINTMENT MANAGEMENT
  // =====================================================

  async updateAppointmentStatus(
    appointmentId: string,
    status: string
  ): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from("appointments")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("appointment_id", appointmentId);

      if (error) {
        logger.error("Error updating appointment status:", error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error("Repository error in updateAppointmentStatus:", error);
      return false;
    }
  }

  async updateAppointmentNotes(
    appointmentId: string,
    notes: string,
    insuranceVerified?: boolean
  ): Promise<boolean> {
    try {
      const updateData: any = {
        receptionist_notes: notes,
        updated_at: new Date().toISOString(),
      };

      if (insuranceVerified !== undefined) {
        updateData.insurance_verified = insuranceVerified;
      }

      const { error } = await supabaseAdmin
        .from("appointments")
        .update(updateData)
        .eq("appointment_id", appointmentId);

      if (error) {
        logger.error("Error updating appointment notes:", error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error("Repository error in updateAppointmentNotes:", error);
      return false;
    }
  }

  // =====================================================
  // PATIENT SEARCH
  // =====================================================

  async searchPatients(
    criteria: PatientSearchCriteria
  ): Promise<PaginatedResponse<PatientSearchResult>> {
    try {
      let query = supabaseAdmin.from("patients").select(
        `
          patient_id,
          profiles:profile_id (
            full_name,
            phone_number,
            date_of_birth
          ),
          insurance_number,
          status,
          created_at
        `,
        { count: "exact" }
      );

      // Apply search filters
      if (criteria.query) {
        query = query.or(
          `profiles.full_name.ilike.%${criteria.query}%,patient_id.ilike.%${criteria.query}%`
        );
      }

      if (criteria.phone) {
        query = query.eq("profiles.phone_number", criteria.phone);
      }

      if (criteria.patient_id) {
        query = query.eq("patient_id", criteria.patient_id);
      }

      if (criteria.insurance_number) {
        query = query.eq("insurance_number", criteria.insurance_number);
      }

      // Apply pagination
      const page = criteria.page || 1;
      const limit = criteria.limit || 20;
      const offset = (page - 1) * limit;

      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        logger.error("Error searching patients:", error);
        throw error;
      }

      const results: PatientSearchResult[] = (data || []).map(
        (patient: any) => ({
          patient_id: patient.patient_id,
          full_name: patient.profiles?.full_name || "Unknown",
          phone_number: patient.profiles?.phone_number,
          date_of_birth: patient.profiles?.date_of_birth,
          insurance_number: patient.insurance_number,
          status: patient.status || "active",
        })
      );

      return {
        data: results,
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
          has_next: offset + limit < (count || 0),
          has_prev: page > 1,
        },
      };
    } catch (error) {
      logger.error("Repository error in searchPatients:", error);
      throw error;
    }
  }

  // =====================================================
  // DASHBOARD STATISTICS
  // =====================================================

  async getDashboardStats(): Promise<DashboardStats | null> {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Get today's appointments
      const { data: appointments } = await supabaseAdmin
        .from("appointments")
        .select("status, appointment_time")
        .eq("appointment_date", today);

      // Get today's check-ins
      const { data: checkIns } = await supabaseAdmin
        .from("patient_check_ins")
        .select("*")
        .gte("check_in_time", `${today}T00:00:00`)
        .lt("check_in_time", `${today}T23:59:59`);

      // Get queue status
      const queueStatus = await this.getQueueStatus();

      // Calculate statistics
      const totalAppointments = appointments?.length || 0;
      const completedAppointments =
        appointments?.filter((a) => a.status === "completed").length || 0;
      const cancelledAppointments =
        appointments?.filter((a) => a.status === "cancelled").length || 0;
      const noShowAppointments =
        appointments?.filter((a) => a.status === "no_show").length || 0;

      const stats: DashboardStats = {
        today: {
          total_appointments: totalAppointments,
          completed_appointments: completedAppointments,
          cancelled_appointments: cancelledAppointments,
          no_show_appointments: noShowAppointments,
          total_check_ins: checkIns?.length || 0,
          average_wait_time: queueStatus.average_wait_time,
          patient_satisfaction: 8.5, // Mock data
          busiest_hour: this.calculateBusiestHour(appointments || []),
        },
        current_shift: {
          shift_start: "08:00",
          shift_end: "17:00",
          patients_served: completedAppointments,
          current_queue_length: queueStatus.waiting_patients,
          average_service_time: 20, // Mock data
          efficiency_rating: 85, // Mock data
        },
        queue_status: queueStatus,
        performance_metrics: {
          check_in_speed: 120, // seconds
          queue_management_efficiency: 90, // percentage
          patient_satisfaction_score: 8.5,
          error_rate: 2, // percentage
          productivity_score: 88,
        },
        alerts: [], // Would be populated with actual alerts
      };

      return stats;
    } catch (error) {
      logger.error("Repository error in getDashboardStats:", error);
      return null;
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private calculateEstimatedWaitTime(
    queuePosition: number,
    priority: string
  ): number {
    const baseTime = 15; // 15 minutes per patient
    const priorityMultiplier =
      priority === "emergency" ? 0.5 : priority === "urgent" ? 0.7 : 1;
    return Math.round(queuePosition * baseTime * priorityMultiplier);
  }

  private calculateBusiestHour(appointments: any[]): string {
    const hourCounts: { [key: string]: number } = {};

    appointments.forEach((appointment) => {
      const hour = appointment.appointment_time?.split(":")[0] || "00";
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const busiestHour =
      Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "09";

    return `${busiestHour}:00`;
  }
}
