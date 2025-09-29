import express from 'express';
import { SessionController } from '../controllers/session.controller';
import { authMiddleware, requireAdmin } from '../middleware/auth.middleware';

const router = express.Router();
const sessionController = new SessionController();

/**
 * @swagger
 * /api/sessions/current:
 *   get:
 *     summary: Get current session info
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current session information
 *       401:
 *         description: Unauthorized
 */
router.get('/current', authMiddleware, sessionController.getCurrentSession);

/**
 * @swagger
 * /api/sessions/all:
 *   get:
 *     summary: Get all active sessions for current user
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User sessions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/all', authMiddleware, sessionController.getUserSessions);

/**
 * @swagger
 * /api/sessions/revoke-all:
 *   post:
 *     summary: Revoke all sessions for current user
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All sessions revoked successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/revoke-all', authMiddleware, sessionController.revokeAllSessions);

/**
 * @swagger
 * /api/sessions/admin/all:
 *   get:
 *     summary: Get all active sessions (Admin only)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All sessions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/admin/all', authMiddleware, requireAdmin, sessionController.getAllSessions);

/**
 * @swagger
 * /api/sessions/admin/{userId}/revoke:
 *   post:
 *     summary: Revoke all sessions for a specific user (Admin only)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User sessions revoked successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 */
router.post('/admin/:userId/revoke', authMiddleware, requireAdmin, sessionController.revokeUserSessions);

export default router;
