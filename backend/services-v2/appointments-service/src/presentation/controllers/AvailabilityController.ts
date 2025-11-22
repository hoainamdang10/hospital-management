/**
 * Availability Controller - Presentation Layer
 * V2 Clean Architecture + DDD Implementation
 *
 * Handles HTTP requests for provider availability queries
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, RESTful API, Vietnamese Healthcare Standards
 */

import { Request, Response } from "express";
import { FindAvailableTimeSlotsUseCase } from "../../application/use-cases/FindAvailableTimeSlotsUseCase";
import { IProviderScheduleRepository } from "../../domain/repositories/IProviderScheduleRepository";
import { HttpProviderService } from "../../infrastructure/services/HttpProviderService";

/**
 * Availability Controller
 *
 * Endpoints:
 * - GET /api/appointments/providers/:providerId/available-slots
 * - GET /api/appointments/providers/:providerId/schedule
 */
export class AvailabilityController {
  constructor(
    private readonly findAvailableTimeSlotsUseCase: FindAvailableTimeSlotsUseCase,
    private readonly providerScheduleRepository: IProviderScheduleRepository,
    private readonly httpProviderService: HttpProviderService,
  ) {}

  /**
   * GET /api/appointments/providers/:providerId/available-slots
   *
   * Query params:
   * - date: YYYY-MM-DD (required)
   * - duration: number in minutes (optional, default: 30)
   *
   * Response:
   * {
   *   success: true,
   *   data: {
   *     providerId: string,
   *     date: string,
   *     durationMinutes: number,
   *     availableSlots: AvailableTimeSlotDTO[],
   *     totalSlots: number
   *   }
   * }
   */
  async getAvailableTimeSlots(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.params;
      const { date, duration } = req.query;

      // Validate required params
      if (!date || typeof date !== "string") {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_DATE",
            message: "Date is required in format YYYY-MM-DD",
          },
        });
        return;
      }

      // Parse date
      const appointmentDate = new Date(date);
      if (isNaN(appointmentDate.getTime())) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_DATE_FORMAT",
            message: "Invalid date format. Expected YYYY-MM-DD",
          },
        });
        return;
      }

      // Parse duration (default: 30 minutes)
      const durationMinutes = duration ? parseInt(duration as string, 10) : 30;
      if (isNaN(durationMinutes) || durationMinutes <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_DURATION",
            message: "Duration must be a positive number",
          },
        });
        return;
      }

      // Execute use case
      const availableSlots = await this.findAvailableTimeSlotsUseCase.execute({
        providerId,
        date: appointmentDate,
        durationMinutes,
      });

      // Return response
      res.status(200).json({
        success: true,
        data: {
          providerId,
          date: date,
          durationMinutes,
          availableSlots,
          totalSlots: availableSlots.length,
          message:
            availableSlots.length === 0
              ? "No available slots for this date"
              : `Found ${availableSlots.length} available slots`,
        },
      });
    } catch (error: any) {
      console.error(
        "[AvailabilityController] Error getting available time slots:",
        error,
      );

      // Handle specific errors
      if (error.message.includes("Provider schedule not found")) {
        res.status(404).json({
          success: false,
          error: {
            code: "PROVIDER_SCHEDULE_NOT_FOUND",
            message: error.message,
          },
        });
        return;
      }

      if (
        error.message.includes("required") ||
        error.message.includes("Invalid")
      ) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
          },
        });
        return;
      }

      // Generic error
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get available time slots",
        },
      });
    }
  }

  /**
   * GET /api/appointments/providers/:providerId/schedule
   *
   * Get cached work schedule template for provider
   *
   * Response:
   * {
   *   success: true,
   *   data: {
   *     providerId: string,
   *     workingDays: string[],
   *     workingHours: { start: string, end: string },
   *     timeZone: string,
   *     isFlexible: boolean,
   *     workingHoursPerWeek: number,
   *     effectiveDate: Date | null
   *   }
   * }
   */
  async getProviderSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.params;

      // Get provider schedule
      let schedule =
        await this.providerScheduleRepository.findByProviderId(providerId);

      if (!schedule) {
        console.warn(
          `[AvailabilityController] Cache miss for provider ${providerId}, fetching from Provider Service`,
        );
        schedule = await this.httpProviderService.getWorkSchedule(providerId);

        if (schedule) {
          try {
            await this.providerScheduleRepository.upsert(schedule);
          } catch (cacheError) {
            console.error(
              "[AvailabilityController] Failed to upsert provider schedule cache:",
              cacheError,
            );
          }
        }
      }

      if (!schedule) {
        res.status(404).json({
          success: false,
          error: {
            code: "PROVIDER_SCHEDULE_NOT_FOUND",
            message: `Provider schedule not found for provider: ${providerId}`,
          },
        });
        return;
      }

      // Return schedule
      res.status(200).json({
        success: true,
        data: {
          providerId: schedule.providerId,
          workingDays: schedule.workingDays,
          workingHours: schedule.workingHours,
          timeZone: schedule.timeZone,
          isFlexible: schedule.isFlexible,
          workingHoursPerWeek: schedule.getWorkingHoursPerWeek(),
          workingHoursPerDay: schedule.getWorkingHoursPerDay(),
          isFullTime: schedule.isFullTime(),
          hasWeekendWork: schedule.hasWeekendWork(),
          effectiveDate: schedule.effectiveDate,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt,
        },
      });
    } catch (error: any) {
      console.error(
        "[AvailabilityController] Error getting provider schedule:",
        error,
      );

      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get provider schedule",
        },
      });
    }
  }
}
