import logger from "@hospital/shared/dist/utils/logger";
import { dbPool, supabaseAdmin } from "../config/database.config";

export interface Receptionist {
  receptionist_id: string;
  profile_id: string;
  full_name: string;
  department_id?: string;
  shift_schedule: any;
  access_permissions: {
    can_manage_appointments: boolean;
    can_manage_patients: boolean;
    can_view_medical_records: boolean;
  };
  can_manage_appointments: boolean;
  can_manage_patients: boolean;
  can_view_medical_records: boolean;
  languages_spoken: string[];
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CheckInData {
  patient_id: string;
  appointment_id: string;
  receptionist_id: string;
  check_in_time: string;
  insurance_verified: boolean;
  documents_complete: boolean;
  notes?: string;
  status: string;
}

export interface QueueItem {
  id: string;
  patient_id: string;
  appointment_id: string;
  patient_name: string;
  doctor_name: string;
  appointment_time: string;
  status: string;
  check_in_time?: string;
  queue_number: number;
  estimated_wait_time: number;
}

export class ReceptionistRepository {
  private pool = dbPool; // Primary connection pool
  private supabase = supabaseAdmin; // Legacy fallback
  async findById(receptionistId: string): Promise<Receptionist | null> {
    try {
      // Use Connection Pool for standard query operations
      return await this.pool.executeQuery(async (client) => {
        const { data, error } = await client
          .from("receptionist")
          .select("*")
          .eq("receptionist_id", receptionistId)
          .single();

        if (error) {
          logger.error("Error finding receptionist by ID:", error);
          return null;
        }

        return data;
      });
    } catch (error) {
      logger.error("Connection pool error in findById:", error);

      // FALLBACK: Use direct client if pool fails
      try {
        const { data, error: fallbackError } = await this.supabase
          .from("receptionist")
          .select("*")
          .eq("receptionist_id", receptionistId)
          .single();

        if (fallbackError) {
          logger.error("Fallback error in findById:", fallbackError);
          return null;
        }

        return data;
      } catch (fallbackError) {
        logger.error(
          "Both pool and fallback failed in findById:",
          fallbackError
        );
        return null;
      }
    }
  }

  async findByProfileId(profileId: string): Promise<Receptionist | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from("receptionist")
        .select("*")
        .eq("profile_id", profileId)
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
    schedule: any
  ): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from("receptionist")
        .update({
          shift_schedule: schedule,
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

  async createCheckIn(checkInData: CheckInData): Promise<any> {
    try {
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
        })
        .select()
        .single();

      if (error) {
        logger.error("Error creating check-in:", error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error("Repository error in createCheckIn:", error);
      throw error;
    }
  }

  async getQueue(): Promise<QueueItem[]> {
    try {
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
            )
          ),
          patient_check_ins (
            check_in_time,
            status
          )
        `
        )
        .eq("appointment_date", new Date().toISOString().split("T")[0])
        .in("status", ["scheduled", "checked_in", "in_progress"])
        .order("appointment_time", { ascending: true });

      if (error) {
        logger.error("Error getting queue:", error);
        return [];
      }

      // Transform data to QueueItem format
      const queueItems: QueueItem[] = data.map(
        (appointment: any, index: number) => ({
          id: appointment.appointment_id,
          patient_id: appointment.patient_id,
          appointment_id: appointment.appointment_id,
          patient_name: appointment.patients?.profiles?.full_name || "Unknown",
          doctor_name: appointment.doctors?.profiles?.full_name || "Unknown",
          appointment_time: appointment.appointment_time,
          status: appointment.status,
          check_in_time: appointment.patient_check_ins?.[0]?.check_in_time,
          queue_number: index + 1,
          estimated_wait_time: index * 15, // Estimate 15 minutes per patient
        })
      );

      return queueItems;
    } catch (error) {
      logger.error("Repository error in getQueue:", error);
      return [];
    }
  }

  async getDashboardStats(): Promise<any> {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Get today's appointments
      const { data: appointments, error: appointmentsError } =
        await supabaseAdmin
          .from("appointments")
          .select("*")
          .eq("appointment_date", today);

      // Get checked-in patients
      const { data: checkIns, error: checkInsError } = await supabaseAdmin
        .from("patient_check_ins")
        .select("*")
        .gte("check_in_time", `${today}T00:00:00`)
        .lt("check_in_time", `${today}T23:59:59`);

      if (appointmentsError || checkInsError) {
        logger.error("Error getting dashboard stats:", {
          appointmentsError,
          checkInsError,
        });
        return null;
      }

      const stats = {
        todayAppointments: appointments?.length || 0,
        checkedInPatients: checkIns?.length || 0,
        pendingCheckIns:
          appointments?.filter((a) => a.status === "scheduled").length || 0,
        completedAppointments:
          appointments?.filter((a) => a.status === "completed").length || 0,
        averageWaitTime: 15, // Mock data for now
        totalRevenue: 0, // Will be calculated from payments
      };

      return stats;
    } catch (error) {
      logger.error("Repository error in getDashboardStats:", error);
      return null;
    }
  }
}
