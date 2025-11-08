"use strict";
/**
 * AuditController - Presentation Layer
 * REST API controller for HIPAA audit logs
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Clean Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const BaseController_1 = require("./BaseController");
class AuditController extends BaseController_1.BaseController {
    constructor(getAuditLogsUseCase) {
        super();
        this.getAuditLogsUseCase = getAuditLogsUseCase;
    }
    /**
     * @swagger
     * /api/v2/clinical-emr/audit-logs:
     *   get:
     *     summary: Get PHI access audit logs (HIPAA compliance)
     *     tags: [Audit]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: patientId
     *         schema:
     *           type: string
     *         description: Filter by patient ID
     *       - in: query
     *         name: userId
     *         schema:
     *           type: string
     *         description: Filter by user ID
     *       - in: query
     *         name: action
     *         schema:
     *           type: string
     *           enum: [read, write, print, export, delete, update]
     *         description: Filter by action type
     *       - in: query
     *         name: startDate
     *         schema:
     *           type: string
     *           format: date-time
     *         description: Start date for filtering
     *       - in: query
     *         name: endDate
     *         schema:
     *           type: string
     *           format: date-time
     *         description: End date for filtering
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: Page number
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 50
     *           maximum: 100
     *         description: Items per page
     *     responses:
     *       200:
     *         description: Audit logs retrieved successfully
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden - Insufficient permissions
     *       500:
     *         description: Internal server error
     */
    async getAuditLogs(req, res) {
        try {
            const { patientId, userId, action, startDate, endDate, page, limit } = req.query;
            const requestedBy = req.user?.id || 'unknown';
            const requestedByRole = req.user?.role || 'unknown';
            this.logger.info('Getting audit logs', {
                requestedBy,
                requestedByRole,
                filters: { patientId, userId, action, startDate, endDate }
            });
            const result = await this.getAuditLogsUseCase.execute({
                patientId: patientId,
                userId: userId,
                action: action,
                startDate: startDate,
                endDate: endDate,
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 50,
                requestedBy,
                requestedByRole
            });
            if (!result.success) {
                this.logger.warn('Failed to get audit logs', {
                    message: result.message,
                    errors: result.errors
                });
                if (result.errors?.some(e => e.code === 'FORBIDDEN')) {
                    res.status(403).json(result);
                    return;
                }
                res.status(400).json(result);
                return;
            }
            this.logger.info('Audit logs retrieved successfully', {
                total: result.data?.pagination.total,
                page: result.data?.pagination.page
            });
            res.status(200).json(result);
        }
        catch (error) {
            this.logger.error('Error getting audit logs', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống khi lấy audit logs',
                errors: [{ field: 'system', message: error instanceof Error ? error.message : 'Unknown', code: 'INTERNAL_ERROR' }]
            });
        }
    }
}
exports.AuditController = AuditController;
//# sourceMappingURL=AuditController.js.map