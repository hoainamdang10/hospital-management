import { Router } from "express";
import { NotificationController } from "../controllers/NotificationController";

export function createNotificationRoutes(
  controller: NotificationController,
): Router {
  const router = Router();

  router.get("/patient/:patientId", controller.getPatientNotifications);
  router.get("/user/:userId", controller.getUserNotifications);
  router.get("/user/:userId/unread-count", controller.getUnreadCount);
  router.patch("/:notificationId/read", controller.markNotificationAsRead);

  return router;
}
