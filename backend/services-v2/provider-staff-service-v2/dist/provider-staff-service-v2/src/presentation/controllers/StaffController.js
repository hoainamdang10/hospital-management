"use strict";
/**
 * Staff Controller
 * Handles HTTP requests for staff management
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffController = void 0;
class StaffController {
    constructor(registerStaffUseCase, getStaffProfileUseCase) {
        this.registerStaffUseCase = registerStaffUseCase;
        this.getStaffProfileUseCase = getStaffProfileUseCase;
    }
    /**
     * Register new staff member
     * POST /api/staff
     */
    async registerStaff(req, res) {
        try {
            const result = await this.registerStaffUseCase.execute(req.body);
            if (result.success) {
                res.status(201).json(result);
            }
            else {
                res.status(400).json(result);
            }
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    }
    /**
     * Get staff profile by ID
     * GET /api/staff/:id
     */
    async getStaffProfile(req, res) {
        try {
            const result = await this.getStaffProfileUseCase.execute({
                staffId: req.params.id
            });
            if (result.success) {
                res.status(200).json(result);
            }
            else {
                res.status(404).json(result);
            }
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    }
    /**
     * Health check endpoint
     * GET /health
     */
    async healthCheck(_req, res) {
        res.status(200).json({
            status: 'healthy',
            service: 'provider-staff-service',
            version: '2.0.0',
            timestamp: new Date().toISOString()
        });
    }
}
exports.StaffController = StaffController;
//# sourceMappingURL=StaffController.js.map