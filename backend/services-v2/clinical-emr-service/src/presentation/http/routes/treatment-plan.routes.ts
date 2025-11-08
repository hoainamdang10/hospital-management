import { Router } from "express";
import { TreatmentPlanController } from "../controllers/TreatmentPlanController";
import { requireRoles } from "../middlewares/auth.middleware";

export function createTreatmentPlanRouter(
  controller: TreatmentPlanController,
): Router {
  const router = Router({ mergeParams: true });
  router.get("/", controller.list);
  router.post("/", requireRoles("doctor", "nurse", "admin"), controller.create);
  router.patch(
    "/:planId/status",
    requireRoles("doctor", "nurse", "admin"),
    controller.updateStatus,
  );
  router.delete(
    "/:planId",
    requireRoles("doctor", "nurse", "admin"),
    controller.delete,
  );
  return router;
}
