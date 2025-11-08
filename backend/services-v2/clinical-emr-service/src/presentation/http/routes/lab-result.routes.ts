import { Router } from "express";
import { LabResultController } from "../controllers/LabResultController";
import { requireRoles } from "../middlewares/auth.middleware";

export function createLabResultRouter(controller: LabResultController): Router {
  const router = Router({ mergeParams: true });
  router.get("/", controller.list);
  router.post("/", requireRoles("doctor", "nurse", "admin"), controller.create);
  router.delete(
    "/:resultId",
    requireRoles("doctor", "nurse", "admin"),
    controller.delete,
  );
  return router;
}
