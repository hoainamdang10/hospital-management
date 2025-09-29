import logger from "@hospital/shared/dist/utils/logger";
import { ResponseHelper } from "@hospital/shared/dist/utils/response-helpers";
import { Request, Response } from "express";
import {
  AvailabilityQuery,
  AvailabilityService,
} from "../services/availability.service";

export class AvailabilityController {
  private availabilityService: AvailabilityService;

  constructor() {
    this.availabilityService = new AvailabilityService();
  }

  /**
   * GET /api/doctors/:doctorId/availability/:date
   * Get comprehensive doctor availability for a specific date
   */
  getDoctorAvailability = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { doctor_id, date } = req.params;
      const { duration, appointment_type, include_breaks } = req.query;

      logger.info("🔄 [Availability] Getting doctor availability", {
        doctor_id,
        date,
        duration,
        appointment_type,
        include_breaks,
      });

      // Validate date format
      if (!this.isValidDate(date)) {
        res
          .status(400)
          .json(
            ResponseHelper.error(
              "Invalid date format. Use YYYY-MM-DD",
              "INVALID_DATE_FORMAT"
            )
          );
        return;
      }

      const query: AvailabilityQuery = {
        doctor_id: doctor_id,
        date,
        duration: duration ? parseInt(duration as string) : 30,
        appointment_type: appointment_type as string,
        include_breaks: include_breaks === "true",
      };

      const availability =
        await this.availabilityService.getDoctorAvailability(query);

      if (!availability) {
        res
          .status(404)
          .json(
            ResponseHelper.error(
              "Doctor availability not found for the specified date",
              "AVAILABILITY_NOT_FOUND"
            )
          );
        return;
      }

      logger.info(
        "✅ [Availability] Doctor availability retrieved successfully",
        {
          doctor_id,
          date,
          available_slots: availability.available_slots,
          total_slots: availability.total_slots,
        }
      );

      res.json(ResponseHelper.success(availability));
    } catch (error) {
      logger.error(
        "❌ [Availability] Error getting doctor availability:",
        error
      );
      res
        .status(500)
        .json(
          ResponseHelper.error(
            "Internal server error while getting doctor availability",
            "INTERNAL_SERVER_ERROR"
          )
        );
    }
  };

  /**
   * GET /api/doctors/:doctorId/available-slots/:date
   * Get only available time slots for booking
   */
  getAvailableTimeSlots = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { doctor_id, date } = req.params;
      const { duration } = req.query;

      logger.info("🔄 [Availability] Getting available time slots", {
        doctor_id,
        date,
        duration,
      });

      // Validate date format
      if (!this.isValidDate(date)) {
        res
          .status(400)
          .json(
            ResponseHelper.error(
              "Invalid date format. Use YYYY-MM-DD",
              "INVALID_DATE_FORMAT"
            )
          );
        return;
      }

      const slotDuration = duration ? parseInt(duration as string) : 30;
      const availableSlots =
        await this.availabilityService.getAvailableTimeSlots(
          doctor_id,
          date,
          slotDuration
        );

      logger.info(
        "✅ [Availability] Available time slots retrieved successfully",
        {
          doctor_id,
          date,
          slots_count: availableSlots.length,
        }
      );

      res.json(
        ResponseHelper.success({
          doctor_id: doctor_id,
          date,
          slot_duration: slotDuration,
          available_slots: availableSlots,
          total_available: availableSlots.length,
        })
      );
    } catch (error) {
      logger.error(
        "❌ [Availability] Error getting available time slots:",
        error
      );
      res
        .status(500)
        .json(
          ResponseHelper.error(
            "Internal server error while getting available time slots",
            "INTERNAL_SERVER_ERROR"
          )
        );
    }
  };

  /**
   * POST /api/doctors/:doctorId/check-availability
   * Check if a specific time slot is available
   */
  checkTimeSlotAvailability = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { doctor_id } = req.params;
      const { date, start_time, end_time } = req.body;

      logger.info("🔄 [Availability] Checking time slot availability", {
        doctor_id,
        date,
        start_time,
        end_time,
      });

      // Validate required fields
      if (!date || !start_time || !end_time) {
        res
          .status(400)
          .json(
            ResponseHelper.error(
              "Missing required fields: date, start_time, end_time",
              "MISSING_REQUIRED_FIELDS"
            )
          );
        return;
      }

      // Validate date format
      if (!this.isValidDate(date)) {
        res
          .status(400)
          .json(
            ResponseHelper.error(
              "Invalid date format. Use YYYY-MM-DD",
              "INVALID_DATE_FORMAT"
            )
          );
        return;
      }

      // Validate time format
      if (!this.isValidTime(start_time) || !this.isValidTime(end_time)) {
        res
          .status(400)
          .json(
            ResponseHelper.error(
              "Invalid time format. Use HH:MM",
              "INVALID_TIME_FORMAT"
            )
          );
        return;
      }

      const isAvailable = await this.availabilityService.isTimeSlotAvailable(
        doctor_id,
        date,
        start_time,
        end_time
      );

      logger.info("✅ [Availability] Time slot availability checked", {
        doctor_id,
        date,
        start_time,
        end_time,
        is_available: isAvailable,
      });

      res.json(
        ResponseHelper.success({
          doctor_id: doctor_id,
          date,
          start_time,
          end_time,
          is_available: isAvailable,
          checked_at: new Date().toISOString(),
        })
      );
    } catch (error) {
      logger.error(
        "❌ [Availability] Error checking time slot availability:",
        error
      );
      res
        .status(500)
        .json(
          ResponseHelper.error(
            "Internal server error while checking time slot availability",
            "INTERNAL_SERVER_ERROR"
          )
        );
    }
  };

  /**
   * GET /api/doctors/:doctorId/availability/week/:startDate
   * Get doctor availability for a week
   */
  getWeeklyAvailability = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { doctor_id, startDate } = req.params;
      const { duration } = req.query;

      logger.info("🔄 [Availability] Getting weekly availability", {
        doctor_id,
        startDate,
        duration,
      });

      // Validate date format
      if (!this.isValidDate(startDate)) {
        res
          .status(400)
          .json(
            ResponseHelper.error(
              "Invalid date format. Use YYYY-MM-DD",
              "INVALID_DATE_FORMAT"
            )
          );
        return;
      }

      const slotDuration = duration ? parseInt(duration as string) : 30;
      const weeklyAvailability = [];

      // Get availability for 7 days starting from startDate
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);
        const dateStr = currentDate.toISOString().split("T")[0];

        const availability =
          await this.availabilityService.getDoctorAvailability({
            doctor_id: doctor_id,
            date: dateStr,
            duration: slotDuration,
          });

        weeklyAvailability.push({
          date: dateStr,
          day_of_week: currentDate.getDay(),
          day_name: currentDate.toLocaleDateString("vi-VN", {
            weekday: "long",
          }),
          availability: availability,
        });
      }

      logger.info(
        "✅ [Availability] Weekly availability retrieved successfully",
        {
          doctor_id,
          startDate,
          days_retrieved: weeklyAvailability.length,
        }
      );

      res.json(
        ResponseHelper.success({
          doctor_id: doctor_id,
          start_date: startDate,
          slot_duration: slotDuration,
          weekly_availability: weeklyAvailability,
        })
      );
    } catch (error) {
      logger.error(
        "❌ [Availability] Error getting weekly availability:",
        error
      );
      res
        .status(500)
        .json(
          ResponseHelper.error(
            "Internal server error while getting weekly availability",
            "INTERNAL_SERVER_ERROR"
          )
        );
    }
  };

  /**
   * Validate date format (YYYY-MM-DD)
   */
  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Validate time format (HH:MM)
   */
  private isValidTime(timeString: string): boolean {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(timeString);
  }
}
