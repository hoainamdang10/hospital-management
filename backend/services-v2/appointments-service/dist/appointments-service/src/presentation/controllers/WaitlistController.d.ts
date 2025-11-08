/**
 * WaitlistController - Presentation Layer
 * Handles HTTP requests for appointment waitlist management
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, REST API
 */
import { Request, Response } from 'express';
import { AddToWaitlistUseCase } from '../../application/use-cases/AddToWaitlistUseCase';
import { GetWaitlistUseCase } from '../../application/use-cases/GetWaitlistUseCase';
import { UpdateWaitlistEntryUseCase } from '../../application/use-cases/UpdateWaitlistEntryUseCase';
import { RemoveFromWaitlistUseCase } from '../../application/use-cases/RemoveFromWaitlistUseCase';
import { ConvertWaitlistToAppointmentUseCase } from '../../application/use-cases/ConvertWaitlistToAppointmentUseCase';
/**
 * Waitlist Controller
 */
export declare class WaitlistController {
    private readonly addToWaitlistUseCase;
    private readonly getWaitlistUseCase;
    private readonly updateWaitlistEntryUseCase;
    private readonly removeFromWaitlistUseCase;
    private readonly convertWaitlistToAppointmentUseCase;
    constructor(addToWaitlistUseCase: AddToWaitlistUseCase, getWaitlistUseCase: GetWaitlistUseCase, updateWaitlistEntryUseCase: UpdateWaitlistEntryUseCase, removeFromWaitlistUseCase: RemoveFromWaitlistUseCase, convertWaitlistToAppointmentUseCase: ConvertWaitlistToAppointmentUseCase);
    /**
     * POST /api/v1/appointments/waitlist
     * Add patient to waitlist
     */
    addToWaitlist(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/v1/appointments/waitlist
     * Get waitlist entries with filters
     */
    getWaitlist(req: Request, res: Response): Promise<void>;
    /**
     * PUT /api/v1/appointments/waitlist/:waitlistId
     * Update waitlist entry
     */
    updateWaitlistEntry(req: Request, res: Response): Promise<void>;
    /**
     * DELETE /api/v1/appointments/waitlist/:waitlistId
     * Remove from waitlist (cancel)
     */
    removeFromWaitlist(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/v1/appointments/waitlist/:waitlistId/convert
     * Convert waitlist entry to appointment
     */
    convertToAppointment(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=WaitlistController.d.ts.map