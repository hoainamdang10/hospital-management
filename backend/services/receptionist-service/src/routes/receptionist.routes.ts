import express from 'express';
import { ReceptionistController } from '../controllers/receptionist.controller';
import { authMiddleware, requireReceptionistOrAdmin } from '../middleware/auth.middleware';

const router = express.Router();
const receptionistController = new ReceptionistController();

/**
 * @swagger
 * /api/receptionists/profile:
 *   get:
 *     summary: Get current receptionist profile
 *     tags: [Receptionist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Receptionist profile retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Receptionist not found
 */
router.get('/profile', authMiddleware, receptionistController.getMyProfile);

/**
 * @swagger
 * /api/receptionists/{receptionistId}:
 *   get:
 *     summary: Get receptionist profile by ID
 *     tags: [Receptionist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: receptionistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Receptionist ID
 *     responses:
 *       200:
 *         description: Receptionist profile retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Receptionist not found
 */
router.get('/:receptionistId', authMiddleware, receptionistController.getProfile);

/**
 * @swagger
 * /api/receptionists/{receptionistId}/schedule:
 *   put:
 *     summary: Update receptionist shift schedule
 *     tags: [Receptionist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: receptionistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Receptionist ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - schedule
 *             properties:
 *               schedule:
 *                 type: object
 *                 description: Shift schedule data
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Access denied
 */
router.put('/:receptionistId/schedule', authMiddleware, receptionistController.updateShiftSchedule);

/**
 * @swagger
 * /api/receptionists/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Receptionist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/dashboard/stats', authMiddleware, requireReceptionistOrAdmin, receptionistController.getDashboardStats);

export default router;
