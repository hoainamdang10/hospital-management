/**
 * Staff Controller
 * Handles HTTP requests for staff management
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { Request, Response } from 'express';
import { RegisterStaffUseCase } from '../../application/use-cases/RegisterStaffUseCase';
import { GetStaffProfileUseCase } from '../../application/use-cases/GetStaffProfileUseCase';
export declare class StaffController {
    private readonly registerStaffUseCase;
    private readonly getStaffProfileUseCase;
    constructor(registerStaffUseCase: RegisterStaffUseCase, getStaffProfileUseCase: GetStaffProfileUseCase);
    /**
     * Register new staff member
     * POST /api/staff
     */
    registerStaff(req: Request, res: Response): Promise<void>;
    /**
     * Get staff profile by ID
     * GET /api/staff/:id
     */
    getStaffProfile(req: Request, res: Response): Promise<void>;
    /**
     * Health check endpoint
     * GET /health
     */
    healthCheck(_req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=StaffController.d.ts.map