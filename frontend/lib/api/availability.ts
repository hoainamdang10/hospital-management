import { createClient } from "@/lib/supabase/client";

interface TimeSlot {
  time: string;
  status: "available" | "booked" | "break";
  patient_name?: string;
  appointment_type?: string;
  start_time: string;
  end_time: string;
}

interface AvailabilityResponse {
  doctor_id: string;
  date: string;
  is_working_day: boolean;
  start_time: string;
  end_time: string;
  break_start?: string;
  break_end?: string;
  total_slots: number;
  available_slots: number;
  booked_slots: number;
  time_slots: TimeSlot[];
}

interface AvailabilityCheckRequest {
  date: string;
  start_time: string;
  end_time: string;
}

class AvailabilityAPI {
  private apiUrl: string;

  constructor() {
    this.apiUrl =
      process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:3100";
  }

  private async getAuthHeaders() {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return {
      "Content-Type": "application/json",
      Authorization: session?.access_token
        ? `Bearer ${session.access_token}`
        : "",
    };
  }

  /**
   * Get comprehensive doctor availability for a specific date
   */
  async getDoctorAvailability(
    doctorId: string,
    date: string,
    options?: {
      duration?: number;
      appointment_type?: string;
      include_breaks?: boolean;
    }
  ): Promise<{
    success: boolean;
    data?: AvailabilityResponse;
    error?: string;
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const params = new URLSearchParams();

      if (options?.duration)
        params.append("duration", options.duration.toString());
      if (options?.appointment_type)
        params.append("appointment_type", options.appointment_type);
      if (options?.include_breaks)
        params.append("include_breaks", options.include_breaks.toString());

      const url = `${this.apiUrl}/api/doctors/${doctorId}/availability/${date}${
        params.toString() ? "?" + params.toString() : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to get doctor availability");
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error("Error getting doctor availability:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get only available time slots for booking
   */
  async getAvailableTimeSlots(
    doctorId: string,
    date: string,
    duration: number = 30
  ): Promise<{ success: boolean; data?: TimeSlot[]; error?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${this.apiUrl}/api/doctors/${doctorId}/available-slots/${date}?duration=${duration}`;

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to get available time slots");
      }

      // Extract only available slots
      const availableSlots =
        result.data?.time_slots?.filter(
          (slot: TimeSlot) => slot.status === "available"
        ) || [];

      return {
        success: true,
        data: availableSlots,
      };
    } catch (error) {
      console.error("Error getting available time slots:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check if a specific time slot is available
   */
  async checkTimeSlotAvailability(
    doctorId: string,
    checkData: AvailabilityCheckRequest
  ): Promise<{
    success: boolean;
    data?: { available: boolean; reason?: string };
    error?: string;
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${this.apiUrl}/api/doctors/${doctorId}/check-availability`;

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(checkData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to check time slot availability"
        );
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error("Error checking time slot availability:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get weekly availability overview
   */
  async getWeeklyAvailability(
    doctorId: string,
    startDate: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${this.apiUrl}/api/doctors/${doctorId}/availability/week/${startDate}`;

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to get weekly availability");
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error("Error getting weekly availability:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const availabilityApi = new AvailabilityAPI();
export type { AvailabilityCheckRequest, AvailabilityResponse, TimeSlot };

