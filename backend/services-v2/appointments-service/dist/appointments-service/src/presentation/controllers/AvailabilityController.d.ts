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
import { Request, Response } from 'express';
import { FindAvailableTimeSlotsUseCase } from '../../application/use-cases/FindAvailableTimeSlotsUseCase';
import { IProviderScheduleRepository } from '../../domain/repositories/IProviderScheduleRepository';
/**
 * Availability Controller
 *
 * Endpoints:
 * - GET /api/appointments/providers/:providerId/available-slots
 * - GET /api/appointments/providers/:providerId/schedule
 */
export declare class AvailabilityController {
    private readonly findAvailableTimeSlotsUseCase;
    private readonly providerScheduleRepository;
    constructor(findAvailableTimeSlotsUseCase: FindAvailableTimeSlotsUseCase, providerScheduleRepository: IProviderScheduleRepository);
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
    getAvailableTimeSlots(req: Request, res: Response): Promise<void>;
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
    getProviderSchedule(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=AvailabilityController.d.ts.map