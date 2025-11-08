/**
 * AuditController - Presentation Layer
 * REST API controller for HIPAA audit logs
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Clean Architecture
 */
import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { GetAuditLogsUseCase } from '../../application/use-cases/GetAuditLogsUseCase';
export declare class AuditController extends BaseController {
    private readonly getAuditLogsUseCase;
    constructor(getAuditLogsUseCase: GetAuditLogsUseCase);
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
    getAuditLogs(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=AuditController.d.ts.map