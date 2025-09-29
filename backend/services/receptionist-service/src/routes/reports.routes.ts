import express from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { authMiddleware, requireReceptionistOrAdmin } from '../middleware/auth.middleware';

const router = express.Router();
const reportsController = new ReportsController();

/**
 * @swagger
 * /api/reports/daily:
 *   get:
 *     summary: Get daily activity report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Report date (defaults to today)
 *     responses:
 *       200:
 *         description: Daily report generated successfully
 *       403:
 *         description: Access denied
 */
router.get('/daily', authMiddleware, requireReceptionistOrAdmin, reportsController.getDailyReport);

/**
 * @swagger
 * /api/reports/weekly:
 *   get:
 *     summary: Get weekly summary report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date of the week
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date of the week
 *     responses:
 *       200:
 *         description: Weekly report generated successfully
 *       400:
 *         description: Start date and end date required
 *       403:
 *         description: Access denied
 */
router.get('/weekly', authMiddleware, requireReceptionistOrAdmin, reportsController.getWeeklyReport);

/**
 * @swagger
 * /api/reports/patient-flow:
 *   get:
 *     summary: Get patient flow report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Report date (defaults to today)
 *     responses:
 *       200:
 *         description: Patient flow report generated successfully
 *       403:
 *         description: Access denied
 */
router.get('/patient-flow', authMiddleware, requireReceptionistOrAdmin, reportsController.getPatientFlowReport);

export default router;
