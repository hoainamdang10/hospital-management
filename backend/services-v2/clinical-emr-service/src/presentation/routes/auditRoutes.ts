/**
 * Audit Routes - Presentation Layer
 * Routes for HIPAA audit logs
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Router } from 'express';
import { AuditController } from '../controllers/AuditController';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { query } from 'express-validator';

export function createAuditRoutes(auditController: AuditController): Router {
  const router = Router();

  /**
   * GET /api/v2/clinical-emr/audit-logs
   * Get PHI access audit logs (HIPAA compliance)
   * Authorization: SUPER_ADMIN, ADMIN, COMPLIANCE_OFFICER only
   */
  router.get(
    '/audit-logs',
    authenticateJWT,
    [
      query('patientId').optional().isString(),
      query('userId').optional().isString(),
      query('action').optional().isIn(['read', 'write', 'print', 'export', 'delete', 'update']),
      query('startDate').optional().isISO8601(),
      query('endDate').optional().isISO8601(),
      query('page').optional().isInt({ min: 1 }).toInt(),
      query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
    ],
    validateRequest,
    (req, res) => auditController.getAuditLogs(req, res)
  );

  return router;
}

