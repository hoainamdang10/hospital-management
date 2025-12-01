"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationRoutes = createNotificationRoutes;
const express_1 = require("express");
function createNotificationRoutes(controller) {
    const router = (0, express_1.Router)();
    router.get("/patient/:patientId", controller.getPatientNotifications);
    router.get("/user/:userId", controller.getUserNotifications);
    router.get("/user/:userId/unread-count", controller.getUnreadCount);
    router.patch("/:notificationId/read", controller.markNotificationAsRead);
    return router;
}
//# sourceMappingURL=notificationRoutes.js.map