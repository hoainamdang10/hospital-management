import { Router } from "express";
import { PrescriptionController } from "../controllers/PrescriptionController";
import { requireRoles } from "../middlewares/auth.middleware";

export function createPrescriptionRouter(
  controller: PrescriptionController,
): Router {
  const router = Router({ mergeParams: true });
  router.get("/", controller.list);
  router.post("/", requireRoles("doctor", "nurse", "admin"), controller.create);
  router.delete(
    "/:prescriptionId",
    requireRoles("doctor", "nurse", "admin"),
    controller.delete,
  );
  return router;
}
