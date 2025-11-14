"use strict";
/**
 * notificationRoutes - Simplified Presentation Routes
 * Express routes for core notification operations with Vietnamese healthcare context
 *
 * @author Hospital Management Team
 * @version 2.0.0-simplified
 * @compliance Clean Architecture, REST API, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationRoutes = createNotificationRoutes;
const express_1 = require("express");
function createNotificationRoutes(controller) {
    const router = (0, express_1.Router)();
    /**
     * Send notification immediately
     * POST /api/v1/notifications/send
     */
    router.post('/send', async (req, res) => {
        await controller.sendNotification(req, res);
    });
    /**
     * Get notification by ID
     * GET /api/v1/notifications/:notificationId
     */
    router.get('/:notificationId', async (req, res) => {
        await controller.getNotification(req, res);
    });
    /**
     * Get user notification preferences
     * GET /api/v1/notifications/preferences/:userId
     */
    router.get('/preferences/:userId', async (req, res) => {
        await controller.getNotificationPreferences(req, res);
    });
    /**
     * Update notification preferences
     * PUT /api/v1/notifications/preferences/:userId
     */
    router.put('/preferences/:userId', async (req, res) => {
        await controller.updatePreferences(req, res);
    });
    /**
     * Mark notification as read/unread
     * POST /api/v1/notifications/:id/mark-read
     */
    router.post('/:id/mark-read', async (req, res) => {
        await controller.markAsRead(req, res);
    });
    /**
     * Get user notifications list with pagination
     * GET /api/v1/notifications/user/:userId
     */
    router.get('/user/:userId', async (req, res) => {
        await controller.getUserNotifications(req, res);
    });
    return router;
}
//# sourceMappingURL=notificationRoutes.js.map